const { TransactionService } = require('../services/transactionService');

class TransactionController {
  static async processTransaction(req, res) {
    try {
      const result = await TransactionService.processTransaction(req.body);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async topUp(req, res) {
    try {
      const { userId, amount, metadata } = req.body;
      const result = await TransactionService.processTransaction({
        userId,
        amount,
        type: 'top-up',
        metadata
      });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async paySession(req, res) {
    try {
      const { userId, amount, metadata } = req.body;
      const result = await TransactionService.processTransaction({
        userId,
        amount,
        type: 'session-payment',
        metadata
      });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async refund(req, res) {
    try {
      const { userId, amount, metadata } = req.body;
      const result = await TransactionService.processTransaction({
        userId,
        amount,
        type: 'refund',
        metadata
      });
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async getHistory(req, res) {
    try {
      const userId = req.user?.id || req.query.userId;
      const limit = Number(req.query.limit) || 20;
      const offset = Number(req.query.offset) || 0;

      const history = await TransactionService.getUserHistory(userId, { limit, offset });
      return res.status(200).json(history);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = TransactionController;