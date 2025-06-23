const { Op, fn, col, literal } = require('sequelize');
const BaseRepository = require('./BaseRepository');
const { OrderItem, Product, Order } = require('../models');

// OrderItemRepository class; this extends the BaseRepository class to add the item-specific db operations.
class OrderItemRepository extends BaseRepository {
  constructor() {
    super(OrderItem);
  }


  async findByOrderId(orderId) {
    return await this.findAll({
      where: { orderId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'description', 'category']
        }
      ]
    });
  }


  async bulkCreate(items) {
    return await OrderItem.bulkCreate(items);
  }


  async deleteByOrderId(orderId) {
    return await OrderItem.destroy({
      where: { orderId }
    });
  }

  async getTopSellingProducts(startDate, endDate, limit = 5) {
    return await OrderItem.findAll({
      attributes: [
        'productId',
        [fn('SUM', col('quantity')), 'totalSold'],
        [fn('SUM', col('subtotal')), 'totalRevenue']
      ],
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['name', 'category']
        },
        {
          model: Order,
          as: 'order',
          attributes: [],
          where: {
            createdAt: {
              [Op.between]: [startDate, endDate]
            }
          }
        }
      ],
      group: [
        'OrderItem.productId', 
        'product.id', 
        'product.name', 
        'product.category'
      ],
      // Use literal SQL for the ORDER BY to avoid issues as I was having some strage behavior from DB here.
      order: [literal('SUM(quantity) DESC')],
      limit
    });
  }
}

module.exports = new OrderItemRepository();