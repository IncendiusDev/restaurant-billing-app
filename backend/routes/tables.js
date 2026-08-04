const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { resolveTenant, requireTenant } = require('../middleware/tenant');
const ctrl = require('../controllers/tableController');

router.use(authenticate, resolveTenant, requireTenant);

router.get('/', ctrl.listTables);
router.post('/', requireRole('restaurant_admin'), ctrl.createTable);
router.patch('/:id/status', requireRole('restaurant_admin', 'waiter'), ctrl.updateTableStatus);
router.delete('/:id', requireRole('restaurant_admin'), ctrl.deleteTable);

module.exports = router;
