const express = require('express');
const router = express.Router();
const { registerRestaurant, login, seedDemoAccounts } = require('../controllers/authController');

router.post('/register-restaurant', registerRestaurant);
router.post('/login', login);
router.post('/seed-demo', seedDemoAccounts);
router.get('/seed-demo', seedDemoAccounts);

module.exports = router;
