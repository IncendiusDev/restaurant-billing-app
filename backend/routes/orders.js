const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { resolveTenant, requireTenant } = require('../middleware/tenant');
const ctrl = require('../controllers/orderController');
const invoiceCtrl = require('../controllers/invoiceController');

router.use(authenticate, resolveTenant, requireTenant);

router.get('/', ctrl.listOrders);
router.get('/:id', ctrl.getOrder);
router.post('/', requireRole('restaurant_admin', 'waiter'), ctrl.createOrder);
router.patch('/:id/items', requireRole('restaurant_admin', 'waiter'), ctrl.updateOrderItems);
router.patch('/:id', requireRole('restaurant_admin', 'waiter'), ctrl.updateOrder);
router.post('/:id/invoice', requireRole('restaurant_admin', 'waiter'), invoiceCtrl.generateInvoice);

module.exports = router;
