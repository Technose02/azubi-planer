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

  _year;

  constructor(year) {
    super();
    this._year = year;
  }

  _init() {
    this.initializeTableStructure();
  }

  initializeTableStructure() {
    this.getEntityArrays(); // caching, ansonsten würde lazy generiert
  }

  getEntityArrays() {
    // Lazy-Loading-Pattern
    let entityArrays =
      this._serviceRegister.cacheService.restoreEntityArraysForYear(this._year);
    if (!entityArrays) {
      entityArrays =
        this._serviceRegister.calenderService.generateEntityArraysForYear(
          this._year
        );

      this._serviceRegister.cacheService.saveEntityArraysForYear(
        this._year,
        entityArrays
      );
    }
    return entityArrays;
  }
}

const createTableStructureService = function (year) {
  return new TableStructureService(year);
};

export default createTableStructureService;
