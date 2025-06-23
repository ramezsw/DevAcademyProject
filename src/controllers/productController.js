const productService = require('../services/productService');


const productController = {
   
  // GET /api/products (get all products)
  getAllProducts: async (req, res, next) => {
    try {
      const products = await productService.getAllProducts();
      
      res.status(200).json({
        status: 'success',
        message: 'Products retrieved successfully',
        data: products
      });
    } catch (error) {
      next(error);
    }
  },
  
   //GET /api/products/:id (get pecific product by it's ID)
  getProductById: async (req, res, next) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await productService.getProductById(productId);
      
      res.status(200).json({
        status: 'success',
        message: 'Product retrieved successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  },
  
   // POST /api/products
  createProduct: async (req, res, next) => {
    try {
      const { name, description, price, stock, category } = req.body;
      
      if (!name || !description || !price) {
        return res.status(400).json({
          status: 'error',
          message: 'Name, description, and price are required'
        });
      }
      
      //Create product
      const product = await productService.createProduct({
        name,
        description,
        price,
        stock: stock || 0,
        category: category || 'Uncategorized'
      });
      
      res.status(201).json({
        status: 'success',
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  },
  

  updateProduct: async (req, res, next) => {
    try {
      const productId = parseInt(req.params.id);
      const { name, description, price, stock, category } = req.body;
      
      const productData = {};
      
      // Only include provided fields
      if (name !== undefined) productData.name = name;
      if (description !== undefined) productData.description = description;
      if (price !== undefined) productData.price = price;
      if (stock !== undefined) productData.stock = stock;
      if (category !== undefined) productData.category = category;
      
      const updatedProduct = await productService.updateProduct(productId, productData);
      
      if (updatedProduct.price) {
        updatedProduct.price = updatedProduct.price.toString();
      }
      
      res.status(200).json({
        status: 'success',
        message: 'Product updated successfully',
        data: updatedProduct
      });
    } catch (error) {
      next(error);
    }
  },
  
   //DELETE /api/products/:id
  deleteProduct: async (req, res, next) => {
    try {
      const productId = parseInt(req.params.id);
      
      await productService.deleteProduct(productId);
      
      res.status(200).json({
        status: 'success',
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
   // GET /api/products/search
  searchProducts: async (req, res, next) => {
    try {
      const query = req.query.q;
      
      if (!query) {
        return res.status(400).json({
          status: 'error',
          message: 'Search query is required'
        });
      }
      
      const products = await productService.searchProducts(query);
      
      res.status(200).json({
        status: 'success',
        message: 'Search results retrieved successfully',
        data: products
      });
    } catch (error) {
      next(error);
    }
  },
  
   // GET /api/products/category/:category
  getProductsByCategory: async (req, res, next) => {
    try {
      const category = req.params.category;
      const products = await productService.getProductsByCategory(category);
      
      res.status(200).json({
        status: 'success',
        message: 'Products retrieved successfully',
        data: products
      });
    } catch (error) {
      next(error);
    }
  },
  
   //GET /api/products/low-stock (admonitor function, gets the products that have low stock availability.)
  getLowStockProducts: async (req, res, next) => {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold) : 5;
      const products = await productService.getLowStockProducts(threshold);
      
      res.status(200).json({
        status: 'success',
        message: 'Low stock products retrieved successfully',
        data: products
      });
    } catch (error) {
      next(error);
    }
  },
  
   // GET /api/products/featured (get featured products)
  getFeaturedProducts: async (req, res, next) => {
    try {
      const products = await productService.getFeaturedProducts();
      
      res.status(200).json({
        status: 'success',
        message: 'Featured products retrieved successfully',
        data: products
      });
    } catch (error) {
      next(error);
    }
  },
  
  //GET /api/products/categories
  getCategories: async (req, res, next) => {
    try {
      const categories = await productService.getCategories();
      
      res.status(200).json({
        status: 'success',
        message: 'Categories retrieved successfully',
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = productController;