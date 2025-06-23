const authService = require('../services/authService');


const authController = {

  register: async (req, res, next) => {
    try {
      const { name, email, password, address, phone } = req.body;
      
      //Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide name, email and password'
        });
      }
      
      // Register user
      const result = await authService.register({
        name,
        email,
        password,
        address,
        phone
      });
      
      // Fix: Restructure response to match test expectations
      // changed user properties at data level, not nested in the user object
      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          name: result.user.name,
          email: result.user.email,
          id: result.user.id,
          role: result.user.role,
          token: result.token
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
//login function
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Please provide email and password'
        });
      }
      
      const result = await authService.login(email, password);
      
      res.status(200).json({
        status: 'success',
        message: 'User logged in successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },
  
  getProfile: async (req, res, next) => {
    try {
      //User is already attached to request in protect middleware function
      const { password, ...userWithoutPassword } = req.user.toJSON();
      
      res.status(200).json({
        status: 'success',
        message: 'User profile retrieved successfully',
        data: {
          user: userWithoutPassword
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;