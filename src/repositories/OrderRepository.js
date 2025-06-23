const { Op } = require('sequelize');
const BaseRepository = require('./BaseRepository');
const { Order, OrderItem, Product, User } = require('../models');

 // OrderRepository class; extends BaseRepository class for order specific db operations.
class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }


  async findById(id, options = {}) {
    const mergedOptions = {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        }
      ],
      ...options
    };
    
    if (options.include) {
      mergedOptions.include = [...mergedOptions.include, ...options.include];
    }
    
    return await super.findById(id, mergedOptions);
  }

  async findWithItems(id) {
    return await this.findById(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'] // Excluding password
        }
      ]
    });
  }

  async findByUserId(userId, options = {}) {
    return await this.findAll({
      where: { userId },
      ...options,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'price']
            }
          ]
        }
      ]
    });
  }

  async findByStatus(status, options = {}) {
    return await this.findAll({
      where: { status },
      ...options
    });
  }


  async findByDateRange(startDate, endDate, options = {}) {
    return await this.findAll({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      ...options
    });
  }


  async updateStatus(id, status) {
    const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }
    
    return await this.update(id, { status });
  }
}

module.exports = new OrderRepository();