class PlannerModel {
  //// Konstanten
  MONTH_NAMES = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];

  WEEKDAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  // eine "logische" Spalte besteht aus LOGIC_BASE_COLUMN_WIDTH GridColumns
  LOGIC_BASE_COLUMN_WIDTH = 7;

  constructor(columnOffset, rowOffset, year, rowHeaderData, store) {
    this.rowHeaderData = rowHeaderData;
    this.store = store;

    // write to store
    this.store.column_offset = columnOffset;
    this.store.row_offset = rowOffset;
    this.store.year = year;
    this.store.row_keys = rowHeaderData.map((r) => r.key);
    this.store.caches = {
      cachesForYear: new Map(),
      cachesForCollapsedState: new Map(),
    };
    this.store.state = {
      kwCollapseStates: [],
      _force_rerender_handle_for_planner_component: true,
    };
  }

  //// Data
  getDataRowKeys() {
    return this.store.row_keys;
  }
  addBlockedDataRange(row, startDate, endDate) {
    this.store.addBlockedDataRange(row, startDate, endDate);
  }

  //// State
  rerenderPlannerComponent() {
    this.store.state._force_rerender_handle_for_planner_component =
      !this.store.state._force_rerender_handle_for_planner_component;
  }
  setCollapsedState(kwIdx, state) {
    this.store.state.kwCollapseStates[kwIdx] = state;
  }
  getCollapsedState(kwIdx) {
    return this.store.state.kwCollapseStates[kwIdx];
  }
  getCollapsedStates() {
    return this.store.state.kwCollapseStates;
  }

  //// Date / Mapping / Utilities
  dayOfYearFromDate(date) {
    const month = date.getMonth(); /* 0,...,11 */
    const dayOfMonth = date.getDate(); /* 1,...,31 */
    return this.getCacheForYear().months[month][dayOfMonth - 1];
  }

  //// CACHES
  getCacheForCollapsedState() {
    const hash =
      this.getCollapsedStates()
        .map((s) => (s ? "+" : "-"))
        .join(".") || "empty";

    if (!this.store.caches.cachesForCollapsedState.has(hash)) {
      this.store.caches.cachesForCollapsedState.set(
        hash,
        this.fillCachesForCollapsedState(this.store.state.kwCollapseStates)
      );
    }
    return this.store.caches.cachesForCollapsedState.get(hash);
  }
  fillCachesForCollapsedState(collapsedState) {
    const cacheValue = {
      dataGridColumnsForDayOfYear: [],
    };

    const daysOfKWs = this.getCacheForYear().weeks;

    let data_column_offset = 0;
    for (let kw_idx = 0; kw_idx < daysOfKWs.length; kw_idx++) {
      const days_of_week = daysOfKWs[kw_idx];

      if (collapsedState[kw_idx]) {
        days_of_week.forEach((day_of_year, idx) => {
          const startGridColumn = data_column_offset + idx + 1;
          cacheValue.dataGridColumnsForDayOfYear[day_of_year] = [
            startGridColumn,
            startGridColumn,
          ];
        });
      } else {
        days_of_week.forEach((day_of_year, idx) => {
          const startGridColumn =
            data_column_offset + this.LOGIC_BASE_COLUMN_WIDTH * idx + 1;
          cacheValue.dataGridColumnsForDayOfYear[day_of_year] = [
            startGridColumn,
            startGridColumn + this.LOGIC_BASE_COLUMN_WIDTH - 1,
          ];
        });
      }
      data_column_offset += collapsedState[kw_idx]
        ? // bei kollabierten KWs wird nur ein Tag gerendert, dieser dann aber mit der Breite LOGIC_BASE_COLUMN_WIDTH
          // daher muss hier als offset die LOGIC_BASE_COLUMN_WIDTH gewählt werden
          this.LOGIC_BASE_COLUMN_WIDTH
        : this.LOGIC_BASE_COLUMN_WIDTH * days_of_week.length;
    }

    return cacheValue;
  }

  getCacheForYear(year = this.store.year) {
    if (!this.store.caches.cachesForYear.has(year)) {
      this.store.caches.cachesForYear.set(
        year,
        this.generateModelDataForYear(year)
      );
    }
    return this.store.caches.cachesForYear.get(year);
  }
  generateModelDataForYear(year) {
    const cacheValue = {
      weeks: [],
      days: [],
      months: [],
      /*
        wenn week_0 === true:  es gibt eine 'KW0' und der Index des
                               Arrays entspricht dem 'KW-Name'
        wenn week_0 === false: das Array beginnt mit der KW1,
                               der Index des Arrays entspricht
                               dem 'KW-Name-1'
        */
      week_0: true,
    };

    // Zähler für Tage und Monate
    let d = 0;
    let w = 0;

    cacheValue.weeks[w] = [];
    for (let m = 0; m < 12; m++) {
      cacheValue.months[m] = [];
      for (let dm = 1; dm <= 31; dm++) {
        let _date = new Date(year, m, dm);
        if (_date.getMonth() === m && _date.getDate() === dm) {
          const weekDay = _date.getDay();
          if (weekDay === 1 && d !== 0 /* 0:So, 1:Mo etc. */) {
            // Es ist ein Montag (und nicht der erste Tag des Jahres ;-)), also beginnt eine neue Woche
            w += 1;
            cacheValue.weeks[w] = [];
          }
          d += 1;
          cacheValue.days.push({
            day_of_year: d,
            day_of_month: dm,
            day_of_week: weekDay,
            week_idx: w,
            month_idx: m,
          });
          cacheValue.weeks[w].push(d);
          cacheValue.months[m].push(d);
        }
      }
    }

    if (cacheValue.weeks[0].length === 0) {
      cacheValue.weeks.shift();
    }

    /* Konvention (EU): die 1.KW ist die, die den 4.Januar enthält */
    if (cacheValue.weeks[0].includes(4)) {
      cacheValue.week_0 = false;
    }

    return cacheValue;
  }
}

const initPlannerModel = function (
  columnOffset,
  rowOffset,
  year,
  rowHeaderData,
  plannerStore
) {
  return new PlannerModel(
    columnOffset,
    rowOffset,
    year,
    rowHeaderData,
    plannerStore
  );
};

export default initPlannerModel;
