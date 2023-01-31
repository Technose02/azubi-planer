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

  // für viele Berechnungen benötigen wir die schnelle Zuordnung eines Tage zu den Grid-Columns, von denen er beim Abbilden begrenzt wird
  // es lohnt sich daher, diese einmal für alle Tage zu bestimmen und als Referenz in einem Cache abzulegen - auch wenn dieser recht
  // oft erneuert werden muss (bei jedem Ein- oder Ausklappen einer KW-Spalte)
  _generateDayOfYearToGridIntervalMapping() {
    const dataGridColumnsForDayOfYear = [];

    const dayOfYearIndicesInCalenderWeeks =
      this.getEntityArrays().daysInWeekAsIndicesOfDayStructure;

    const calenderWeeksCollapsedStates =
      this._serviceRegister.tableStateService.getCalenderWeeksCollapsedStates();

    let dataGridColumnOffset = 0;
    dayOfYearIndicesInCalenderWeeks.forEach(
      (dayOfYearIndicesInCalenderWeek, kwIdx) => {
        if (calenderWeeksCollapsedStates[kwIdx]) {
          // betrachtete Kalenderwoche ist kollabiert:
          dayOfYearIndicesInCalenderWeek.forEach(
            (dayOfYearIdx, positionInCurrentWeek) => {
              const startGridColumn =
                dataGridColumnOffset + positionInCurrentWeek + 1;
              dataGridColumnsForDayOfYear[dayOfYearIdx] = [
                startGridColumn,
                startGridColumn,
              ];
            }
          );
          dataGridColumnOffset += this.BASE_COLUMN_WIDTH;
        } else {
          // betrachtete Kalenderwoche ist nicht kollabiert:
          dayOfYearIndicesInCalenderWeek.forEach(
            (dayOfYearIdx, positionInCurrentWeek) => {
              const startGridColumn =
                dataGridColumnOffset +
                this.BASE_COLUMN_WIDTH * positionInCurrentWeek +
                1;
              dataGridColumnsForDayOfYear[dayOfYearIdx] = [
                startGridColumn,
                startGridColumn + this.BASE_COLUMN_WIDTH - 1,
              ];
            }
          );
          dataGridColumnOffset += this.BASE_COLUMN_WIDTH * 7; // 7 Tage in einer Woche
        }
      }
    );
    return dataGridColumnsForDayOfYear;
  }

  getDayOfYearToGridIntervalMapping() {
    const calenderWeeksCollapsedStates =
      this._serviceRegister.tableStateService.getCalenderWeeksCollapsedStates();

    // Lazy-Loading-Pattern
    let dataGridColumnsForDayOfYear =
      this._serviceRegister.cacheService.restoreDataGridColumnsForDayOfYearForCollapsedStates(
        calenderWeeksCollapsedStates
      );
    if (!dataGridColumnsForDayOfYear) {
      dataGridColumnsForDayOfYear =
        this._generateDayOfYearToGridIntervalMapping();

      this._serviceRegister.cacheService.saveDataGridColumnsForDayOfYearForCollapsedStates(
        calenderWeeksCollapsedStates,
        dataGridColumnsForDayOfYear
      );
    }
    return dataGridColumnsForDayOfYear;
  }

  //// Methods for Render-Support
  getNumberOfLogicalDataColumns() {
    // gesucht ist hier die Anzahl der logischen Spalten - damit ist entweder eine kollabierte Kalenderwoche oder ein Tag
    // einer nicht kollabierten Kalenderwoche gemeint.

    // Nach Vorgabe enthält jede Woche (auch die am Rand) exakt sieben Tage.

    const calenderWeeksCollapsedStates =
      this._serviceRegister.tableStateService.getCalenderWeeksCollapsedStates();

    const stepCollapsed = this.BASE_COLUMN_WIDTH; // eine logische Spalte (so breit wie ein Tag wenn nicht kollabiert) ist für eine kollabierte KW vorgesehen
    const stepNonCollapsed = 7 * stepCollapsed; // sieben Tage sind darzustellen wenn die KW nicht kollabiert ist

    let k = 0;
    calenderWeeksCollapsedStates.forEach((flag) => {
      flag ? (k += stepCollapsed) : (k += stepNonCollapsed);
    });

    return k;
  }

  //// Erzeugt die Strukturen, die die Template des Planners zum Erzeugen der Monats-Felder der obersten Kopfzeile verwendet
  getMonthHeaderRowObjects() {
    const months = [];

    const monthNames = this._serviceRegister.calenderService.MONTH_NAMES;

    const monthsArray =
      this.getEntityArrays().daysInMonthAsIndicesOfDayStructure;

    const dayOfYearToGridIntervalMapping =
      this.getDayOfYearToGridIntervalMapping();

    monthsArray.forEach((dayStructureIndices, monthNumber) => {
      // Der Name des Monats wird nur für die aus dem betrachteten Jahr angezeigt
      const monthName =
        monthNumber > 0 && monthNumber < 13 ? monthNames[monthNumber - 1] : "";

      let monthNumberToPush = monthNumber;
      if (monthNumberToPush === 0) monthNumberToPush = 12; // ist zwar aus dem Vorjahr und kriegt keinen Text, soll durch CSS wie Dezember coloriert werden
      if (monthNumberToPush === 13) monthNumberToPush = 1; // ist zwar aus dem Folgejahr und kriegt keinen Text, soll durch CSS wie Januar coloriert werden

      const indexOfFirstDayCurrentMonth = dayStructureIndices[0];
      const startColumn =
        this.HEADER_COLUMNS +
        dayOfYearToGridIntervalMapping[indexOfFirstDayCurrentMonth][0];

      const indexOfLastDayCurrentMonth = dayStructureIndices.at(-1);

      let endColumn =
        this.HEADER_COLUMNS +
        dayOfYearToGridIntervalMapping[indexOfLastDayCurrentMonth][1];

      months.push({
        name: monthName,
        month_number: monthNumberToPush,
        style_: `grid-column: ${startColumn} / ${endColumn + 1};`,
      });
    });
    return months;
  }

  //// Erzeugt die Strukturen, die die Template des Planners zum Erzeugen der Kalenderwochen-Felder der zweiten Kopfzeile verwendet
  getWeekHeaderRowObjects() {
    const weeks = [];

    const weeksArray = this.getEntityArrays().daysInWeekAsIndicesOfDayStructure;

    const dayOfYearToGridIntervalMapping =
      this.getDayOfYearToGridIntervalMapping();

    const calenderWeeksCollapsedStates =
      this._serviceRegister.tableStateService.getCalenderWeeksCollapsedStates();

    weeksArray.forEach((dayStructureIndices, weekNumber) => {
      const weekName =
        weekNumber >= 1 && weekNumber <= 52
          ? `KW ${weekNumber.toString().padStart(2, "0")}`
          : "";

      const indexOfFirstDayCurrentWeek = dayStructureIndices[0];
      const startColumn =
        this.HEADER_COLUMNS +
        dayOfYearToGridIntervalMapping[indexOfFirstDayCurrentWeek][0];

      const indexOfLastDayCurrentWeek = dayStructureIndices.at(-1);

      let endColumn =
        this.HEADER_COLUMNS +
        dayOfYearToGridIntervalMapping[indexOfLastDayCurrentWeek][1];

      if (calenderWeeksCollapsedStates[weekNumber]) {
        endColumn = startColumn + this.BASE_COLUMN_WIDTH - 1; // bei kollabierten KWs ist IMMER die fixe Breite von LOGIC_BASE_COLUMN_WIDTH GridColumns zu verwenden
      }

      weeks.push({
        name: weekName,
        week_number: weekNumber,
        style_: `grid-column: ${startColumn} / ${endColumn + 1};`,
      });
    });
    return weeks;
  }
}

const createTableStructureService = function (year) {
  return new TableStructureService(year);
};

export default createTableStructureService;
