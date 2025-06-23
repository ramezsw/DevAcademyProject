const userRepository = require('../repositories/UserRepository');

// user related logic is handled in this Service.
class UserService {

  async getAllUsers() {
    const users = await userRepository.findAll();
    
    //remove password from user objects
    return users.map(user => {
      const { password, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword;
    });
  }
  

  async getUserById(userId) {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }
  
  async updateUser(userId, userData) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Check if email is already in use
    if (userData.email) {
      const existingUser = await userRepository.findByEmail(userData.email);
      if (existingUser && existingUser.id !== userId) {
        const error = new Error('Email already in use');
        error.statusCode = 409;
        throw error;
      }
    }
    
    // Update user
    const updatedUser = await userRepository.update(userId, userData);
    
    //remove pass from response.
    const { password, ...userWithoutPassword } = updatedUser.toJSON();
    return userWithoutPassword;
  }
  

  async deleteUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    await userRepository.delete(userId);
    return true;
  }
}

module.exports = new UserService();