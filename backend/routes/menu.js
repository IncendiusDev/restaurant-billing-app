const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { resolveTenant, requireTenant } = require('../middleware/tenant');
const ctrl = require('../controllers/menuController');

router.use(authenticate, resolveTenant, requireTenant);

router.get('/', ctrl.listItems); // any authenticated role in the restaurant can view the menu
router.post('/', requireRole('restaurant_admin'), ctrl.createItem);
router.patch('/:id', requireRole('restaurant_admin'), ctrl.updateItem);
router.delete('/:id', requireRole('restaurant_admin'), ctrl.deleteItem);

module.exports = router;
