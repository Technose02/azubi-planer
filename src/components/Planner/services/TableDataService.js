import Service from "./Service";

class TableDataService extends Service {
  _dataHeaders;

  constructor(dataHeaders) {
    super();
    this._dataHeaders = dataHeaders;
  }
}

const createTableDataService = function (dataHeaders) {
  return new TableDataService(dataHeaders);
};

export default createTableDataService;
