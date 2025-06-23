const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, authorize('admin'), userController.getAllUsers);

router.get('/:id', protect, userController.getUserById);

router.put('/:id', protect, userController.updateUser);

router.delete('/:id', protect, authorize('admin'), userController.deleteUser);

module.exports = router;