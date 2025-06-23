const orderService = require('../services/orderService');
const cartService = require('../services/cartService');


const orderController = {
  // GET /api/orders

  getAllOrders: async (req, res, next) => {
    try {
      const orders = await orderService.getAllOrders({
        order: [['createdAt', 'DESC']]
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Orders retrieved successfully',
        data: orders
      });
    } catch (error) {
      next(error);
    }
  },
  
   //GET /api/orders/:id
  getOrderById: async (req, res, next) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await orderService.getOrderById(orderId);
      
      // Check if user is authorized to view this order
      if (req.user.role !== 'admin' && req.user.id !== order.userId) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to view this order'
        });
      }
      
      res.status(200).json({
        status: 'success',
        message: 'Order retrieved successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },
  
   //GET /api/orders/my-orders (get current orders of logged in user)
  getUserOrders: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const orders = await orderService.getUserOrders(userId);
      
      res.status(200).json({
        status: 'success',
        message: 'User orders retrieved successfully',
        data: orders
      });
    } catch (error) {
      next(error);
    }
  },
  
   //POST /api/orders (create order)
  createOrder: async (req, res, next) => {
    try {
      const userId = req.user.id;
      let orderItems;
      
      // Check if items are provided directly in the request
      if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
        orderItems = req.body.items;
      } else {
        // Fall back to getting items from the cart
        const cart = await cartService.getCart(userId);
        
        if (!cart.items || !cart.items.length) {
          return res.status(400).json({
            status: 'error',
            message: 'Cannot create order with empty cart and no items provided'
          });
        }
        
        orderItems = cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));
        
        // Clear cart after successful order creation (only if using cart)
        await cartService.clearCart(userId);
      }
      
      // Create order
      const order = await orderService.createOrder({
        userId,
        items: orderItems
      });
      
      res.status(201).json({
        status: 'success',
        message: 'Order created successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },
  
   // PUT /api/orders/:id/status
  updateOrderStatus: async (req, res, next) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({
          status: 'error',
          message: 'Status is required'
        });
      }
      
      const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }
      
      const updatedOrder = await orderService.updateOrderStatus(orderId, status);
      
      res.status(200).json({
        status: 'success',
        message: 'Order status updated successfully',
        data: updatedOrder
      });
    } catch (error) {
      next(error);
    }
  },
  
   //POST /api/orders/:id/cancel (cancel order with a specific order id)
  cancelOrder: async (req, res, next) => {
    try {
      const orderId = parseInt(req.params.id);
      
      const order = await orderService.getOrderById(orderId);
      
      // Check if user is authorized to cancel this order
      if (req.user.role !== 'admin' && req.user.id !== order.userId) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to cancel this order'
        });
      }
      
      const cancelledOrder = await orderService.cancelOrder(orderId);
      
      res.status(200).json({
        status: 'success',
        message: 'Order cancelled successfully',
        data: cancelledOrder
      });
    } catch (error) {
      next(error);
    }
  },
  
   // GET /api/orders/reports/sales
   
  getSalesReport: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          status: 'error',
          message: 'Start date and end date are required'
        });
      }
      
      const report = await orderService.getSalesReport(
        new Date(startDate),
        new Date(endDate)
      );
      
      res.status(200).json({
        status: 'success',
        message: 'Sales report generated successfully',
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = orderController;