const express = require('express');
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();


router.get('/', authenticate, cartController.getCart);

router.post('/items', authenticate, cartController.addItem);

router.put('/items/:productId', authenticate, cartController.updateItemQuantity);

router.delete('/items/:productId', authenticate, cartController.removeItem);

router.delete('/', authenticate, cartController.clearCart);

module.exports = router;