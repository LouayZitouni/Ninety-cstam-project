const { protect } = require('../middlewares/auth');
const {isAdmin} = require('../middlewares/roleCheck');

const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');

router.post('/process',protect, TransactionController.processTransaction);
router.post('/top-up',protect, TransactionController.topUp);
router.post('/pay-session',protect, TransactionController.paySession);
router.post('/refund',protect, TransactionController.refund);
router.get('/history',protect, TransactionController.getHistory);

module.exports = router;