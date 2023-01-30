import { reactive } from "vue";
import Interval from "../Interval";
import GridAssistant from "./GridAssistant";

// eine "logische" Spalte besteht aus LOGIC_BASE_COLUMN_WIDTH GridColumns
const LOGIC_BASE_COLUMN_WIDTH = 7;

export const plannerStore = reactive({
  LOGIC_BASE_COLUMN_WIDTH: LOGIC_BASE_COLUMN_WIDTH, // export if needed
  year: 0,
  column_offset: 0,
  row_offset: 0,
  row_keys: [],
  block_data: new Map(),
  addBlockedDataRange(row_idx, daysBlockedStart, daysBlockedEnd) {
    /* Blöcke sind nie überlappend, das wird von (bzw. ist durch) externe (die "zuspielende")
       Logik gesichert (bzw. zu sichern!)
       Also muss hier nur die richtige Reihenfolge gesichert werden
    */

    // Dirty-Hack to make planner rerender
    this.model.rerenderPlannerComponent();

    if (!this.block_data.has(row_idx)) {
      this.block_data.set(row_idx, []);
    }
    const row_intervals = this.block_data.get(row_idx);

    const intervalToAdd = new Interval(daysBlockedStart, daysBlockedEnd);
    row_intervals.forEach((existingInterval) => {
      if (existingInterval.intersects(intervalToAdd)) {
        throw error("illegal overlap with existing blocks");
      }
    });

    row_intervals.push(intervalToAdd);
    row_intervals.sort((i1, i2) => i1.start - i2.start);

    this.model.rerenderPlannerComponent();
  },
  freeDaysToRender(row_idx) {
    const daysForRender = this.getDayHeaderColumnsToRender();
    if (!this.block_data.get(row_idx)) {
      return daysForRender;
    }

    // Daten-Spalten beginnen mit Spalte offset ; die letzte Datenspalte ist offset+this.getNumberOfNonHeaderGridColumnsToRender(), da rechts kein offset vorgesehen ist!
    const firstDataCol = this.column_offset;
    const lastDataCol =
      this.column_offset + this.getNumberOfNonHeaderGridColumnsToRender();

    // Datenblock-Intervalle:
    let dataColumnIntervals = this.block_data
      .get(row_idx)
      .map(
        (i) =>
          new Interval(
            this.getDataGridColumnsForDayOfYear(i.start)[0],
            this.getDataGridColumnsForDayOfYear(i.end)[1]
          )
      );

    // Muss Lücken vor, hinter und zwischen Blöcken füllen

    // zu füllende Grid-Column-Intervalle ermitteln:
    const ga = new GridAssistant(
      firstDataCol,
      lastDataCol,
      this.LOGIC_BASE_COLUMN_WIDTH
    );

    const daysToRender = [];
    let gapsToFill = ga.determineGapsToFill(dataColumnIntervals);

    gapsToFill.forEach((i) =>
      ga.generateBlockRangeSequenceFromInterval(i).forEach((brs) => {
        daysToRender.push({
          is_fill_day: true,
          day_of_year: -1,
          style_: `grid-column: ${brs[0] + this.column_offset} / ${
            brs[1] + this.column_offset
          };`,
        });
      })
    );
    return daysToRender;
  },

  getNumberOfNonHeaderGridColumnsToRender() {
    //console.log("getNumberOfNonHeaderGridColumnsToRender called");
    let k = 0;
    const cacheForYear = this.model.getCacheForYear();

    for (let i = 0; i < cacheForYear.weeks.length; i++) {
      // wenn die aktuell betrachtete KW 'collapsed' ist (kw_flag===false) belegt
      // sie eine Basis-Spalte (mit der Länge 'LOGIC_BASE_COLUMN_WIDTH' [Anzahl Grid-Spalten]),
      // ansonsten so viele wie Tage darin enthalten sind
      k += this.model.getCollapsedState(i) ? 1 : cacheForYear.weeks[i].length;
    }
    console.log((LOGIC_BASE_COLUMN_WIDTH * k) / 7);
    return LOGIC_BASE_COLUMN_WIDTH * k;
  },
  getDataGridColumnsForDayOfYear(dayOfYear) {
    //console.log(`getDataGridColumnsForDayOfYear(${dayOfYear}) called`);
    const daysOfKWs = this.model.getCacheForYear().weeks;

    let data_column_offset = 0;
    for (let kw_idx = 0; kw_idx < daysOfKWs.length; kw_idx++) {
      const days_of_week = daysOfKWs[kw_idx];
      if (days_of_week.includes(dayOfYear)) {
        if (this.model.getCollapsedState(kw_idx)) {
          const startGridColumn =
            data_column_offset + days_of_week.indexOf(dayOfYear) + 1;
          return [startGridColumn, startGridColumn];
        } else {
          const startGridColumn =
            data_column_offset +
            LOGIC_BASE_COLUMN_WIDTH * days_of_week.indexOf(dayOfYear) +
            1;
          return [
            startGridColumn,
            startGridColumn + LOGIC_BASE_COLUMN_WIDTH - 1,
          ];
        }
      }
      data_column_offset += this.model.getCollapsedState(kw_idx)
        ? // bei kollabierten KWs wird nur ein Tag gerendert, dieser dann aber mit der Breite LOGIC_BASE_COLUMN_WIDTH
          // daher muss hier als offset die LOGIC_BASE_COLUMN_WIDTH gewählt werden
          LOGIC_BASE_COLUMN_WIDTH
        : LOGIC_BASE_COLUMN_WIDTH * days_of_week.length;
    }
    throw error(`provided day ${dayOfYear} out of bounds`);
  },

  getMonthHeaderColumnsToRender() {
    const months = [];

    const cacheForYear = this.model.getCacheForYear();

    this.model.MONTH_NAMES.forEach((month_name, month_idx) => {
      const days = cacheForYear.months[month_idx];
      const startColumn =
        this.column_offset + this.getDataGridColumnsForDayOfYear(days[0])[0];
      const lastDayOfMonthAsDayStructure = cacheForYear.days[days.at(-1) - 1];
      let endColumn =
        this.column_offset +
        this.getDataGridColumnsForDayOfYear(
          lastDayOfMonthAsDayStructure.day_of_year
        )[1];
      const is_in_last_week_of_year =
        lastDayOfMonthAsDayStructure.week_idx === cacheForYear.weeks.length - 1;
      if (
        is_in_last_week_of_year &&
        this.model.getCollapsedState(lastDayOfMonthAsDayStructure.week_idx)
      ) {
        // wenn die letzte KW kollabiert ist und weniger als sieben Tage enthält,
        // dann muss die Grenze am Ende um die Anzahl der fehlenden Tage verlängert werden
        endColumn = endColumn - lastDayOfMonthAsDayStructure.day_of_week + 7; // LOGIC_BASE_COLUMN_WIDTH? TODO: verify (wenn alles fertig ist, dann mal LOGIC_BASE_COLUMN_WIDTH variieren)
      }
      months.push({
        name: month_name,
        month_number: month_idx + 1,
        style_: `grid-column: ${startColumn} / ${endColumn + 1};`,
      });
    });
    return months;
  },
  getWeekHeaderColumnsToRender() {
    const weeks = [];
    const cacheForYear = this.model.getCacheForYear();
    cacheForYear.weeks.forEach((days, kw_idx) => {
      const week_number = cacheForYear.week_0 ? kw_idx : kw_idx + 1;
      const week_name =
        week_number >= 1 && week_number <= 52
          ? `KW ${week_number.toString().padStart(2, "0")}`
          : "";
      const startColumn =
        this.column_offset + this.getDataGridColumnsForDayOfYear(days[0])[0];
      let endColumn =
        this.column_offset +
        this.getDataGridColumnsForDayOfYear(days.at(-1))[1];
      if (this.model.getCollapsedState(kw_idx)) {
        endColumn = startColumn + LOGIC_BASE_COLUMN_WIDTH - 1; // bei kollabierten KWs ist IMMER die fixe Breite von LOGIC_BASE_COLUMN_WIDTH GridColumns zu verwenden
      }
      weeks.push({
        name: week_name,
        style_: `grid-column: ${startColumn} / ${endColumn + 1};`,
        kw_idx,
      });
    });
    return weeks;
  },
  getDayHeaderColumnsToRender() {
    const days = [];

    const modelCacheForYear = this.model.getCacheForYear();

    // Im Fall von "collapsed" KWs ist nur ein Tag zu rendern. Über dieses Array
    // merken wir uns, ob zu einer KW schon ein Tag mit render:true gepushed wurde
    const at_least_one_day_of_week_set_visible = Array(
      modelCacheForYear.weeks.length
    ).fill(false);

    modelCacheForYear.days.forEach((day_structure) => {
      const day_of_year = day_structure.day_of_year;
      let data_columns = this.getDataGridColumnsForDayOfYear(day_of_year);

      /* Anpassung, da hier ein Workaround greift. Im Falle einer
      kollabierten KW sollen nicht LOGIC_BASE_COLUMN_WIDTH kurze Tage sondern ein Langer
      gerendert werden (daher auch at_least_one_day_of_week_set_visible als flag ob ein Tag
        überhaupt gerendert werden soll).
        Daher nicht "data_columns[1]" sondern fix "data_columns[0] + LOGIC_BASE_COLUMN_WIDTH - 1"
        */
      data_columns[1] = data_columns[0] + LOGIC_BASE_COLUMN_WIDTH - 1;

      const startColumn = this.column_offset + data_columns[0];
      const endColumn = this.column_offset + data_columns[1];
      const kw_idx = day_structure.week_idx;

      let display_day_text = true;

      if (
        this.model.getCollapsedState(kw_idx) &&
        !at_least_one_day_of_week_set_visible[kw_idx]
      ) {
        // Die Woche zu diesem Tag ist collapsed, der aktuelle Tag soll aber angezeigt werden
        // In diesem Fall ist aber kein Text zu dem Tag auszugeben
        display_day_text = false;
      } else if (this.model.getCollapsedState(kw_idx)) {
        // Die Woche zu diesem Tag ist collapsed und der aktuelle Tag NICHT angezeigt werden
        return;
      }

      const week_number = this.model.getCacheForYear().week_0
        ? day_structure.week_idx
        : day_structure.week_idx + 1;

      days.push({
        day_of_year,
        day_of_month: day_structure.day_of_month,
        week_number,
        month_number: day_structure.month_idx + 1,
        day_of_week_str: this.model.WEEKDAY_NAMES[day_structure.day_of_week],
        day_of_week: day_structure.day_of_week,
        data_columns,
        style_: `grid-column: ${startColumn} / ${endColumn + 1};`,
        display_text: display_day_text,
      });

      at_least_one_day_of_week_set_visible[kw_idx] = true;
    });
    return days;
  },
});
