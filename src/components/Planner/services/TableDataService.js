import Service from "./Service";

class TableDataService extends Service {
  _dataHeaderRows;

  constructor(dataHeaderRows) {
    super();
    this._dataHeaderRows = dataHeaderRows;
  }

  _init() {}

  getDataHeaderRows() {
    return this._dataHeaderRows;
  }
}

const createTableDataService = function (headerData) {
  return new TableDataService(headerData);
};

export default createTableDataService;
