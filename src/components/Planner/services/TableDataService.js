import Service from "./Service";
import { assert } from "@vue/compiler-core";
import Interval from "./../../Interval";

class TableDataService extends Service {
  UNSPECIFIED_TYPE = "unspezifiziert";
  _UNSPECIFIED_TYPE_DATA = {
    color: "#FFF",
    labels: ["unspezifiziert"],
  };

  _registeredRowKeys;
  _registeredRowTitles;
  _registeredBlockTypes;

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

  constructor(dataHeaderRows, types) {
    super();
    this._registeredRowKeys = dataHeaderRows.map((r) => r.key);
    this._registeredRowTitles = dataHeaderRows.map((r) => r.title);
    this._registeredBlockTypes = new Map();
    this._registeredBlockTypes.set(
      this.UNSPECIFIED_TYPE,
      this._UNSPECIFIED_TYPE_DATA
    );
    types.forEach((entry) => {
      this._registeredBlockTypes.set(entry.type, entry.data);
    });
  }

  _init() {}

  getRegisteredRowKeys() {
    return this._registeredRowKeys;
  }

  getRegisteredRowTitles() {
    return this._registeredRowTitles;
  }

  getRegisteredBlockTypeEntries() {
    const blockTypeEntries = [];
    for (let [k, v] of this._registeredBlockTypes) {
      blockTypeEntries.push({
        type: k,
        color: v.color,
        label: v.labels[0],
      });
    }
    return blockTypeEntries;
  }

  // Wird gerufen wenn Blockdaten in das System eingehen (aktuell über den Slot in Planner.vue)
  importBlockData(startDate, endDate, type, rowKeys) {
    // Zunächst sind die Dates auf den jeweiligen dayOfYear-Index zu mappen
    const dayStructures =
      this._serviceRegister.tableStructureService.getEntityArrays()
        .dayStructures;

    const startDayOfYearIdx = dayStructures.findIndex(
      (d) => d.date_object >= startDate && d.date_object <= startDate
    );

    if (!Number.isFinite(startDayOfYearIdx) || startDayOfYearIdx < 0) {
      console.error(`invalid start-date: ${startDate}`);
      return;
    }

    const endDayOfYearIdx = dayStructures.findIndex(
      (d) => d.date_object >= endDate && d.date_object <= endDate
    );

    if (!Number.isFinite(endDayOfYearIdx) || endDayOfYearIdx < 0) {
      console.error(`invalid end-date: ${endDate}`);
      return;
    }

    // Generiere eine BlockID und füge den Block hinzu
    const blockId = `${type}_${startDayOfYearIdx}-${endDayOfYearIdx}`;
    const blockDataToSet = {
      startDayOfYearIdx,
      endDayOfYearIdx,
      type,
    };
    this._blockData.set(blockId, blockDataToSet);

    // Füge Zuordnungen gemäß rowKeys-Parameter ohne Duplikate hinzu
    const mappings = this._assignedBlocks.get(blockId) ?? [];
    this._assignedBlocks.set(blockId, [...new Set([...mappings, ...rowKeys])]);
    return blockId;
  }

  // Gibt die vollständige Objekte der aktuell im Kalender gesetzten Blöcke zurück
  getAssignedBlocks() {
    const assignedBlocks = [];

    for (const [blockId, rowKeys] of this._assignedBlocks.entries()) {
      const block = this._blockData.get(blockId);
      assignedBlocks.push({
        startDayOfYearIdx: block.startDayOfYearIdx,
        endDayOfYearIdx: block.endDayOfYearIdx,
        type: block.type,
        rowKeys,
      });
    }

    return assignedBlocks;
  }

  // Erstellt aus den Informationen über die existierenden Blöcke und die Zuordnungen der Spalten zu eben diesen
  // die darzustellenden Blöcke
  generateBlockDataRenderObjects() {
    const blockDataRenderObjects = [];

    for (const [blockId, assignedRows] of this._assignedBlocks) {
      const dataRowIndices = assignedRows.map((k) => {
        const i = this._registeredRowKeys.indexOf(k);
        return i;
      });
      if (dataRowIndices.some((i) => i < 0)) {
        console.error(
          "This should never happen: provided row_key not found in registered rowKeys!"
        );
        assert(true);
      }

      // jetzt aus den dataRowIndices Cluster von Indices, die, sortiert, eine Lückenlose Kette ergeben:
      let dataRowIndicesClusters = [];
      /////////////
      if (dataRowIndices.length === 1) {
        dataRowIndicesClusters = [dataRowIndices];
      } else {
        dataRowIndices.sort((a, b) => a - b);
        let k = dataRowIndices[0];
        let currentCluster = [k];
        dataRowIndices.slice(1).forEach((i) => {
          if (i === k + 1) {
            // i gehört zum aktuellen Cluster, also hinzufügen und k zu neuem Index setzen
            // (Algorithmus nutzt, dass die Indizes aufsteigend sortiert sind)
            currentCluster.push(i);
          } else {
            // i ist zu groß und kann nicht mehr zum aktuellen Cluster gehören. Da die
            // Indizes sortiert sind kann dann kein weitere Index mehr zu diesem Cluster
            // gehören
            dataRowIndicesClusters.push(currentCluster);
            currentCluster = [i];
          }
          k = i;
        });
        dataRowIndicesClusters.push(currentCluster);
      }
      //////////////////
      dataRowIndicesClusters.forEach((dataRowIndices) => {
        const block = this._blockData.get(blockId);
        const blockData = this._registeredBlockTypes.get(block.type);

        const row_key_list = dataRowIndices
          .map((i) => this._registeredRowKeys[i])
          .join("-");
        blockDataRenderObjects.push({
          id: blockId,
          startDayOfYearIdx: block.startDayOfYearIdx,
          endDayOfYearIdx: block.endDayOfYearIdx,
          labels: blockData.labels,
          color: blockData.color,
          row_key_list: row_key_list,
          start_data_row_index: dataRowIndices[0],
          end_data_row_index: dataRowIndices.at(-1),
          unspecified: block.type === this.UNSPECIFIED_TYPE,
        });
      });
    }
    return blockDataRenderObjects;
  }

  getBlockDataIntervalsForRowIdx(rowIdx) {
    const rowKey = this._registeredRowKeys[rowIdx];
    const assignedBlockIds = [];
    for (const [blockId, assignedRows] of this._assignedBlocks) {
      if (assignedRows.includes(rowKey)) {
        assignedBlockIds.push(blockId);
      }
    }

    const blockDataIntervals = assignedBlockIds.map((blockId) => {
      const block = this._blockData.get(blockId);
      return new Interval(block.startDayOfYearIdx, block.endDayOfYearIdx);
    });
    blockDataIntervals.sort((i1, i2) => i1.start - i2.start);
    return blockDataIntervals;
  }
}
const createTableDataService = function (headerData, types) {
  return new TableDataService(headerData, types);
};

export default createTableDataService;
