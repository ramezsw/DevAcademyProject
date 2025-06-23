const userService = require('../services/userService');


const userController = {
   //GET /api/users
  getAllUsers: async (req, res, next) => {
    try {
      const users = await userService.getAllUsers();
      
      res.status(200).json({
        status: 'success',
        message: 'Users retrieved successfully',
        data: users
      });
    } catch (error) {
      next(error);
    }
  },
  
  //GET /api/users/:id
  getUserById: async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user is authorized to view this user profile
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to view this profile'
        });
      }
      
      const user = await userService.getUserById(userId);
      
      res.status(200).json({
        status: 'success',
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  },
  
   //PUT /api/users/:id
  updateUser: async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user is authorized to update this profile
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to update this profile'
        });
      }
      
      const { name, email, password, address, phone } = req.body;
      
      const userData = {};
      
      if (name !== undefined) userData.name = name;
      if (email !== undefined) userData.email = email;
      if (password !== undefined) userData.password = password;
      if (address !== undefined) userData.address = address;
      if (phone !== undefined) userData.phone = phone;
      
      // Only admins can change role
      if (req.user.role === 'admin' && req.body.role !== undefined) {
        userData.role = req.body.role;
      }
      
      const updatedUser = await userService.updateUser(userId, userData);
      
      res.status(200).json({
        status: 'success',
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  },
  
   // DELETE /api/users/:id
  deleteUser: async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      
      await userService.deleteUser(userId);
      
      res.status(200).json({
        status: 'success',
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;