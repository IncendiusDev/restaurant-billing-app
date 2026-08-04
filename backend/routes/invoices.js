const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { resolveTenant, requireTenant } = require('../middleware/tenant');
const ctrl = require('../controllers/invoiceController');

router.use(authenticate, resolveTenant, requireTenant);

router.get('/', ctrl.listInvoices);
router.get('/:id', ctrl.getInvoice);
router.patch('/:id/pay', requireRole('restaurant_admin', 'waiter'), ctrl.markPaid);

module.exports = router;
