import ApiClientBase from "./ApiClientBase.js";

class MockedApiClient extends ApiClientBase {
  constructor(year) {
    super(year);
  }

  async getUiDataDisplaynamesImpl(year) {
    return new Promise((res) => {
      setTimeout(() => {
        res(this._displaynames);
      }, 400);
    });
  }

  async getUiDataBlocktypesImpl() {
    return new Promise((res) => {
      setTimeout(() => {
        res(this._blocktypes);
      }, 400);
    });
  }

  async getAllImpl(year) {
    return new Promise((res) => {
      setTimeout(() => {
        res(this._generateDatablocks(year));
      }, 400);
    });
  }

  async deleteImpl(id) {}

  async createImpl(blockData) {}

  async updateImpl(blockData) {}

  // STATIC DATA

  _displaynames = [
    { title: "Farina Fachinformatikerin", key: "ffarina" },
    { title: "Ingo Ingenial", key: "iingo" },
    { title: "Sebastian Software", key: "ssebastian" },
    { title: "Vigo Virtuell", key: "vvigo" },
    { title: "Danzo Daten", key: "ddanzo" },
    { title: "Ilse Inzidenz", key: "iilse" },
    { title: "Dennis Decrypter", key: "ddennis" },
  ];

  _blocktypes = [
    {
      type: "urlaub",
      locked: false,
      data: {
        color: "#FFFF00",
        labels: ["Urlaub"],
      },
    },
    {
      type: "anwendungsentwicklung",
      locked: false,
      data: {
        color: "#E2EFDA",
        labels: ["Anwendungsentwicklung", "AE"],
      },
    },
    {
      type: "userhelpdesk",
      locked: false,
      data: {
        color: "#F4B084",
        labels: ["User Help Desk", "UHD"],
      },
    },
    {
      type: "berufschule",
      locked: true,
      data: {
        color: "#FEB0E8",
        labels: ["Berufschule", "Schule"],
      },
    },
    {
      type: "applikationsbetrieb",
      locked: false,
      data: {
        color: "#FF3399",
        labels: ["Applikationsbetrieb"],
      },
    },
    {
      type: "abschlussprojekt",
      locked: false,
      data: {
        color: "#8EA9DB",
        labels: ["Abschlussprojekt", "Projekt"],
      },
    },
    {
      type: "backoffice",
      locked: false,
      data: {
        color: "#FFEB9C",
        labels: ["Backoffice"],
      },
    },
    {
      type: "personalmanagement",
      locked: false,
      data: {
        color: "#2F75B5",
        labels: ["Personalmanagement", "HR"],
      },
    },
    {
      type: "projektmanagement",
      locked: false,
      data: {
        color: "#FFF2CC",
        labels: ["Projektmanagement", "PJM"],
      },
    },
    {
      type: "einkauf_it_controlling_lizenzmanagement",
      locked: false,
      data: {
        color: "#548235",
        labels: ["Einkauf, IT-Controlling, Lizenzmanagement", "Einkauf", "ECL"],
      },
    },
    {
      type: "it_security",
      locked: false,
      data: {
        color: "#5B9BD5",
        labels: ["IT-Security"],
      },
    },
    {
      type: "it_strategy",
      locked: false,
      data: {
        color: "#BF8F00",
        labels: ["IT-Strategy"],
      },
    },
    {
      type: "recht_compliance_managementsysteme",
      locked: false,
      data: {
        color: "#7030A0",
        labels: ["Recht, Compliance und Managementsysteme", "RCM"],
      },
    },
    {
      type: "datenbanken_middleware_appliances",
      locked: false,
      data: {
        color: "#FCE4D6",
        labels: ["Datenbanken, Middleware und Appliances", "DMA"],
      },
    },
    {
      type: "gesetzlicher_feiertag",
      locked: true,
      data: {
        color: "#DE90C8",
        labels: ["gesetzlicher Feiertag", "Feiertag", ""],
      },
    },
  ];

  _generateDatablocks = function (year) {
    return [
      {
        blockId: "server-data-01",
        startDate: `${year}-02-01`,
        endDate: `${year}-02-28`,
        type: "anwendungsentwicklung",
        rowKeys: ["ffarina", "ssebastian", "iingo"],
      },
      {
        blockId: "server-data-02",
        startDate: `${year}-01-23`,
        endDate: `${year}-01-31`,
        type: "userhelpdesk",
        rowKeys: ["ddennis", "iingo"],
      },
      {
        blockId: "server-data-03",
        startDate: `${year}-01-31`,
        endDate: `${year}-02-19`,
        type: "berufschule",
        rowKeys: ["vvigo", "iilse"],
      },
      {
        blockId: "server-data-04",
        startDate: `${year}-02-01`,
        endDate: `${year}-04-30`,
        type: "abschlussprojekt",
        rowKeys: ["ddennis"],
      },
      {
        blockId: "server-data-05",
        startDate: `${year}-01-02`,
        endDate: `${year}-01-04`,
        type: "projektmanagement",
        rowKeys: ["ffarina"],
      },
      {
        blockId: "server-data-06",
        startDate: `${year}-12-27`,
        endDate: `${year}-12-31`,
        type: "einkauf_it_controlling_lizenzmanagement",
        rowKeys: ["ffarina"],
      },
      {
        blockId: "server-data-07",
        startDate: `${year}-12-27`,
        endDate: `${year}-12-30`,
        type: "einkauf_it_controlling_lizenzmanagement",
        rowKeys: ["iingo", "iilse", "ddennis"],
      },
      {
        blockId: "server-data-08",
        startDate: `${year}-12-25`,
        endDate: `${year}-12-26`,
        type: "gesetzlicher_feiertag",
        rowKeys: [
          "ffarina",
          "ssebastian",
          "iingo",
          "iilse",
          "ddennis",
          "vvigo",
          "ddanzo",
        ],
      },
    ];
  };
}

export default MockedApiClient;
