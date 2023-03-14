class ApiClientBase {
  constructor(year) {
    this._year = year;
  }

  async getUiDataDisplaynames(year = this._year) {
    return this.getUiDataDisplaynamesImpl(year);
  }

  async getUiDataBlocktypes() {
    return this.getUiDataBlocktypesImpl();
  }

  async getAll(year = this._year) {
    return this.getAllImpl(year);
  }

  async delete(id) {
    return this.deleteImpl(id);
  }

  async create(blockData) {
    return this.createImpl(blockData);
  }

  async update(blockData) {
    return this.updateImpl(blockData);
  }
}

export default ApiClientBase;
