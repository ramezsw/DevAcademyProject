const cartService = require('../services/cartService');

//this contains functions related to user's cart and items in it (add, update, delete...)
const cartController = {

  getCart: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const cart = await cartService.getCart(userId);
      
      res.status(200).json({
        status: 'success',
        message: 'Cart retrieved successfully',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  },
  

  addItem: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { productId, quantity } = req.body;
      
      //Validate inputs
      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Product ID and positive quantity are required'
        });
      }
      
      const cart = await cartService.addItem(userId, {
        productId: parseInt(productId),
        quantity: parseInt(quantity)
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Item added to cart',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  },
  
  //update function, also updates the values in inventory database.
  updateItemQuantity: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const productId = parseInt(req.params.productId);
      const { quantity } = req.body;
      
      // Validate input
      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Positive quantity is required'
        });
      }
      
      const cart = await cartService.updateItemQuantity(
        userId, 
        productId, 
        parseInt(quantity)
      );
      
      res.status(200).json({
        status: 'success',
        message: 'Cart item updated',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  },
  
  //DELETE /api/cart/items/:productId
  removeItem: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const productId = parseInt(req.params.productId);
      
      const cart = await cartService.removeItem(userId, productId);
      
      res.status(200).json({
        status: 'success',
        message: 'Item removed from cart',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  },
  
// DELETE /api/cart   (Clear the entire cart)
  clearCart: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const cart = await cartService.clearCart(userId);
      
      res.status(200).json({
        status: 'success',
        message: 'Cart cleared',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = cartController;