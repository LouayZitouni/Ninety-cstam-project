const express = require('express');
const { register, login ,deleteUser } = require('../controllers/authController');
const isAdmin = require('../middlewares/roleCheck');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.delete('/:email' ,protect,isAdmin, deleteUser);

module.exports = router;