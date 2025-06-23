const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/UserRepository');
require('dotenv').config();

// this is the authentication Middleware function.
// It used used in many of the functions; any function that requires user to be logged in will use this middleware function.
const authenticate = (req, res, next) => {
  let token;
  
  // Get token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authorized to access this route'
    });
  }
  
  try {
    // verify the jwt token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from the token (using Promise chain instead of async/await)
    userRepository.findById(decoded.id)
      .then(user => {
        if (!user) {
          return res.status(401).json({
            status: 'error',
            message: 'User belonging to this token no longer exists'
          });
        }
        
        req.user = user;
        next();
      })
      .catch(err => {
        next(err);
      });
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
};

// Check if user is an admin. (call it admonitor)
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'User not authenticated'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: `Role ${req.user.role} is not authorized to access this route`
    });
  }
  
  next();
};

const protect = authenticate;
const authorize = (role) => (req, res, next) => {
  if (role === 'admin') {
    return isAdmin(req, res, next);
  }
  next();
};

module.exports = {
  authenticate,
  isAdmin,
  protect,
  authorize
};