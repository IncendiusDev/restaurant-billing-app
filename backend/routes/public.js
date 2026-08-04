const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/publicController');

router.get('/:slug/menu', ctrl.getPublicMenu);
router.post('/:slug/orders', ctrl.createPublicOrder);
router.get('/:slug/orders/:id', ctrl.getPublicOrderStatus);

module.exports = router;
