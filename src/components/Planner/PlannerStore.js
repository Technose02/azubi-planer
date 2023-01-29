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

  /* NEEDS MASSIVE WORKOVER CONCERNING COLLAPSIBLE KWs */
  freeDaysToRender(row_idx) {
    //// NUR WORKAROUND FALLS (NOCH) KEINE BLÖCKE BEKANNT
    const allDays = [
      ...Array(this.getNumberOfNonHeaderColumnsToRender()).keys(),
    ].map((d) => d + 1);
    if (!this.block_data.get(row_idx)) {
      return allDays;
    }
    //////////////////////////////////////////////////////

    const ret = [];
    let k = 0;

    const intervals = this.block_data.get(row_idx);

    const daysForRender = this.getDayHeaderColumnsToRender();
    for (let iid in intervals) {
      const blockedInterval = intervals[iid];
      while (k < allDays.length) {
        const d = allDays[k];
        /* wir pushen nicht die Werte von allDays (nur day_of_year-Angabe),
           sondern die Korrespondierenden Objects, die über getDayHeaderColumnsToRender() erzeugten
           in das Ergebnis-Array (siehe auch unten beim Hinzufügen des Restes)
        */
        const d_to_push = daysForRender[k];
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
    return [...ret, ...daysForRender.slice(k)]; // slice(k) -> Alle Element ab k (bis zum Letzen also)
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
        kw_idx,
      });
    });
    return weeks;
  },
  getDayHeaderColumnsToRender() {
    const days = [];

    // Im Fall von "collapsed" KWs ist nur ein Tag zu rendern. Über dieses Array
    // merken wir uns, ob zu einer KW schon ein Tag mit render:true gepushed wurde
    const at_least_one_day_of_week_set_visible = Array(
      this.date_helper.table_data.weeks.length
    ).fill(false);

    this.date_helper.table_data.days.forEach((day_structure, day_idx) => {
      const day_of_year = day_structure.day_of_year;
      const column =
        this.column_offset + this.getDataColumnForDayOfYear(day_of_year);
      const kw_idx = day_structure.in_week;

      let render_day = true;
      let display_day_text = true;
      if (!this.kw_flags[kw_idx]) {
        // Die Woche zu diesem Tag ist collapsed!
        render_day = !at_least_one_day_of_week_set_visible[kw_idx]; // nur rendern wenn zu dieser KW noch kein Tag mit render:true gepushed ist
        display_day_text = false; // wenn KW collapsed ist dann keinen Text im Tag-Feld ausgeben
      }

      days.push({
        day_of_year,
        day_of_week: this.date_helper.weekDayNames[day_structure.day_of_week],
        day_of_month: day_structure.day_of_month,
        style_: `grid-column: ${column};`,
        render: render_day,
        display_text: display_day_text,
      });

      if (render_day) {
        at_least_one_day_of_week_set_visible[kw_idx] = true;
      }
    });
    return days;
  },
});
