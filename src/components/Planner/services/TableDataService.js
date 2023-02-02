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

    // Füge Zuordnungen gemäß rowKeys-Parameter ohne Duplikate hinzu
    const mappings = this._assignedBlocks.get(blockId) ?? [];
    this._assignedBlocks.set(blockId, [...new Set([...mappings, ...rowKeys])]);
  }

  // Erstellt aus den Informationen über die existierenden Blöcke und die Zuordnungen der Spalten zu eben diesen
  // die darzustellenden Blöcke
  generateBlockDataRenderObjects() {
    //    console.log("TableDataService::generateBlockDataRenderObjects called");

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
        const row_key_list = dataRowIndices
          .map((i) => this._registeredRowKeys[i])
          .join("-");
        blockDataRenderObjects.push({
          name: block.name,
          startDayOfYearIdx: block.startDayOfYearIdx,
          endDayOfYearIdx: block.endDayOfYearIdx,
          renderData: block.renderData,
          row_key_list: row_key_list,
          start_data_row_index: dataRowIndices[0],
          end_data_row_index: dataRowIndices.at(-1),
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
