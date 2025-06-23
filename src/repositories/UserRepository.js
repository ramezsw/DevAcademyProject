const BaseRepository = require('./BaseRepository');
const { User } = require('../models');

 //UserRepository class; extends base repository with user specific db operations.

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return await this.findOne({ email });
  }

  async emailExists(email) {
    const count = await this.count({ email });
    return count > 0;
  }

  async findByRole(role) {
    return await this.findAll({ where: { role } });
  }
}

module.exports = new UserRepository();