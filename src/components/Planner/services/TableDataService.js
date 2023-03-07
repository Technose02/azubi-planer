import Service from "./Service";
import { assert } from "@vue/compiler-core";
import Interval from "./../../Interval";
import { INTERNAL_ID_PREFIX } from "./Constants.js";

class TableDataService extends Service {
  _UNSPECIFIED_TYPE = "unspezifiziert";
  _UNSPECIFIED_TYPE_DATA = {
    color: "#FFF",
    labels: ["unspezifiziert"],
  };

  _registeredRowKeys;
  _registeredRowTitles;
  _registeredBlockTypes;
  _blockData; // Die Blöcke mit Zeitspanne und zugewiesenen Azubis
  _assingedDayIndices; // Mapping von Start- und End-Datum der Blöcke zu DayOfYearIndices
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
    return `${INTERNAL_ID_PREFIX}${blockId}`;
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
    this._assingedDayIndices = new Map();
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
  importBlockData(blockdata) {
    // ist der type bekannt?
    if (!this._registeredBlockTypes.has(blockdata.type)) {
      console.log(
        `warning: block-type '${blockdata.type}' not registered! Ignoring this data block`
      );
      return undefined;
    }

    // nur die rowKeys nutzen, die auch registriert sind - wenn keine registriert sind -> return undefined
    blockdata.rowKeys = blockdata.rowKeys.filter((k) => {
      if (!this._registeredRowKeys.includes(k)) {
        console.log(`warning: ignoring unknown data-header-rowkey '${k}'`);
        return false;
      }
      return true;
    });
    if (blockdata.rowKeys.length === 0) {
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
      blockdata.endDate < firstDayInCalender.date_object ||
      blockdata.startDate > lastDayOfCalender.date_object
    ) {
      console.log(
        `warning: data-block not in displayed calender-range! Ignoring block`
      );
      return undefined;
    }

    let startDayOfYearIdx = dayStructures.findIndex(
      (d) =>
        d.date_object >= blockdata.startDate &&
        d.date_object <= blockdata.startDate
    );

    if (!Number.isFinite(startDayOfYearIdx) || startDayOfYearIdx < 0) {
      console.log(
        `warning: start of block before displayed calender-range! Clamping to start of displayed calender-range`
      );
      startDayOfYearIdx = 0;
    }

    let endDayOfYearIdx = dayStructures.findIndex(
      (d) =>
        d.date_object >= blockdata.endDate && d.date_object <= blockdata.endDate
    );

    if (!Number.isFinite(endDayOfYearIdx) || endDayOfYearIdx < 0) {
      console.log(
        `warning: end of block after displayed calender-range! Clamping to end of displayed calender-range`
      );
      endDayOfYearIdx = dayStructures.length - 1;
    }

    // Berücksichtigung der relevanten Wochentage
    startDayOfYearIdx =
      this._serviceRegister.tableStructureService._getBestMatchingDayOfYearIdxForIntervalMapping(
        startDayOfYearIdx,
        false
      );

    endDayOfYearIdx =
      this._serviceRegister.tableStructureService._getBestMatchingDayOfYearIdxForIntervalMapping(
        endDayOfYearIdx,
        true
      );

    if (
      startDayOfYearIdx == undefined ||
      endDayOfYearIdx == undefined ||
      startDayOfYearIdx > endDayOfYearIdx
    ) {
      console.log(
        `warning: data-block irrelevant for considered weekdays! Ignoring block`
      );
      return undefined;
    }

    // Füge den Block hinzu, generiere ggf. vorher eine BlockID falls keine mitgegeben wurde
    blockdata.blockId = blockdata.blockId ?? this._getNextBlockId();
    this._blockData.set(blockdata.blockId, blockdata);

    // Füge Zuordnungen gemäß rowKeys-Parameter ohne Duplikate hinzu
    this._assingedDayIndices.set(blockdata.blockId, [
      startDayOfYearIdx,
      endDayOfYearIdx,
    ]);
    return blockdata.blockId;
  }

  // Setzt den BlockType eines vorhandenen Blocks gemäß Parameter
  updateBlockType(blockId, blockType) {
    assert(this._registeredBlockTypes.has(blockType));
    const blockData = this.getBlockData(blockId);
    assert(blockData);
    blockData.type = blockType;
  }

  getBlockData(blockId) {
    if (this._blockData.has(blockId)) {
      return this._blockData.get(blockId);
    }
  }

  // Enfernt einen Block und die Zuordnung zu Datenzeilen
  deleteBlock(blockId) {
    if (this._blockData.has(blockId)) {
      this._blockData.delete(blockId);
    }
  }

  // Gibt die vollständige Objekte der aktuell im Kalender gesetzten Blöcke zurück
  getAssignedBlocks() {
    const assignedBlocks = [];

    for (const block of this._blockData.values()) {
      const [startDayOfYearIdx, endDayOfYearIdx] = this._assingedDayIndices.get(
        block.blockId
      );
      assignedBlocks.push({
        startDayOfYearIdx,
        endDayOfYearIdx,
        type: block.type,
        rowKeys: block.rowKeys,
      });
    }

    return assignedBlocks;
  }

  // Erstellt aus den Informationen über die existierenden Blöcke und die Zuordnungen der Spalten zu eben diesen
  // die darzustellenden Blöcke
  generateBlockDataRenderObjects() {
    const blockDataRenderObjects = [];

    for (const block of this._blockData.values()) {
      const dataRowIndices = block.rowKeys.map((k) => {
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
        const [startDayOfYearIdx, endDayOfYearIdx] =
          this._assingedDayIndices.get(block.blockId);
        const blockType = this._registeredBlockTypes.get(block.type);

        const row_key_list = dataRowIndices
          .map((i) => this._registeredRowKeys[i])
          .join("-");
        blockDataRenderObjects.push({
          id: block.blockId,
          startDayOfYearIdx,
          endDayOfYearIdx,
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
    for (const block of this._blockData.values()) {
      if (block.rowKeys.includes(rowKey)) {
        assignedBlockIds.push(block.blockId);
      }
    }

    const blockDataIntervals = assignedBlockIds.map((blockId) => {
      return new Interval(...this._assingedDayIndices.get(blockId));
    });
    blockDataIntervals.sort((i1, i2) => i1.start - i2.start);
    return blockDataIntervals;
  }
}
const createTableDataService = function () {
  return new TableDataService();
};

export default createTableDataService;
