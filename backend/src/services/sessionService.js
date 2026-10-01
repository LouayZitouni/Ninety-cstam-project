const sessionRepoImport = require('../infrastructure/database/sessionRepository');
const SessionRepository = sessionRepoImport.SessionRepository || sessionRepoImport;
const { TransactionService } = require('./transactionService');
const rawPool = require('../infrastructure/database/postgresPool');
const pool = rawPool.pool || rawPool;

class SessionService {
  /**
   * Démarrer une session (billingType: 'postpaid' | 'prepaid')
   */
  static async startSession({ userId, stationId, hourlyRate, billingType = 'postpaid', durationHours }) {
    // 1. Vérification des sessions actives de l'utilisateur
    const activeSessions = await SessionRepository.findActiveByUserId(userId);
    if (activeSessions && activeSessions.length > 0) {
      throw new Error(`L'utilisateur ${userId} a déjà une session active.`);
    }

    const rate = Number(hourlyRate) || 5.0;
    const cleanBillingType = (billingType || '').toString().trim().toLowerCase();

    // --- MODE PRÉPAYÉ (PREPAID_FIXED) ---
    if (cleanBillingType === 'prepaid' || cleanBillingType === 'prepaid_fixed') {
      if (!durationHours || Number(durationHours) <= 0) {
        throw new Error('durationHours doit être un nombre positif pour les sessions prépayées.');
      }

      const prepaidCost = Number((Number(durationHours) * rate).toFixed(2));
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Débit atomique immédiat sur le portefeuille
        const transaction = await TransactionService.processTransaction(
          {
            userId,
            amount: prepaidCost,
            type: 'session-payment',
            metadata: {
              stationId,
              billingType: 'PREPAID_FIXED',
              durationHours: Number(durationHours)
            }
          },
          client
        );

        // Création de la session (sessionRepository mappera 'prepaid' vers 'PREPAID_FIXED')
        const session = await SessionRepository.create(
          {
            userId,
            stationId,
            billingType: 'prepaid',
            totalCost: prepaidCost
          },
          client
        );

        await client.query('COMMIT');

        return {
          session,
          transaction,
          billingType: 'prepaid'
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } 

    // --- MODE POSTPAYÉ / PAY-AS-YOU-GO (OPEN_ENDED) ---
    else {
      const userRes = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length === 0) {
        throw new Error(`L'utilisateur ${userId} n'existe pas.`);
      }

      const currentBalance = Number(userRes.rows[0].balance);
      if (currentBalance < rate) {
        throw new Error(`Solde insuffisant pour démarrer la session. Minimum requis : ${rate}, Disponible : ${currentBalance}`);
      }

      const session = await SessionRepository.create({
        userId,
        stationId,
        billingType: 'postpaid',
        totalCost: 0.00
      });

      return {
        session,
        billingType: 'postpaid'
      };
    }
  }

  /**
   * Arrêter une session, calculer le coût exact et régulariser la facturation
   */
  static async stopSession(sessionId) {
    const session = await SessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session introuvable.');
    }

    const currentStatus = (session.status || '').toUpperCase();
    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
      throw new Error('Impossible d\'arrêter une session déjà terminée ou annulée.');
    }

    const userId = session.userId || session.user_id;
    const stationId = session.stationId || session.station_id;
    const startTime = new Date(session.startTime || session.created_at || session.start_time);
    const endTime = new Date();
    
    const rate = 5.0; // Tarif horaire par défaut

    // Calcul du temps écoulé (minimum 1 minute)
    const elapsedHours = Math.max((endTime - startTime) / (1000 * 60 * 60), 1 / 60);
    const calculatedCost = Number((elapsedHours * rate).toFixed(2));

    const initialPrepaidCost = Number(session.totalCost || session.total_cost || 0);
    const rawBilling = (session.billingType || session.billing_type || '').toUpperCase();
    
    // Détection du mode prépayé selon les ENUMs 'PREPAID_FIXED' ou 'PREPAID'
    const isPrepaid = rawBilling === 'PREPAID_FIXED' || rawBilling === 'PREPAID';

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let finalCost = calculatedCost;
      let transaction = null;

      if (isPrepaid) {
        if (finalCost < initialPrepaidCost) {
          // Arrêt anticipé : Remboursement de la partie non consommée
          const refundAmount = Number((initialPrepaidCost - finalCost).toFixed(2));
          transaction = await TransactionService.processTransaction(
            {
              userId,
              amount: refundAmount,
              type: 'refund',
              metadata: {
                sessionId: session.id,
                stationId,
                reason: 'Remboursement temps prépayé non utilisé'
              }
            },
            client
          );
        } else if (finalCost > initialPrepaidCost) {
          // Dépassement : Débit du montant supplémentaire
          const extraAmount = Number((finalCost - initialPrepaidCost).toFixed(2));
          transaction = await TransactionService.processTransaction(
            {
              userId,
              amount: extraAmount,
              type: 'session-payment',
              metadata: {
                sessionId: session.id,
                stationId,
                reason: 'Débit dépassement session prépayée'
              }
            },
            client
          );
        }
      } else {
        // Mode Postpayé : Règlement total à la fin de la session
        finalCost = calculatedCost > 0 ? calculatedCost : rate;

        transaction = await TransactionService.processTransaction(
          {
            userId,
            amount: finalCost,
            type: 'session-payment',
            metadata: {
              sessionId: session.id,
              stationId
            }
          },
          client
        );
      }

      // Marquer la session comme COMPLETED avec son coût final
      const completedSession = await SessionRepository.complete(sessionId, finalCost, client);

      await client.query('COMMIT');

      return {
        session: completedSession,
        transaction
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mettre en pause ou reprendre une session
   */
  static async togglePauseSession(sessionId) {
    const session = await SessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session introuvable.');
    }

    const status = (session.status || '').toUpperCase();
    if (status === 'ACTIVE') {
      return await SessionRepository.updateStatus(sessionId, 'PAUSED');
    } else if (status === 'PAUSED') {
      return await SessionRepository.updateStatus(sessionId, 'ACTIVE');
    } else {
      throw new Error(`Impossible de modifier le statut d'une session actuellement '${session.status}'.`);
    }
  }

  /**
   * Annuler une session
   */
  static async cancelSession(sessionId) {
    const session = await SessionRepository.findById(sessionId);
    if (!session) {
      throw new Error('Session introuvable.');
    }

    const status = (session.status || '').toUpperCase();
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      throw new Error('Impossible d\'annuler une session déjà terminée ou annulée.');
    }

    return await SessionRepository.updateStatus(sessionId, 'CANCELLED');
  }

  /**
   * Récupérer les sessions actives d'un utilisateur
   */
  static async getActiveSessions(userId) {
    return await SessionRepository.findActiveByUserId(userId);
  }
}

module.exports = { SessionService };