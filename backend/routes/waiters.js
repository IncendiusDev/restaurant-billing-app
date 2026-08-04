const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { resolveTenant, requireTenant } = require('../middleware/tenant');
const ctrl = require('../controllers/waiterController');

router.use(authenticate, resolveTenant, requireTenant, requireRole('restaurant_admin'));

router.get('/', ctrl.listWaiters);
router.post('/', ctrl.createWaiter);
router.patch('/:id', ctrl.updateWaiter);
router.delete('/:id', ctrl.deleteWaiter);

module.exports = router;
