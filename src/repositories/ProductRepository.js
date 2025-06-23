const { Op } = require('sequelize');
const BaseRepository = require('./BaseRepository');
const { Product } = require('../models');

 //ProductRepository class; extends baserepository for product specific operations.

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }


  async search(query, options = {}) {
    const whereClause = {
      [Op.or]: [
        { name: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } }
      ]
    };

    return await this.findAll({
      where: whereClause,
      ...options
    });
  }

  
  async findByCategory(category, options = {}) {
    return await this.findAll({
      where: { category },
      ...options
    });
  }


  async findInStock(options = {}) {
    return await this.findAll({
      where: {
        stock: { [Op.gt]: 0 }
      },
      ...options
    });
  }


  async findLowStock(threshold = 5, options = {}) {
    return await this.findAll({
      where: {
        stock: { [Op.gt]: 0, [Op.lte]: threshold }
      },
      ...options
    });
  }


  async updateStock(id, quantity) {
    const product = await this.findById(id);
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }

    const newStock = product.stock + quantity;
    if (newStock < 0) {
      throw new Error(`Insufficient stock for product with id ${id}`);
    }

    return await product.update({ stock: newStock });
  }

  async getDistinctCategories() {
    const result = await this.model.findAll({
      attributes: ['category'],
      group: ['category'],
      raw: true
    });
    
    return result.map(item => item.category);
  }
}

module.exports = new ProductRepository();