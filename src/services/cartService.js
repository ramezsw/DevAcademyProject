const productRepository = require('../repositories/ProductRepository');


class CartService {
  constructor() {
    
    this.carts = new Map();
  }

  
  async getCart(userId) {
    // Get cart or create new one
    const cart = this.carts.get(userId) || { items: [], total: 0 };
    
    // If cart has items, get fresh product data
    if (cart.items.length > 0) {
      for (const item of cart.items) {
        const product = await productRepository.findById(item.productId);
        
        // Update product details
        if (product) {
          item.name = product.name;
          item.price = parseFloat(product.price);
          item.currentStock = product.stock;
        }
      }
      
      cart.total = this._calculateTotal(cart.items);
    }
    
    return cart;
  }


  async addItem(userId, item) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      const error = new Error('Invalid item data');
      error.statusCode = 400;
      throw error;
    }
    
    // Validate product exists and has stock
    const product = await productRepository.findById(item.productId);
    
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    
    if (product.stock < item.quantity) {
      const error = new Error('Insufficient stock');
      error.statusCode = 400;
      throw error;
    }
    
    // Get cart or create new one
    const cart = this.carts.get(userId) || { items: [], total: 0 };
    
    // Check if product already in cart
    const existingItem = cart.items.find(i => i.productId === item.productId);
    
    if (existingItem) {
      //update quantity of item
      const newQuantity = existingItem.quantity + item.quantity;
      
      if (product.stock < newQuantity) {
        const error = new Error('Insufficient stock for the requested quantity');
        error.statusCode = 400;
        throw error;
      }
      
      existingItem.quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        productId: item.productId,
        name: product.name,
        price: parseFloat(product.price),
        quantity: item.quantity,
        currentStock: product.stock
      });
    }
    
    // Update cart total
    cart.total = this._calculateTotal(cart.items);
    
    // Save cart
    this.carts.set(userId, cart);
    
    return cart;
  }


  async updateItemQuantity(userId, productId, quantity) {
    // Validate quantity
    if (quantity <= 0) {
      const error = new Error('Quantity must be greater than zero');
      error.statusCode = 400;
      throw error;
    }
    
    const cart = this.carts.get(userId);
    
    if (!cart) {
      const error = new Error('Cart not found');
      error.statusCode = 404;
      throw error;
    }
    
    const item = cart.items.find(i => i.productId === productId);
    
    if (!item) {
      const error = new Error('Item not found in cart');
      error.statusCode = 404;
      throw error;
    }
    
    // Validate stock
    const product = await productRepository.findById(productId);
    
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    
    if (product.stock < quantity) {
      const error = new Error('Insufficient stock for the requested quantity');
      error.statusCode = 400;
      throw error;
    }
    
    // Update quantity
    item.quantity = quantity;
    item.currentStock = product.stock;
    
    // Update cart total
    cart.total = this._calculateTotal(cart.items);
    
    // Save cart
    this.carts.set(userId, cart);
    
    return cart;
  }

  async removeItem(userId, productId) {
    const cart = this.carts.get(userId);
    
    if (!cart) {
      const error = new Error('Cart not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Remove item
    cart.items = cart.items.filter(item => item.productId !== productId);
    
    // Update cart total
    cart.total = this._calculateTotal(cart.items);
    
    // Save cart
    this.carts.set(userId, cart);
    
    return cart;
  }


  async clearCart(userId) {
    const emptyCart = { items: [], total: 0 };
    this.carts.set(userId, emptyCart);
    return emptyCart;
  }

  _calculateTotal(items) {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
}

module.exports = new CartService();