const productRepository = require('../repositories/ProductRepository');
const { searchProducts } = require('../utils/searchUtils');

//product-related business logic is handled here.
class ProductService {

  async getAllProducts(options = {}) {
    return await productRepository.findAll(options);
  }
  
  async getProductById(productId) {
    const product = await productRepository.findById(productId);
    
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    
    return product;
  }
  
  async createProduct(productData) {
    return await productRepository.create(productData);
  }
  
  async updateProduct(productId, productData) {
    // Check if product exists
    const product = await productRepository.findById(productId);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    
    return await productRepository.update(productId, productData);
  }

  async deleteProduct(productId) {
    const product = await productRepository.findById(productId);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    
    await productRepository.delete(productId);
    return true;
  }
  

  async searchProducts(query, options = {}) {
    const dbResults = await productRepository.search(query, options);
    
    // If no database results or we want enhanced search, use the search utility (BST or fuzzy distance measure, in searchUtils.js)
    if (dbResults.length === 0 || options.enhancedSearch) {
      const allProducts = await productRepository.findAll();
      
      // Use fuzzy wuzzy levenshtein distance or Binary Search tree from searchUtils.js for advanced search
      const searchOptions = {
        query,
        minPrice: options.minPrice,
        maxPrice: options.maxPrice,
        category: options.category
      };
      
      return searchProducts(allProducts, searchOptions);
    }
    
    return dbResults;
  }
  
  async getProductsByCategory(category, options = {}) {
    return await productRepository.findByCategory(category, options);
  }
  
  async updateProductStock(productId, quantity) {
    try {
      return await productRepository.updateStock(productId, quantity);
    } catch (error) {
      if (error.message.includes('Insufficient stock')) {
        error.statusCode = 400;
      } else if (error.message.includes('not found')) {
        error.statusCode = 404;
      }
      throw error;
    }
  }
  
  async getLowStockProducts(threshold = 5) {
    return await productRepository.findLowStock(threshold);
  }
  
  async getFeaturedProducts() {
    // this is simulated by having a field in db products table called "featured". In real scenario it can be the actual best-selling products.
    return await productRepository.findAll({
      where: { featured: true },
      limit: 10
    });
  }
  

  async getCategories() {
    return await productRepository.getDistinctCategories();
  }
}

module.exports = new ProductService();