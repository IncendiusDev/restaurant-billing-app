const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { resolveTenant, requireTenant } = require('../middleware/tenant');
const ctrl = require('../controllers/waiterController');

router.use(authenticate, resolveTenant, requireTenant);

router.post('/punch-in', ctrl.punchIn);
router.post('/punch-out', ctrl.punchOut);
router.post('/ping', ctrl.pingActive);
router.get('/my-report', ctrl.getMyReport);

router.get('/reports', requireRole('restaurant_admin'), ctrl.getWaiterReports);

router.get('/', requireRole('restaurant_admin'), ctrl.listWaiters);
router.post('/', requireRole('restaurant_admin'), ctrl.createWaiter);
router.patch('/:id', requireRole('restaurant_admin'), ctrl.updateWaiter);
router.delete('/:id', requireRole('restaurant_admin'), ctrl.deleteWaiter);

module.exports = router;
