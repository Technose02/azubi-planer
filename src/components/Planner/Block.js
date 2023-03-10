class Block {
  _blockId;
  _type;
  _startDate;
  _endDate;
  _rowKeys;

  static _copyString(data) {
    if (data) return `${data}`;
  }

  static _copyDate(date) {
    if (date)
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  static _stringifyDate(date) {
    const year = `${date.getFullYear()}`.padStart(4, "0");
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  constructor() {}

  get blockId() {
    return Block._copyString(this._blockId);
  }
  set blockId(value) {
    this._blockId = value;
  }

  get type() {
    return Block._copyString(this._type);
  }
  set type(value) {
    this._type = value;
  }

  get startDate() {
    return Block._copyDate(this._startDate);
  }
  set startDate(value) {
    this._startDate = value;
  }

  get endDate() {
    return Block._copyDate(this._endDate);
  }
  set endDate(value) {
    this._endDate = value;
  }

  get rowKeys() {
    return this._rowKeys.map((k) => k);
  }
  set rowKeys(value) {
    this._rowKeys = value;
  }

  createJsonString() {
    return JSON.stringify({
      type: this.type,
      startDate: Block._stringifyDate(this.startDate),
      endDate: Block._stringifyDate(this.endDate),
      rowKeys: this.rowKeys,
    });
  }

  copy() {
    const ret = createBlock(
      this.type,
      this.startDate,
      this.endDate,
      this.rowKeys
    );
    ret.blockId = this.blockId;
    return ret;
  }
}

const createBlock = function (
  type,
  startDate = new Date(),
  endDate = new Date(),
  rowKeys = []
) {
  const ret = new Block();
  ret._type = type;
  ret._startDate = startDate;
  ret._endDate = endDate;
  ret._rowKeys = rowKeys;
  return ret;
};

export { Block, createBlock };
