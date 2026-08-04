const express = require('express');
const router = express.Router();
const { registerRestaurant, login } = require('../controllers/authController');

router.post('/register-restaurant', registerRestaurant);
router.post('/login', login);

module.exports = router;
