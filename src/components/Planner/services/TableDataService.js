import Service from "./Service";
import { assert } from "@vue/compiler-core";

class TableDataService extends Service {
  _registeredRowKeys;
  _registeredRowTitles;

  // die Daten zu den Blöcken sind in einer Map organisiert. Ein Block hat eine ID, unter der er dort gelistet ist.
  // Ein Block kann mehreren Spalten zugeordnet sein (Abstrahierung über keys, nicht Row-Indizes!).
  // Beispiel: Ein AE-Block kann den Keys 'ffarina', 'iingo' und 'ssebastian' zugeordnet sein, wenn die Zugehörigen Azubis diesen Block
  //           gemeinsam absolvieren. Die Explizite Zuweisung zu mehreren Keys (statt einfach drei unterschiedliche Blöcke mit dem gleichen Aussehen zu erstellen)
  //           kann dann von dem Modell erfasst und in der Darstellung berücksichtigt werden.
  //
  _blockData = new Map(); // Die Blöcke, also Name, von wann bis wann, eine id[KEY] (wird generiert) und wie er darzustellen ist.
  // z.B: { name, startDate, endDate, { styleData, classData } } => ID "<Name>_<startDayOfYearIdx>-<endDayOfYearIdx>"

  _assignedBlocks = new Map(); // Die Zuordnung von Azubis zu Blöcken
  // z.B. ffarina: ["<Name>_<startDayOfYearIdx>-<endDayOfYearIdx>", ...]

  constructor(dataHeaderRows) {
    super();
    this._registeredRowKeys = dataHeaderRows.map((r) => r.key);
    this._registeredRowTitles = dataHeaderRows.map((r) => r.title);

    // init BlockKey-Arrays in _assignedBlocks
    this._registeredRowKeys.forEach((key) => {
      this._assignedBlocks.set(key, []);
    });
  }

  _init() {}

  getRegisteredRowKeys() {
    return this._registeredRowKeys;
  }

  getRegisteredRowTitles() {
    return this._registeredRowTitles;
  }

  // Wird gerufen wenn Blockdaten in das System eingehen (aktuell über den Slot in Planner.vue)
  // Das individuelle Styling sowie Infos für die Generierung der classList-Einträge erfolgt über die renderData-Struktur.
  importBlockData(name, startDate, endDate, renderData, rowKeys) {
    //console.log("TableDataService::importBlockData called");
    // Zunächst sind die Dates auf den jeweiligen dayOfYear-Index zu mappen
    const entityArrays =
      this._serviceRegister.tableStructureService.getEntityArrays();

    const startMonth = startDate.getMonth() + 1; // Korrektur nötig, da intern mit Monaten 1..12 gearbeitet wird, Date aber hier 0,..,11 liefert!!
    const startDayInMonthIdx = startDate.getDate() - 1; // Korrektur von Tag des Monats auf Array-Index
    const startDayOfYearIdx =
      entityArrays.daysInMonthAsIndicesOfDayStructure[startMonth][
        startDayInMonthIdx
      ];

    const endMonth = endDate.getMonth() + 1; // s.o.
    const endDayInMonthIdx = endDate.getDate() - 1; // s.o
    const endDayOfYearIdx =
      entityArrays.daysInMonthAsIndicesOfDayStructure[endMonth][
        endDayInMonthIdx
      ];

    // Generiere eine BlockID und füge den Block hinzu
    const blockId = `${name}_${startDayOfYearIdx}-${endDayOfYearIdx}`;
    this._blockData.set(blockId, {
      name,
      startDayOfYearIdx,
      endDayOfYearIdx,
      renderData,
    });

    // Füge Zuordnungen gemäß des rowKeys-Parameters hinzu:
    rowKeys
      .filter((k) => this._registeredRowKeys.indexOf(k) >= 0) // hier filtern um nur bekannte row-keys zu verarbeiten
      .forEach((rowKey) => this._assignedBlocks.get(rowKey).push(blockId));
  }

  // Erstellt aus den Informationen über die existierenden Blöcke und die Zuordnungen der Spalten zu eben diesen
  // die darzustellenden Blöcke
  generateBlockDataRenderObjects() {
    //    console.log("TableDataService::generateBlockDataRenderObjects called");

    const blockDataRenderObjects = [];

    // erstmal einfach, zusammenhängende Zeilen nicht erkennen, alles einzelnd (-> Durchstich):
    for (const [row_key, assignedBlocks] of this._assignedBlocks) {
      const dataRowIdx = this._registeredRowKeys.indexOf(row_key);
      if (dataRowIdx < 0) {
        console.error(
          "This should never happen: provided row_key not found in registered rowKeys!"
        );
        assert(true);
      }

      assignedBlocks.forEach((blockId) => {
        const block = this._blockData.get(blockId);
        blockDataRenderObjects.push({
          name: block.name,
          startDayOfYearIdx: block.startDayOfYearIdx,
          endDayOfYearIdx: block.endDayOfYearIdx,
          renderData: block.renderData,
          row_key: row_key,
          start_data_row_index: dataRowIdx,
          end_data_row_index: dataRowIdx,
        });
      });
    }

    return blockDataRenderObjects;
  }
}
const createTableDataService = function (headerData) {
  return new TableDataService(headerData);
};

export default createTableDataService;
