const express = require('express');
const productController = require('../controllers/productController');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', productController.getAllProducts);

router.get('/featured', productController.getFeaturedProducts);

router.get('/categories', productController.getCategories);

router.get('/search', productController.searchProducts);

router.get('/category/:category', productController.getProductsByCategory);

router.get('/low-stock', authenticate, isAdmin, productController.getLowStockProducts);

router.get('/:id', productController.getProductById);

router.post('/', authenticate, isAdmin, productController.createProduct);

router.put('/:id', authenticate, isAdmin, productController.updateProduct);

router.delete('/:id', authenticate, isAdmin, productController.deleteProduct);

module.exports = router;