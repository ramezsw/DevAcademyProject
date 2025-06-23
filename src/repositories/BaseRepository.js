

// BaseRepository class; implements the repository pattern for all database operation (fetch, fetch one, update, delete, count...)

class BaseRepository {
  constructor(model) {
    this.model = model;
  }


  async findAll(options = {}) {
    return await this.model.findAll(options);
  }


  async findById(id, options = {}) {
    return await this.model.findByPk(id, options);
  }


  async findOne(where, options = {}) {
    return await this.model.findOne({ ...options, where });
  }

  async create(data) {
    return await this.model.create(data);
  }

  async update(id, data) {
    const record = await this.findById(id);
    if (!record) {
      throw new Error(`Record with id ${id} not found`);
    }
    return await record.update(data);
  }

  async delete(id) {
    const record = await this.findById(id);
    if (!record) {
      throw new Error(`Record with id ${id} not found`);
    }
    await record.destroy();
    return true;
  }


  async count(where = {}) {
    return await this.model.count({ where });
  }
}

module.exports = BaseRepository;