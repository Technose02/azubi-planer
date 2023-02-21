import Service from "./Service";
import { assert } from "@vue/compiler-core";
import Interval from "./../../Interval";

class TableDataService extends Service {
  _UNSPECIFIED_TYPE = "unspezifiziert";
  _UNSPECIFIED_TYPE_DATA = {
    color: "#FFF",
    labels: ["unspezifiziert"],
  };

  _registeredRowKeys;
  _registeredRowTitles;
  _registeredBlockTypes;
  _blockData; // Die Blöcke, also Name, von wann bis wann, eine id[KEY] (wird generiert) und wie er darzustellen ist.
  _assignedBlocks; // Die Zuweisungen von Blöcken zu Azubis
  _blockIdCntr;

  // die Daten zu den Blöcken sind in einer Map organisiert. Ein Block hat eine ID, unter der er dort gelistet ist.
  // Ein Block kann mehreren Spalten zugeordnet sein (Abstrahierung über keys, nicht Row-Indizes!).
  // Beispiel: Ein AE-Block kann den Keys 'ffarina', 'iingo' und 'ssebastian' zugeordnet sein, wenn die Zugehörigen Azubis diesen Block
  //           gemeinsam absolvieren. Die Explizite Zuweisung zu mehreren Keys (statt einfach drei unterschiedliche Blöcke mit dem gleichen Aussehen zu erstellen)
  //           kann dann von dem Modell erfasst und in der Darstellung berücksichtigt werden.

  constructor() {
    super();
    this.resetDataHeaderRows([]);
    this.resetBlockTypes([]);
    this.resetBlockData();
    this._blockIdCntr = 0;
  }

  _init() {}

  _getNextBlockId() {
    const blockId = this._blockIdCntr;
    this._blockIdCntr += 1;
    return `internal-${blockId}`;
  }

  resetDataHeaderRows(dataHeaderRows) {
    this._registeredRowKeys = dataHeaderRows.map((r) => r.key);
    this._registeredRowTitles = dataHeaderRows.map((r) => r.title);
  }

  resetBlockTypes(blockTypes) {
    this._registeredBlockTypes = new Map();
    this._registeredBlockTypes.set(this._UNSPECIFIED_TYPE, {
      locked: true,
      data: this._UNSPECIFIED_TYPE_DATA,
    });
    blockTypes.forEach((entry) => {
      this._registeredBlockTypes.set(entry.type, {
        locked: entry.locked,
        data: entry.data,
      });
    });
  }

  // Wird gerufen wenn alle Blöcke und deren Zuweisungen zurückgesetzt werden sollen
  resetBlockData() {
    this._blockData = new Map();
    this._assignedBlocks = new Map();
  }

  setUnspecifiedTypeDataColor(unspecifiedTypeDataColor) {
    this._UNSPECIFIED_TYPE_DATA.color = unspecifiedTypeDataColor;
  }

  getRegisteredRowKeys() {
    return this._registeredRowKeys;
  }

  getRegisteredRowTitles() {
    return this._registeredRowTitles;
  }

  isBlockTypeLocked(type) {
    assert(this._registeredBlockTypes.has(type));
    return this._registeredBlockTypes.get(type).locked;
  }

  getRegisteredBlockTypeEntriesForBlocktypeSelectionMenu() {
    const blockTypeEntries = [];
    for (let [k, v] of this._registeredBlockTypes) {
      if (!v.locked) {
        blockTypeEntries.push({
          type: k,
          color: v.data.color,
          labels: v.data.labels,
        });
      }
    }
    return blockTypeEntries.filter((b) => b.type !== this._UNSPECIFIED_TYPE);
  }

  // Wird gerufen wenn Blockdaten in das System eingehen (aktuell über den Slot in Planner.vue)
  importBlockData(blockId, startDate, endDate, type, rowKeys) {
    // ist der type bekannt?
    if (!this._registeredBlockTypes.has(type)) {
      console.log(
        `warning: block-type '${type}' not registered! Ignoring this data block`
      );
      return undefined;
    }

    // nur die rowKeys nutzen, die auch registriert sind - wenn keine registriert sind -> return undefined
    rowKeys = rowKeys.filter((k) => {
      if (!this._registeredRowKeys.includes(k)) {
        console.log(`warning: ignoring unknown data-header-rowkey '${k}'`);
        return false;
      }
      return true;
    });
    if (rowKeys.length === 0) {
      console.log(
        `warning: none of the assigned rowkeys are registered! Ignoring the whole data block`
      );
      return undefined;
    }

    // Zunächst sind die Dates auf den jeweiligen dayOfYear-Index zu mappen
    const dayStructures =
      this._serviceRegister.tableStructureService.getEntityArrays()
        .dayStructures;

    const firstDayInCalender = dayStructures.at(0);
    const lastDayOfCalender = dayStructures.at(-1);
    if (
      endDate < firstDayInCalender.date_object ||
      startDate > lastDayOfCalender.date_object
    ) {
      console.log(
        `warning: data-block not in displayed calender-range! Ignoring block`
      );
      return undefined;
    }

    let startDayOfYearIdx = dayStructures.findIndex(
      (d) => d.date_object >= startDate && d.date_object <= startDate
    );

    if (!Number.isFinite(startDayOfYearIdx) || startDayOfYearIdx < 0) {
      console.log(
        `warning: start of block before displayed calender-range! Clamping to start of displayed calender-range`
      );
      startDayOfYearIdx = 0;
    }

    let endDayOfYearIdx = dayStructures.findIndex(
      (d) => d.date_object >= endDate && d.date_object <= endDate
    );

    if (!Number.isFinite(endDayOfYearIdx) || endDayOfYearIdx < 0) {
      console.log(
        `warning: end of block after displayed calender-range! Clamping to end of displayed calender-range`
      );
      endDayOfYearIdx = dayStructures.length - 1;
    }

    // Füge den Block hinzu, generiere ggf. vorher eine BlockID falls keine mitgegeben wurde
    const blockId_ = blockId ?? this._getNextBlockId();
    const blockDataToSet = {
      startDate,
      endDate,
      startDayOfYearIdx,
      endDayOfYearIdx,
      type,
    };
    this._blockData.set(blockId_, blockDataToSet);

    // Füge Zuordnungen gemäß rowKeys-Parameter ohne Duplikate hinzu
    const mappings = this._assignedBlocks.get(blockId_) ?? [];
    this._assignedBlocks.set(blockId_, [...new Set([...mappings, ...rowKeys])]);
    return blockId_;
  }

  // Setzt den BlockType eines vorhandenen Blocks gemäß Parameter
  updateBlockType(blockId, blockType) {
    assert(this._registeredBlockTypes.has(blockType));
    const blockData = this._blockData.get(blockId);
    assert(blockData);
    blockData.type = blockType;
  }

  getBlockData(blockId) {
    if (this._blockData.has(blockId)) {
      return this._blockData.get(blockId);
    }
  }

  getAssignedRowKeys(blockId) {
    if (this._assignedBlocks.has(blockId)) {
      return [...this._assignedBlocks.get(blockId)];
    }
  }

  // Enfernt einen Block und die Zuordnung zu Datenzeilen
  deleteBlock(blockId) {
    if (this._blockData.has(blockId)) {
      this._blockData.delete(blockId);
      this._assignedBlocks.delete(blockId);
    }
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
        const blockType = this._registeredBlockTypes.get(block.type);

        const row_key_list = dataRowIndices
          .map((i) => this._registeredRowKeys[i])
          .join("-");
        blockDataRenderObjects.push({
          id: blockId,
          startDayOfYearIdx: block.startDayOfYearIdx,
          endDayOfYearIdx: block.endDayOfYearIdx,
          labels: blockType.data.labels,
          color: blockType.data.color,
          row_key_list: row_key_list,
          start_data_row_index: dataRowIndices[0],
          end_data_row_index: dataRowIndices.at(-1),
          unspecified: block.type === this._UNSPECIFIED_TYPE,
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
const createTableDataService = function () {
  return new TableDataService();
};

export default createTableDataService;
