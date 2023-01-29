import { reactive } from "vue";
import Interval from "../Interval";
export const plannerStore = reactive({
  render_planner_flag: true,
  year: 0,
  column_offset: 0,
  row_offset: 0,
  row_keys: [],
  date_helper: {},
  block_data: new Map(),
  kw_flags: [],
  addBlockedDataRange(row_idx, daysBlockedStart, daysBlockedEnd) {
    /* Blöcke sind nie überlappend, das wird von (bzw. ist durch) externe (die "zuspielende")
       Logik gesichert (bzw. zu sichern!)
       Also muss hier nur die richtige Reihenfolge gesichert werden
    */

    // Dirty-Hack to make planner rerender
    this.render_planner_flag = false;

    if (!this.block_data.has(row_idx)) {
      this.block_data.set(row_idx, []);
    }
    const row_intervals = this.block_data.get(row_idx);

    const intervalToAdd = new Interval(daysBlockedStart, daysBlockedEnd);
    row_intervals.forEach((existingInterval) => {
      if (existingInterval.intersects(intervalToAdd)) {
        // hier könnte das render_planner_flag wieder gesetzt werden,
        // aber da dies ein echter Fehler ist, ist das nicht-Anzeigen des
        // Planners vielleicht sogar die bessere Lösung :-)
        throw error("illegal overlap with existing blocks");
      }
    });

    row_intervals.push(intervalToAdd);
    row_intervals.sort((i1, i2) => i1.start - i2.start);

    this.render_planner_flag = true;
  },
  freeDaysToRender(row_idx) {
    const allDays = this.date_helper.daysForRender.map(
      (dfr) => dfr.day_of_year
    );
    if (!this.block_data.get(row_idx)) {
      //console.log(`block-data empty or not yet initialized`);
      return allDays;
    }
    //console.log(`#### START freeDaysToRender(${row_idx})`);

    const ret = [];
    let k = 0;

    const intervals = this.block_data.get(row_idx);

    for (let iid in intervals) {
      const blockedInterval = intervals[iid];
      while (k < allDays.length) {
        const d = allDays[k];
        /* wir pushen nicht die Werte von allDays (nur day_of_year-Angabe),
           sondern die Korrespondierenden Objects aus this.date_helper.daysForRender
           in das Ergebnis-Array (siehe auch unten beim Hinzufügen des Restes)
        */
        const d_to_push = this.date_helper.daysForRender[k];
        if (d >= blockedInterval.start) {
          break;
        }
        ret.push(d_to_push);
        k++;
      }
      // HIER MUSS UMGEDACHT WERDEN WENN WIR NICHT MEHR TAGE SONDERN COLUMNS RENDERN
      // (ABSTRAKTION)
      // DIES WIRD NÖTIG SEIN UM BEISPIELSWEISE GEWISSE SPALTEN AUSBLENDEN ZU KÖNNEN
      k = allDays.indexOf(blockedInterval.end + 1);
      if (k < 0) {
        return ret; // fertig, weil dann das Ende des Blocks mit dem "Ende aller Tage" zusammenfällt
      }
    }
    return [...ret, ...this.date_helper.daysForRender.slice(k)]; // slice(k) -> Alle Element ab k (bis zum Letzen also)
  },
  getNumberOfNonHeaderColumnsToRender() {
    let k = 0;
    for (let i = 0; i < this.kw_flags.length; i++) {
      // wenn die aktuell betrachtete KW 'collapsed' ist (kw_flag===false) belegt sie eine Spalte, ansonsten so viele wie Tage darin enthalten sind
      k += this.kw_flags[i] ? this.date_helper.table_data.weeks[i].length : 1;
    }
    return k;
  },
  getDataColumnForDayOfYear(dayOfYear) {
    const daysOfKWs = this.date_helper.table_data.weeks;

    let data_column_offset = 0;
    for (let kw_idx = 0; kw_idx < daysOfKWs.length; kw_idx++) {
      const days_of_week = daysOfKWs[kw_idx];
      if (days_of_week.includes(dayOfYear)) {
        if (this.kw_flags[kw_idx]) {
          return data_column_offset + days_of_week.indexOf(dayOfYear) + 1;
        } else {
          // alle Tage dieser Woche sind in einer einzigen Spalte
          return data_column_offset + 1;
        }
      }
      // data_column_offset um breite dieser Spalte erhöhen
      data_column_offset += this.kw_flags[kw_idx] ? days_of_week.length : 1;
    }
    throw error(`provided day ${dayOfYear} out of bounds`);
  },
  getMonthHeaderColumnsToRender() {
    const months = [];
    this.date_helper.monthNames.forEach((month_name, month_idx) => {
      const days = this.date_helper.table_data.months[month_idx];
      const startColumn =
        this.column_offset + this.getDataColumnForDayOfYear(days[0]);
      const endColumn =
        this.column_offset + this.getDataColumnForDayOfYear(days.at(-1));
      months.push({
        name: month_name,
        style_: `grid-column: ${startColumn} / ${endColumn + 1};`,
      });
    });
    return months;
  },
  getWeekHeaderColumnsToRender() {
    const weeks = [];
    this.date_helper.table_data.weeks.forEach((days, kw_idx) => {
      const week_number = this.date_helper.table_data.week_0
        ? kw_idx
        : kw_idx + 1;
      const week_name =
        week_number >= 1 && week_number <= 53
          ? `KW ${week_number.toString().padStart(2, "0")}`
          : "";
      const startColumn =
        this.column_offset + this.getDataColumnForDayOfYear(days[0]);
      const endColumn =
        this.column_offset + this.getDataColumnForDayOfYear(days.at(-1));
      let style_ = `grid-column: ${startColumn} / ${endColumn + 1};`;
      if (!this.kw_flags[kw_idx]) {
        // wenn gerade diese KW collapsed ist, dann reduziert sie sich auf eine Spalte!
        style_ = `grid-column: ${startColumn};`;
      }
      weeks.push({
        name: week_name,
        style_,
      });
    });
    return weeks;
  },
});
