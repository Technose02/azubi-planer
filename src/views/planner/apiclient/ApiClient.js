import ApiClientBase from "./ApiClientBase.js";

class ApiClient extends ApiClientBase {
  static async _postOrPutBlockDate(url, method, blockData) {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: blockData.createJsonString(),
    });
    const json = await response.json();
    return new Promise((resolve) => resolve({ status: response.status, json }));
  }

  constructor(baseUrl, year) {
    super(year);
    this._baseUrl = baseUrl;
  }

  async getUiDataDisplaynamesImpl(year) {
    return fetch(`${this._baseUrl}/uidata/displaynames/${year}`, {
      method: "get",
    }).then((response) => response.json());
  }

  async getUiDataBlocktypesImpl() {
    return fetch(`${this._baseUrl}/uidata/blocktypes`, {
      method: "get",
    }).then((response) => response.json());
  }

  async getAllImpl(year) {
    return fetch(`${this._baseUrl}/blockdata/all/${year}`, {
      method: "get",
    }).then((response) => response.json());
  }

  async deleteImpl(id) {
    return fetch(`${this._baseUrl}/blockdata/planned/${id}`, {
      method: "DELETE",
    }).then((r) => r.status);
  }

  async createImpl(blockData) {
    return ApiClient._postOrPutBlockDate(
      `${this._baseUrl}/blockdata/planned`,
      "POST",
      blockData
    );
  }

  async updateImpl(blockData) {
    return ApiClient._postOrPutBlockDate(
      `${this._baseUrl}/blockdata/planned/${blockData.blockId}`,
      "PUT",
      blockData
    );
  }
}

export default ApiClient;
