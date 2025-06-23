// OOP class that acts as the parent model for all other classes use din this project.
class BaseModel {
  constructor(data = {}) {
    this._data = data;
    
    if (!this._data.createdAt) {
      this._data.createdAt = new Date();
    }
    
    this._data.updatedAt = new Date();
  }
  
  //getters and setters defined here.
  get id() {
    return this._data.id;
  }
  
  get createdAt() {
    return this._data.createdAt;
  }
  
  get updatedAt() {
    return this._data.updatedAt;
  }
  
  set updatedAt(value) {
    this._data.updatedAt = value;
  }
  
  validate() {
    throw new Error('Validate method must be implemented by child class');
  }
  
  toJSON() {
    return { ...this._data };
  }
}

module.exports = BaseModel;