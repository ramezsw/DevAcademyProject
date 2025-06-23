const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/UserRepository');
const { User } = require('../models');

 // this handles user registration, login, and token management
class AuthService {

  async register(userData) {
    //check if email is already in use
    const existingUser = await userRepository.findByEmail(userData.email);
    
    if (existingUser) {
      const error = new Error('Email already in use');
      error.statusCode = 409;
      throw error;
    }
    
    const user = await userRepository.create(userData);
    
    const token = this._generateToken(user.id);
    
    const { password, ...userWithoutPassword } = user.toJSON();
    
    return {
      user: userWithoutPassword,
      token
    };
  }
  
  async login(email, password) {
    // find user by email
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }
    
    // check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }
    
    // Generate JWT token
    const token = this._generateToken(user.id);
    
    // Return user without password
    const { password: userPassword, ...userWithoutPassword } = user.toJSON();
    
    return {
      user: userWithoutPassword,
      token
    };
  }
  
  _generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'default_secret_key_change_in_production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
  }
}

module.exports = new AuthService();