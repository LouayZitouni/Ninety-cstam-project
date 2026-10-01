const TransactionRepository = require('../infrastructure/database/transactionRepository');
const dbPool = require('../infrastructure/database/postgresPool');

const pool = dbPool.pool || dbPool;

// Maps API input strings to PostgreSQL ENUM values
const TYPE_MAP = {
  'top-up': 'DEPOSIT',
  'deposit': 'DEPOSIT',
  'session-payment': 'SESSION_PAYMENT',
  'session_payment': 'SESSION_PAYMENT',
  'refund': 'REFUND',
  'withdrawal': 'WITHDRAWAL'
};

class InsufficientBalanceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class TransactionService {
  static async processTransaction({ userId, amount, type, metadata = {} }, clientParam = null) {
    const numericAmount = Number(amount);
    const validTypes = ['top-up', 'session-payment', 'refund', 'withdrawal', 'deposit'];

    if (!userId) {
      throw new ValidationError('User ID is required.');
    }

    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new ValidationError('Amount must be a positive number greater than zero.');
    }

    const dbType = TYPE_MAP[type] || type.toUpperCase();

    if (!['DEPOSIT', 'SESSION_PAYMENT', 'REFUND', 'WITHDRAWAL'].includes(dbType)) {
      throw new ValidationError(`Invalid transaction type. Valid types are: ${validTypes.join(', ')}`);
    }

    const client = clientParam || (await pool.connect());
    const isExternalClient = !!clientParam;

    try {
      if (!isExternalClient) await client.query('BEGIN');

      const userResult = await client.query(
        'SELECT balance FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new NotFoundError(`User with ID ${userId} does not exist.`);
      }

      const currentBalance = Number(userResult.rows[0].balance);

      // Debit operations reduce user balance
      const isDebit = dbType === 'SESSION_PAYMENT' || dbType === 'WITHDRAWAL';

      if (isDebit && currentBalance < numericAmount) {
        throw new InsufficientBalanceError(
          `Insufficient wallet balance. Available: ${currentBalance}, Required: ${numericAmount}`
        );
      }

      const balanceDelta = isDebit ? -numericAmount : numericAmount;

      const updateResult = await client.query(
        `UPDATE users 
         SET balance = balance + $1 
         WHERE id = $2 
         RETURNING balance`,
        [balanceDelta, userId]
      );

      const newBalance = Number(updateResult.rows[0].balance);

      const record = await TransactionRepository.create(
        {
          userId,
          amount: numericAmount,
          type: dbType // Inserts 'DEPOSIT', 'SESSION_PAYMENT', or 'REFUND'
        },
        client
      );

      if (!isExternalClient) await client.query('COMMIT');

      return {
        transactionId: record.id,
        userId,
        type: dbType,
        amount: numericAmount,
        previousBalance: currentBalance,
        newBalance,
        createdAt: record.created_at
      };

    } catch (error) {
      if (!isExternalClient) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (!isExternalClient) client.release();
    }
  }

  static async getUserHistory(userId, options = {}) {
    if (!userId) {
      throw new ValidationError('User ID is required to fetch transaction history.');
    }
    return await TransactionRepository.getByUserId(userId, options);
  }
}

module.exports = {
  TransactionService,
  InsufficientBalanceError,
  NotFoundError,
  ValidationError
};