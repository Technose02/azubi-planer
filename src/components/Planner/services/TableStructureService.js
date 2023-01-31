import Service from "./Service";

class TableStructureService extends Service {
  // dies ist die Anzahl an Grid-Columns für einen Tag des Kalenders
  // Es sind 7, da im Falle kollabierter KWs eine Spalte, die visuell die Breite eines Tages
  // im ausgeklappten Fall hat, die Daten einer Woche, also 7 Tage, qualitativ geeignet
  // anordnen muss
  BASE_COLUMN_WIDTH = 7;

  // dies ist die Anzahl von Kopf-Zeilen vor dem Datenbereich
  // das Layout sieht aktuell keine weiteren Kopf-Zeilen vor
  HEADER_ROWS = 4;

  // dies ist die Anzahl von Kopf-Spalten vor dem Datenbereich
  // das Layout sieht aktuell keine weiteren Kopf-Spalten vor - der Bereich wird sowieso schon sehr breit -
  HEADER_COLUMNS = 1;

  constructor() {
    super();
  }
}

const createTableStructureService = function () {
  return new TableStructureService();
};

export default createTableStructureService;
