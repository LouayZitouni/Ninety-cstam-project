const express = require('express');
const { register, login , getMe , deleteUser , logout , refresh } = require('../controllers/authController');
const isAdmin = require('../middlewares/roleCheck');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.delete('/:email' ,protect,isAdmin, deleteUser);
router.post('/logout', protect, logout);
router.post('/refresh-token', refresh);

module.exports = router;