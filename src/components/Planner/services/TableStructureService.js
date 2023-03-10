import Service from "./Service";
import Interval from "./../../Interval";
import GridAssistant from "./../GridAssistant";

class TableStructureService extends Service {
  // dies ist die Anzahl an Grid-Columns für einen Tag des Kalenders
  // Es sind so viele wie Tag in einer Woche darzustellen sind, da im Falle
  // kollabierter KWs eine Spalte, die visuell die Breite eines Tages im
  // ausgeklappten Fall hat, die Daten einer Woche, qualitativ geeignet anordnen muss
  // Der Wert wird im Ctor gesetzt
  _BASE_COLUMN_WIDTH;
  _DAYS_IN_WEEK;

  // dies ist die Anzahl von Kopf-Zeilen vor dem Datenbereich
  // das Layout sieht aktuell keine weiteren Kopf-Zeilen vor
  HEADER_ROWS = 4;

  // dies ist die Anzahl von Kopf-Spalten vor dem Datenbereich
  // das Layout sieht aktuell keine weiteren Kopf-Spalten vor - der Bereich wird sowieso schon sehr breit -
  HEADER_COLUMNS = 1;

  // Breite des kleinsten Zell-Anteils ; eine "logische" Spalte im Kalender (also für einen Tag bei ausgeklappter Woche, ansonsten eine Woche)
  // besteht aus _BASE_COLUMN_WIDTH solcher BASE_CELLs in der Breite
  _BASE_CELL_WIDTH = 1;
  _BASE_CELL_HEIGHT = 4;

  _year;
  _weekDayMask;

  // Zum testen von Abmessungen von Text-Blöcken
  _textTesterWidget;
  // Zu rufen aus Planner.vue
  setTextTesterWidget(textTesterWidget) {
    this._textTesterWidget = textTesterWidget;
  }
  _blockTypeMenuWidget;
  // Zu rufen aus Planner.vue
  setBlockTypeMenuWidget(blockTypeMenuWidget) {
    this._blockTypeMenuWidget = blockTypeMenuWidget;
  }

  constructor(year, weekDayMask) {
    //console.log(`TableStructureService::constructor`);
    super();
    this._year = year;
    this._weekDayMask = weekDayMask;
    this._DAYS_IN_WEEK = this._weekDayMask.length;
    this._BASE_COLUMN_WIDTH = this._DAYS_IN_WEEK;
  }

  _init() {
    //console.log(`TableStructureService::_init()`);

    this.initializeTableStructure();
  }

  _chooseLabelForAvailableWidth(
    labels,
    availableWidthInRem,
    refElementForFontsize
  ) {
    if (!labels || labels.length === 0) return "";
    const labelList = [...labels];
    const lastLabel = labelList.at(-1);
    if (lastLabel.length > 0) {
      // wenn das kürzeste Label nicht der Leerstring ist, dann dynamisch hieraus generische Kürzungen ableiten
      // ...aus Label-Beginn mit angehängten "..."
      for (let k = 3; k < lastLabel.length; k++) {
        labelList.push(`${lastLabel.slice(0, -k)}...`);
      }
      // ...aus dem ersten Buchstaben und nur einem .
      labelList.push(lastLabel[0] + ".");
      // ...und als Letze Möglichkeit nur den Anfangsbuchstaben (in groß)
      labelList.push(lastLabel[0].toUpperCase());
    }

    let label = labelList[0];
    if (refElementForFontsize) {
      const fontSizeInRem =
        Number.parseFloat(
          window
            .getComputedStyle(refElementForFontsize, null)
            .getPropertyValue("font-size")
            .split("px")[0]
        ) / 10.0;

      label = undefined;
      for (let curLabel of labelList) {
        const textWidthInRem = this._getWidthOfTextInRem(
          curLabel,
          `${fontSizeInRem}rem`
        );
        if (textWidthInRem <= availableWidthInRem) {
          label = curLabel;
          break;
        }
      }

      // Wenn schließlich keine Passt (also wenige Platz als für "erster Buchstabe + ...")
      // auf den Text komplett verzichten - die Farbe gibt ja auch etwas Aufschluss
      if (!label) {
        label = "";
      }
    }
    return label;
  }

  _getWidthOfTextInRem(text, fontSizeStyle) {
    if (!this._textTesterWidget) return undefined;
    this._textTesterWidget.style.fontSize = fontSizeStyle;
    this._textTesterWidget.innerHTML = text;
    return this._textTesterWidget.clientWidth * 0.105; // Skalieren mit 1.05 und dann Teilen durch 10 wegen px->rem
  }

  _createGridAssistant() {
    //console.log(`TableStructureService::_createGridAssistant()`);

    return new GridAssistant(
      this.HEADER_COLUMNS,
      this.HEADER_COLUMNS + this.getNumberOfLogicalDataColumns(),
      this._BASE_COLUMN_WIDTH
    );
  }

  getWeekdayMask() {
    return this._weekDayMask;
  }

  getGridAssistant() {
    //console.log(`TableStructureService::getGridAssistant() -- already cached`);

    const calenderWeeksCollapsedState =
      this._serviceRegister.tableStateService.getCalenderWeekCollapsedStates();

    // Lazy-Loading-Pattern
    let gridAssistant =
      this._serviceRegister.cacheService.restoreGridAssistantForCollapsedState(
        calenderWeeksCollapsedState
      );
    if (!gridAssistant) {
      gridAssistant = this._createGridAssistant();

      this._serviceRegister.cacheService.saveGridAssistantForCollapsedState(
        calenderWeeksCollapsedState,
        gridAssistant
      );
    }
    return gridAssistant;
  }

  initializeTableStructure() {
    //console.log(`TableStructureService::initializeTableStructure()`);

    this.getEntityArrays(); // caching, ansonsten würde lazy generiert
  }

  getEntityArrays() {
    //console.log(`TableStructureService::getEntityArrays() -- already cached`);

    // Lazy-Loading-Pattern
    let entityArrays =
      this._serviceRegister.cacheService.restoreEntityArraysForYear(this._year);
    if (!entityArrays) {
      entityArrays =
        this._serviceRegister.calenderService.generateEntityArraysForYear(
          this._year
        );
      // POST-PROCESSING
      entityArrays.daysInWeekAsIndicesOfDayStructure =
        entityArrays.daysInWeekAsIndicesOfDayStructure.map(
          (dayOfYearIndicesInCalenderWeek) =>
            dayOfYearIndicesInCalenderWeek.filter((_, idx) =>
              this._weekDayMask.includes(idx)
            )
        );
      ////

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
    //console.log(`TableStructureService::_generateDayOfYearToGridIntervalMapping()`);

    const dataGridColumnsForDayOfYear = [];

    const dayOfYearIndicesInCalenderWeeks =
      this.getEntityArrays().daysInWeekAsIndicesOfDayStructure;

    const calenderWeeksCollapsedState =
      this._serviceRegister.tableStateService.getCalenderWeekCollapsedStates();

    let dataGridColumnOffset = 0;
    dayOfYearIndicesInCalenderWeeks.forEach(
      (dayOfYearIndicesInCalenderWeek, kwIdx) => {
        if (calenderWeeksCollapsedState[kwIdx]) {
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
          dataGridColumnOffset += this._BASE_COLUMN_WIDTH;
        } else {
          // betrachtete Kalenderwoche ist nicht kollabiert:
          dayOfYearIndicesInCalenderWeek.forEach(
            (dayOfYearIdx, positionInCurrentWeek) => {
              const startGridColumn =
                dataGridColumnOffset +
                this._BASE_COLUMN_WIDTH * positionInCurrentWeek +
                1;
              dataGridColumnsForDayOfYear[dayOfYearIdx] = [
                startGridColumn,
                startGridColumn + this._BASE_COLUMN_WIDTH - 1,
              ];
            }
          );
          dataGridColumnOffset += this._BASE_COLUMN_WIDTH * this._DAYS_IN_WEEK;
        }
      }
    );
    return dataGridColumnsForDayOfYear;
  }

  _getDayOfYearToGridIntervalMapping() {
    //console.log(`TableStructureService::getDayOfYearToGridIntervalMapping() -- already cached`);

    const calenderWeeksCollapsedState =
      this._serviceRegister.tableStateService.getCalenderWeekCollapsedStates();

    // Lazy-Loading-Pattern
    let dataGridColumnsForDayOfYear =
      this._serviceRegister.cacheService.restoreDataGridColumnsForDayOfYearForCollapsedState(
        calenderWeeksCollapsedState
      );
    if (!dataGridColumnsForDayOfYear) {
      dataGridColumnsForDayOfYear =
        this._generateDayOfYearToGridIntervalMapping();

      this._serviceRegister.cacheService.saveDataGridColumnsForDayOfYearForCollapsedState(
        calenderWeeksCollapsedState,
        dataGridColumnsForDayOfYear
      );
    }
    return dataGridColumnsForDayOfYear;
  }

  _getBestMatchingDayOfYearIdxForIntervalMapping(dayOfYearIdx, earlierFlag) {
    const dayOfYearToGridIntervalMapping =
      this._getDayOfYearToGridIntervalMapping();
    let interval = dayOfYearToGridIntervalMapping[dayOfYearIdx];
    if (interval) return dayOfYearIdx;

    if (earlierFlag) {
      for (
        let cur_dayOfYearIdx = dayOfYearIdx - 1;
        cur_dayOfYearIdx >= Math.max(0, dayOfYearIdx - this._DAYS_IN_WEEK + 1);
        cur_dayOfYearIdx--
      ) {
        interval = dayOfYearToGridIntervalMapping[cur_dayOfYearIdx];
        if (interval) {
          return cur_dayOfYearIdx;
        }
      }
      return undefined;
    }

    for (
      let cur_dayOfYearIdx = dayOfYearIdx + 1;
      cur_dayOfYearIdx <
      Math.min(
        dayOfYearToGridIntervalMapping.length,
        dayOfYearIdx + this._DAYS_IN_WEEK - 1
      );
      cur_dayOfYearIdx++
    ) {
      const interval = dayOfYearToGridIntervalMapping[cur_dayOfYearIdx];
      if (interval) {
        return cur_dayOfYearIdx;
      }
    }
    return undefined;
  }

  _getGridIntervalForDayOfYear(dayOfYearIdx, earlierFlag) {
    const dayOfYearToGridIntervalMapping =
      this._getDayOfYearToGridIntervalMapping();
    const matchingDayOfYearIdx =
      this._getBestMatchingDayOfYearIdxForIntervalMapping(
        dayOfYearIdx,
        earlierFlag
      );
    return dayOfYearToGridIntervalMapping[matchingDayOfYearIdx];
  }

  // Funktioniert, könnte aber performanter umgesetzt werden (TODO)
  getDayOfYearFromGridColumn(gridColumn) {
    const mapping = this._getDayOfYearToGridIntervalMapping();
    const dayOfYearIdx = mapping.findIndex(
      (i) => i && i[0] <= gridColumn && i[1] >= gridColumn
    );
    if (!Number.isFinite(dayOfYearIdx)) return [undefined, undefined];
    const dayOfYearStructure =
      this.getEntityArrays().dayStructures[dayOfYearIdx];
    return [dayOfYearIdx, dayOfYearStructure];
  }

  // Funktioniert, könnte aber performanter umgesetzt werden (TODO)
  getRowIdxFromRowKey(rowKey) {
    return this._serviceRegister.tableDataService
      .getRegisteredRowKeys()
      .indexOf(rowKey);
  }

  //// Methods for Render-Support
  _calculateNumberOfLogicalDataColumns() {
    //console.log(`TableStructureService::_calculateNumberOfLogicalDataColumns()`);

    // gesucht ist hier die Anzahl der logischen Spalten - damit ist entweder eine kollabierte Kalenderwoche oder ein Tag
    // einer nicht kollabierten Kalenderwoche gemeint.

    // Nach Vorgabe enthält jede Woche (auch die am Rand) exakt sieben Tage.

    const calenderWeeksCollapsedState =
      this._serviceRegister.tableStateService.getCalenderWeekCollapsedStates();

    let k = 0;

    const startIndex = calenderWeeksCollapsedState.length - 53;

    calenderWeeksCollapsedState.slice(startIndex).forEach((flag, idx) => {
      flag
        ? (k += Math.min(this._DAYS_IN_WEEK, 1) * this._BASE_COLUMN_WIDTH)
        : (k += this._DAYS_IN_WEEK * this._BASE_COLUMN_WIDTH);
    });
    return k;
  }

  getNumberOfLogicalDataColumns() {
    //console.log(`TableStructureService::getNumberOfLogicalDataColumns() -- already cached`);

    const calenderWeeksCollapsedState =
      this._serviceRegister.tableStateService.getCalenderWeekCollapsedStates();

    // Lazy-Loading-Pattern
    let numberOfLogicalDataColumns =
      this._serviceRegister.cacheService.restoreNumberOfLogicalDataColumnsForCollapsedState(
        calenderWeeksCollapsedState
      );
    if (!Number.isFinite(numberOfLogicalDataColumns)) {
      numberOfLogicalDataColumns = this._calculateNumberOfLogicalDataColumns();

      this._serviceRegister.cacheService.saveNumberOfLogicalDataColumnsForCollapsedState(
        calenderWeeksCollapsedState,
        numberOfLogicalDataColumns
      );
    }
    return numberOfLogicalDataColumns;
  }

  //// Erzeugt die Strukturen, die die Template des Planners zum Erzeugen der Monats-Felder der obersten Kopfzeile verwendet
  getMonthHeaderRowObjects() {
    //console.log(`TableStructureService::getMonthHeaderRowObjects()`);

    const months = [];

    const monthNames = this._serviceRegister.calenderService.MONTH_NAMES;

    const monthsArray =
      this.getEntityArrays().daysInMonthAsIndicesOfDayStructure;

    monthsArray.forEach((dayStructureIndices, monthNumber) => {
      // Der Name des Monats wird nur für die aus dem betrachteten Jahr angezeigt
      const monthName =
        monthNumber > 0 && monthNumber < 13 ? monthNames[monthNumber - 1] : "";

      let monthNumberToPush = monthNumber;
      if (monthNumberToPush === 0) monthNumberToPush = 12; // ist zwar aus dem Vorjahr und kriegt keinen Text, soll durch CSS wie Dezember coloriert werden
      if (monthNumberToPush === 13) monthNumberToPush = 1; // ist zwar aus dem Folgejahr und kriegt keinen Text, soll durch CSS wie Januar coloriert werden

      const indexOfFirstDayCurrentMonth = dayStructureIndices[0];
      const intervalOfFirstDayCurrentMonth = this._getGridIntervalForDayOfYear(
        indexOfFirstDayCurrentMonth,
        false
      );
      if (intervalOfFirstDayCurrentMonth) {
        const startColumn =
          this.HEADER_COLUMNS + intervalOfFirstDayCurrentMonth[0];

        const indexOfLastDayCurrentMonth = dayStructureIndices.at(-1);

        const intervalOfLastDayCurrentMonth = this._getGridIntervalForDayOfYear(
          indexOfLastDayCurrentMonth,
          true
        );

        if (intervalOfLastDayCurrentMonth) {
          let endColumn =
            this.HEADER_COLUMNS + intervalOfLastDayCurrentMonth[1];

          months.push({
            name: monthName,
            month_number: monthNumberToPush,
            style_: `grid-column: ${startColumn} / ${
              endColumn + 1
            }; min-width: ${
              this._BASE_CELL_WIDTH * (endColumn + 1 - startColumn)
            }rem; height: ${this._BASE_CELL_HEIGHT}rem;`,
          });
        }
      }
    });
    return months;
  }

  //// Erzeugt die Strukturen, die die Template des Planners zum Erzeugen der Kalenderwochen-Felder der zweiten Kopfzeile verwendet
  getWeekHeaderRowObjects() {
    //console.log(`TableStructureService::getWeekHeaderRowObjects()`);

    const weeks = [];

    const weeksArray = this.getEntityArrays().daysInWeekAsIndicesOfDayStructure;

    const calenderWeeksCollapsedState =
      this._serviceRegister.tableStateService.getCalenderWeekCollapsedStates();

    weeksArray.forEach((dayStructureIndices, weekNumber) => {
      const weekName =
        weekNumber >= 1 && weekNumber <= 52
          ? `${weekNumber.toString().padStart(2, "0")}`
          : "";

      const indexOfFirstDayCurrentWeek = dayStructureIndices[0];
      const startColumn =
        this.HEADER_COLUMNS +
        // wir lassen in _getGridIntervalForDayOfYear das zweite Argument weg,
        // damit wir einen Fehler erhalten, wenn es kein Match gibt
        this._getGridIntervalForDayOfYear(indexOfFirstDayCurrentWeek)[0];

      const indexOfLastDayCurrentWeek = dayStructureIndices.at(-1);

      let endColumn =
        this.HEADER_COLUMNS +
        // wir lassen in _getGridIntervalForDayOfYear das zweite Argument weg,
        // damit wir einen Fehler erhalten, wenn es kein Match gibt
        this._getGridIntervalForDayOfYear(indexOfLastDayCurrentWeek)[1];

      if (calenderWeeksCollapsedState[weekNumber]) {
        endColumn = startColumn + this._BASE_COLUMN_WIDTH - 1; // bei kollabierten KWs ist IMMER die fixe Breite von LOGIC__BASE_COLUMN_WIDTH GridColumns zu verwenden
      }

      weeks.push({
        name: weekName,
        week_number: weekNumber,
        collapsed: calenderWeeksCollapsedState[weekNumber],
        style_: `grid-column: ${startColumn} / ${endColumn + 1}; width: ${
          this._BASE_CELL_WIDTH * (endColumn + 1 - startColumn)
        }rem; height: ${this._BASE_CELL_HEIGHT}rem;`,
      });
    });
    return weeks;
  }

  //// Erzeugt die Strukturen, die die Template des Planners zum Erzeugen der Tag-Felder der dritten Kopfzeile verwendet
  getDayHeaderRowObjects() {
    //console.log(`TableStructureService::getDayHeaderRowObjects()`);

    const days = [];

    const weekdayNames = this._serviceRegister.calenderService.WEEKDAY_NAMES;

    const entityArrays = this.getEntityArrays();

    const calenderWeeksCollapsedState =
      this._serviceRegister.tableStateService.getCalenderWeekCollapsedStates();

    // Unter einer kollabierten KW soll nur ein Feld (in der breite eines Tages im ausgeklappten Zustand)
    // angezeigt werden. Hier filtern wir die Liste der Tage zu einer Woche so vor, dass am Ende in einer
    // kollabierten Woche nur der erste und der letzte der ursprünglichen sieben Tage bleibt
    // Bei dieser Wahl können noch immer Meta-Aussagen über gesamten Wochenbereich bestimmt werden, aber
    // gleichzeitig ist eindeutig feststellbar, dass es sich um eine kollabierte Woche handelt
    // (immer 2Tage! Nicht kollabiert: immer _DAYS_IN_WEEK Tage!)
    const filteredDaysInWeekAsIndices =
      entityArrays.daysInWeekAsIndicesOfDayStructure.map(
        (daysInWeekAsIdx, idx) =>
          calenderWeeksCollapsedState[idx]
            ? [daysInWeekAsIdx[0], daysInWeekAsIdx.at(-1)]
            : daysInWeekAsIdx
      );

    filteredDaysInWeekAsIndices.forEach((daysOfWeekIndices, weekNumber) => {
      if (daysOfWeekIndices.length === 2) {
        // Der Tag-Feld-Bereich einer kollabierten Kalenderwoche
        const firstDay = entityArrays.dayStructures[daysOfWeekIndices[0]];
        const lastDay = entityArrays.dayStructures[daysOfWeekIndices[1]];

        // wir lassen in _getGridIntervalForDayOfYear das zweite Argument weg,
        // damit wir einen Fehler erhalten, wenn es kein Match gibt
        const startDataColumn = this._getGridIntervalForDayOfYear(
          daysOfWeekIndices[0]
        )[0];
        const endDataColumn = startDataColumn + this._BASE_COLUMN_WIDTH - 1;

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
          }; width: ${
            this._BASE_CELL_WIDTH * (endDataColumn + 1 - startDataColumn)
          }rem; height: ${this._BASE_CELL_HEIGHT}rem;`,
          display_text: false,
          collapsed: true,
        });
      } else {
        daysOfWeekIndices.forEach((dayIndex) => {
          // wir lassen in _getGridIntervalForDayOfYear das zweite Argument weg,
          // damit wir einen Fehler erhalten, wenn es kein Match gibt
          const dataColumns = this._getGridIntervalForDayOfYear(dayIndex);
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
            }; width: ${
              this._BASE_CELL_WIDTH * (endDataColumn + 1 - startDataColumn)
            }rem; height: ${this._BASE_CELL_HEIGHT}rem;`,
            display_text: true,
            not_this_year: day.notThisYear,
          });
        });
      }
    });
    return days;
  }

  //// Erzeugt die Strukturen, die die Template des Planners zum Erzeugen der (noch einzigen) Daten Kopfspalte verwendet
  _createDataHeaderColumnObjects(textTester) {
    //console.log(`TableStructureService::_createDataHeaderColumnObjects() -- already cached`);

    const rows = [];

    const registeredRowKeys =
      this._serviceRegister.tableDataService.getRegisteredRowKeys();
    const registeredRowTitles =
      this._serviceRegister.tableDataService.getRegisteredRowTitles();

    // test text-width
    const sampleField = document.querySelector(".planner-header-column");
    let width_in_rem = 20;
    if (textTester && sampleField) {
      let _widthInRem = 0;
      for (let name of registeredRowTitles) {
        const textWidthInRem = this._getWidthOfTextInRem(
          textTester,
          name,
          sampleField.style.fontSize
        );
        if (textWidthInRem > _widthInRem) {
          _widthInRem = textWidthInRem;
        }
      }
      width_in_rem = _widthInRem;
    }

    registeredRowKeys.forEach((key, keyIdx) => {
      rows.push({
        key: key,
        title: registeredRowTitles[keyIdx],
        col_style: `grid-column: ${this.HEADER_COLUMNS}; grid-row: ${
          this.HEADER_ROWS + keyIdx
        };`,
        row_style: `grid-row: ${this.HEADER_ROWS + keyIdx};`,
        style_: `${this.row_style};${this.row_style}; width: ${width_in_rem}rem; height: ${this._BASE_CELL_HEIGHT}rem;`,
      });
    });
    return rows;
  }

  getDataHeaderColumnObjects() {
    // Lazy-Loading-Pattern
    let dataHeaderColumnObjects =
      this._serviceRegister.cacheService.restoreDataHeaderColumnObjectsForTextTesterElement(
        this._textTesterWidget
      );
    if (!dataHeaderColumnObjects) {
      dataHeaderColumnObjects = this._createDataHeaderColumnObjects(
        this._textTesterWidget
      );

      this._serviceRegister.cacheService.saveDataHeaderColumnObjectsForTextTesterElement(
        this._textTesterWidget,
        dataHeaderColumnObjects
      );
    }
    return dataHeaderColumnObjects;
  }

  //// Erzeugt die Strukturen, die die Template des Planners zum darstellen der Blöcke verwendet
  getBlockDataRenderObjects() {
    // console.log(`TableStructureService::getBlockDataRenderObjects()`);

    const blockDataRenderObjects = [];

    const blockDataRenderObjectsArray =
      this._serviceRegister.tableDataService.generateBlockDataRenderObjects();

    const dayOfYearToGridIntervalMapping =
      this._getDayOfYearToGridIntervalMapping();

    blockDataRenderObjectsArray.forEach((block) => {
      const blockStartDayOfYearIdx =
        this._getBestMatchingDayOfYearIdxForIntervalMapping(
          block.startDayOfYearIdx,
          false
        );
      let blockEndDayOfYearIdx = block.endDayOfYearIdx;
      if (blockStartDayOfYearIdx > blockEndDayOfYearIdx) {
        console.log(`skipping block '${block.id} (${block.labels[0]})'...`);
      } else {
        blockEndDayOfYearIdx =
          this._getBestMatchingDayOfYearIdxForIntervalMapping(
            block.endDayOfYearIdx,
            true
          );
        const startColumn =
          this.HEADER_COLUMNS +
          dayOfYearToGridIntervalMapping[blockStartDayOfYearIdx][0];
        const endColumn =
          this.HEADER_COLUMNS +
          dayOfYearToGridIntervalMapping[blockEndDayOfYearIdx][1];

        const availableWidthInRem =
          this._BASE_CELL_WIDTH * (endColumn + 1 - startColumn);

        const cell = document.querySelector(".planner-block");

        let label = "";

        if (cell) {
          label = this._chooseLabelForAvailableWidth(
            block.labels,
            availableWidthInRem,
            cell
          );
        }

        blockDataRenderObjects.push({
          block_id: block.id,
          block_name: label,
          row_key_list: block.row_key_list,
          style_: `grid-row: ${
            block.start_data_row_index + this.HEADER_ROWS
          } / ${
            block.end_data_row_index + this.HEADER_ROWS + 1
          }; grid-column: ${startColumn} / ${
            endColumn + 1
          }; background-color: ${
            block.color
          }; width: ${availableWidthInRem}rem; white-space: nowrap;`,
          unspecified: block.unspecified,
        });
      }
    });
    return blockDataRenderObjects;
  }

  //// Erzeugt die Strukturen, die die Template des Planners zum darstellen der Daten-Zellen verwendet, die frei sind
  getNonBlockedDayFillingObjectsForRowByIndex(rowIndex) {
    //console.log(`TableStructureService::getNonBlockedDayFillingObjectsForRowByIndex(${rowIndex})`);

    const nonBlockedDayFillingObjects = [];

    const blockIntervals =
      this._serviceRegister.tableDataService.getBlockDataIntervalsForRowIdx(
        rowIndex
      );

    // einen GridAssistant für die aktuelle "Collapsed-Situation" erzeugen
    const gridAssistant = this.getGridAssistant();

    // Blockdaten-Intervalle, so nicht leer, mappen von dayOfYearIndices auf GridColumns:
    let dataColumnIntervals = [];
    if (blockIntervals.length !== 0) {
      dataColumnIntervals = blockIntervals
        .map((i) => [
          this._getGridIntervalForDayOfYear(i.start, false)[0],
          this._getGridIntervalForDayOfYear(i.end, true)[1],
        ])
        .filter((arr) => arr[0] <= arr[1])
        .map((arr) => new Interval(arr[0], arr[1]));
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
          };width: ${this._BASE_CELL_WIDTH * (brs[1] - brs[0])}rem;`,
        });
      })
    );
    return nonBlockedDayFillingObjects;
  }

  getBlockTypeEntriesForBlocktypeSelectionMenu() {
    if (this._blockTypeMenuWidget && this._textTesterWidget) {
      const { left, right } = this._blockTypeMenuWidget.getBoundingClientRect();
      const availableWidthInRem = (right - left) / 10;
      const blockTypeEntriesForBlocktypeSelectionMenu = [];

      const registeredBlockTypeEntriesForBlocktypeSelectionMenu =
        this._serviceRegister.tableDataService.getRegisteredBlockTypeEntriesForBlocktypeSelectionMenu();

      registeredBlockTypeEntriesForBlocktypeSelectionMenu.forEach((e) => {
        const label = this._chooseLabelForAvailableWidth(
          e.labels,
          availableWidthInRem,
          this._textTesterWidget
        );

        blockTypeEntriesForBlocktypeSelectionMenu.push({
          type: e.type,
          color: e.color,
          label,
        });
      });

      return blockTypeEntriesForBlocktypeSelectionMenu.sort((a, b) => {
        if (a.label.toLowerCase() == b.label.toLowerCase()) return 0;
        return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1;
      });
    }
    return [];
  }
}

const createTableStructureService = function (
  year,
  weekDayMask = [0, 1, 2, 3, 4]
) {
  return new TableStructureService(year, weekDayMask);
};

export default createTableStructureService;
