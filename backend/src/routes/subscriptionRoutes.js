const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middlewares/auth');

router.get('/plans', subscriptionController.getPlans);
router.post('/', auth, subscriptionController.subscribe);
router.get('/me', auth, subscriptionController.getMySubscription);

module.exports = router;