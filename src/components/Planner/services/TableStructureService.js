import Service from "./Service";
import Interval from "./../../Interval";
import GridAssistant from "./../GridAssistant";

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

  _createGridAssistant() {
    // - Daten-Spalten beginnen mit Spalte 'this.HEADER_COLUMNS'
    // -  da rechts kein offset vorgesehen ist ist die letzte Datenspalte die Summe
    //      'this.HEADER_COLUMNS' + 'this.getNumberOfLogicalDataColumns()'
    const firstDataCol = this.HEADER_COLUMNS;
    const lastDataCol =
      this.HEADER_COLUMNS + this.getNumberOfLogicalDataColumns();

    return new GridAssistant(
      this.HEADER_COLUMNS,
      this.HEADER_COLUMNS + this.getNumberOfLogicalDataColumns(),
      this.BASE_COLUMN_WIDTH
    );
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
      this._serviceRegister.tableStateService.getCalenderWeekCollapsedStates();

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
      this._serviceRegister.tableStateService.getCalenderWeekCollapsedStates();

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
      this._serviceRegister.tableStateService.getCalenderWeekCollapsedStates();

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
      this._serviceRegister.tableStateService.getCalenderWeekCollapsedStates();

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

  //// Erzeugt die Strukturen, die die Template des Planners zum Erzeugen der Tag-Felder der dritten Kopfzeile verwendet
  getDayHeaderRowObjects() {
    const days = [];

    const weekdayNames = this._serviceRegister.calenderService.WEEKDAY_NAMES;

    const entityArrays = this.getEntityArrays();

    const dayOfYearToGridIntervalMapping =
      this.getDayOfYearToGridIntervalMapping();

    const calenderWeeksCollapsedStates =
      this._serviceRegister.tableStateService.getCalenderWeekCollapsedStates();

    // Unter einer kollabierten KW soll nur ein Feld (in der breite eines Tages im ausgeklappten Zustand)
    // angezeigt werden. Hier filtern wir die Liste der Tage zu einer Woche so vor, dass am Ende in einer
    // kollabierten Woche nur der erste und der letzte der ursprünglichen sieben Tage bleibt
    // Bei dieser Wahl können noch immer Meta-Aussagen über gesamten Wochenbereich bestimmt werden, aber
    // gleichzeitig ist eindeutig feststellbar, dass es sich um eine kollabierte Woche handelt
    // (immer 2Tage! Nicht kollabiert: immer 7 Tage!)
    const filteredDaysInWeekAsIndices =
      entityArrays.daysInWeekAsIndicesOfDayStructure.map(
        (daysInWeekAsIdx, idx) =>
          calenderWeeksCollapsedStates[idx]
            ? [daysInWeekAsIdx[0], daysInWeekAsIdx.at(-1)]
            : daysInWeekAsIdx
      );

    filteredDaysInWeekAsIndices.forEach((daysOfWeekIndices, weekNumber) => {
      if (daysOfWeekIndices.length === 2) {
        // Der Tag-Feld-Bereich einer kollabierten Kalenderwoche
        const firstDay = entityArrays.dayStructures[daysOfWeekIndices[0]];
        const lastDay = entityArrays.dayStructures[daysOfWeekIndices[1]];
        const startDataColumn =
          dayOfYearToGridIntervalMapping[daysOfWeekIndices[0]][0];
        const endDataColumn = startDataColumn + this.BASE_COLUMN_WIDTH - 1;

        let month_number = firstDay.in_month;
        if (firstDay.in_month !== lastDay.in_month) {
          month_number = undefined;
        }
        let not_this_year = firstDay.notThisYear;
        if (firstDay.notThisYear !== lastDay.notThisYear) {
          not_this_year = undefined;
        }

        days.push({
          day_of_year: undefined,
          day_of_month: undefined,
          day_of_week_str: undefined,
          day_of_week: undefined,
          week_number: weekNumber, // only valid meta-data
          month_number: month_number,
          not_this_year: not_this_year,
          data_columns: [startDataColumn, endDataColumn],
          style_: `grid-column: ${startDataColumn + this.HEADER_COLUMNS} / ${
            endDataColumn + this.HEADER_COLUMNS + 1
          };`,
          display_text: false,
          collapsed: true,
        });
      } else {
        daysOfWeekIndices.forEach((dayIndex) => {
          const dataColumns = dayOfYearToGridIntervalMapping[dayIndex];
          const startDataColumn = dataColumns[0];
          const endDataColumn = dataColumns[1];
          const day = entityArrays.dayStructures[dayIndex];

          days.push({
            day_of_year: day.day_of_year,
            day_of_month: day.day_of_month,
            week_number: day.in_week,
            month_number: day.in_month,
            day_of_week_str: weekdayNames[day.day_of_week],
            day_of_week: day.day_of_week,
            data_columns: [...dataColumns],
            style_: `grid-column: ${startDataColumn + this.HEADER_COLUMNS} / ${
              endDataColumn + this.HEADER_COLUMNS + 1
            };`,
            display_text: true,
            not_this_year: day.notThisYear,
          });
        });
      }
    });
    return days;
  }

  //// Erzeugt die Strukturen, die die Template des Planners zum Erzeugen der (noch einzigen) Daten Kopfspalte verwendet
  getDataHeaderColumnObjects() {
    const rows = [];

    const registeredRowKeys =
      this._serviceRegister.tableDataService.getRegisteredRowKeys();
    const registeredRowTitles =
      this._serviceRegister.tableDataService.getRegisteredRowTitles();

    registeredRowKeys.forEach((key, keyIdx) => {
      rows.push({
        key: key,
        title: registeredRowTitles[keyIdx],
        column_style: `grid-column: ${this.HEADER_COLUMNS};`,
        row_style: `grid-row: ${this.HEADER_ROWS + keyIdx};`,
      });
    });
    return rows;
  }

  //// Erzeugt die Strukturen, die die Template des Planners zum darstellen der Blöcke verwendet
  getBlockDataRenderObjects() {
    const blockDataRenderObjects = [];

    const dayOfYearToGridIntervalMapping =
      this.getDayOfYearToGridIntervalMapping();

    const blockDataRenderObjectsArray =
      this._serviceRegister.tableDataService.generateBlockDataRenderObjects();

    const registeredRowKeys =
      this._serviceRegister.tableDataService.getRegisteredRowKeys();

    blockDataRenderObjectsArray.forEach((block) => {
      const startColumn =
        this.HEADER_COLUMNS +
        dayOfYearToGridIntervalMapping[block.startDayOfYearIdx][0];
      const endColumn =
        this.HEADER_COLUMNS +
        dayOfYearToGridIntervalMapping[block.endDayOfYearIdx][1];

      blockDataRenderObjects.push({
        block_name: block.name,
        row_key_list: block.row_key_list,
        style_: `grid-row: ${block.start_data_row_index + this.HEADER_ROWS} / ${
          block.end_data_row_index + this.HEADER_ROWS + 1
        }; grid-column: ${startColumn} / ${endColumn + 1}; background-color: ${
          block.renderData.style.color
        };`,
      });
    });
    return blockDataRenderObjects;
  }

  //// Erzeugt die Strukturen, die die Template des Planners zum darstellen der Daten-Zellen verwendet, die frei sind
  getNonBlockedDayFillingObjectsForRowByIndex(rowIndex) {
    const nonBlockedDayFillingObjects = [];

    const blockIntervals =
      this._serviceRegister.tableDataService.getBlockDataIntervalsForRowIdx(
        rowIndex
      );

    const dayOfYearToGridIntervalMapping =
      this.getDayOfYearToGridIntervalMapping();

    // einen GridAssistant für die aktuelle "Collapsed-Situation" erzeugen
    const gridAssistant = this._createGridAssistant();

    // Blockdaten-Intervalle, so nicht leer, mappen von dayOfYearIndices auf GridColumns:
    let dataColumnIntervals = [];
    if (blockIntervals.length !== 0) {
      dataColumnIntervals = blockIntervals.map(
        (i) =>
          new Interval(
            dayOfYearToGridIntervalMapping[i.start][0],
            dayOfYearToGridIntervalMapping[i.end][1]
          )
      );
    }

    // zu füllende Grid-Column-Intervalle (Gaps zwischen den Blockdaten-Intervallen sowie davor und dahinter) ermitteln:
    let gapsToFill = gridAssistant.determineGapsToFill(dataColumnIntervals);

    // Pro Lücke die passende BlockRangeSequence generieren und die resultierenden RenderObjects erzeugen
    gapsToFill.forEach((i) =>
      gridAssistant.generateBlockRangeSequenceFromInterval(i).forEach((brs) => {
        nonBlockedDayFillingObjects.push({
          is_fill_day: true,
          day_of_year: -1,
          style_: `grid-column: ${brs[0] + this.HEADER_COLUMNS} / ${
            brs[1] + this.HEADER_COLUMNS
          };`,
        });
      })
    );
    return nonBlockedDayFillingObjects;
  }
}

const createTableStructureService = function (year) {
  return new TableStructureService(year);
};

export default createTableStructureService;
