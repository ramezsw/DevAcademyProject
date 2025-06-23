const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();


router.get('/', authenticate, isAdmin, orderController.getAllOrders);

router.get('/my-orders', authenticate, orderController.getUserOrders);

router.get('/reports/sales', authenticate, isAdmin, orderController.getSalesReport);

router.get('/:id', authenticate, orderController.getOrderById);

router.post('/', authenticate, orderController.createOrder);

router.put('/:id/status', authenticate, isAdmin, orderController.updateOrderStatus);

router.post('/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;