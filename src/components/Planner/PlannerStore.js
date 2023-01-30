import { assert } from "@vue/compiler-core";
import { reactive, render } from "vue";
import Interval from "../Interval";

// eine "logische" Spalte besteht aus LOGIC_BASE_COLUMN_WIDTH GridColumns
const LOGIC_BASE_COLUMN_WIDTH = 7;

export const plannerStore = reactive({
  render_planner_flag: true,
  LOGIC_BASE_COLUMN_WIDTH: LOGIC_BASE_COLUMN_WIDTH, // export if needed
  year: 0,
  column_offset: 0,
  row_offset: 0,
  row_keys: [],
  date_helper: {},
  block_data: new Map(),
  kw_is_collapsed: [],
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
    const daysForRender = this.getDayHeaderColumnsToRender();
    if (!this.block_data.get(row_idx)) {
      return daysForRender;
    }

    const ret = [];
    const dataColumnIntervals = this.block_data
      .get(row_idx)
      .map(
        (i) =>
          new Interval(
            this.getDataGridColumnsForDayOfYear(i.start)[0],
            this.getDataGridColumnsForDayOfYear(i.end)[1]
          )
      );

    const dataColumnsStartOfDaysForRender = daysForRender.map(
      (d) => d.data_columns[0]
    );

    let k = 0;
    for (let iid = 0; iid < dataColumnIntervals.length; iid++) {
      const blockedInterval = dataColumnIntervals[iid];

      let lastDayPushed = undefined;
      while (k < daysForRender.length) {
        const d_to_push = daysForRender[k];
        if (d_to_push.data_columns[1] >= blockedInterval.start) {
          break;
        }
        ret.push(d_to_push);
        lastDayPushed = d_to_push;
        k++;
      }

      let gap = 0;
      if (lastDayPushed) {
        gap = blockedInterval.start - lastDayPushed.data_columns[1] - 1;
      }

      if (gap > 0) {
        const daysLogicallyInGap =
          plannerStore.date_helper.table_data.days.slice(
            lastDayPushed.day_of_year,
            lastDayPushed.day_of_year + gap
          );
        // Prüfe ob alle zu der Lücke in derselben Woche liegen und ob diese Woche "kollabiert" ist:
        const kwIdxOfGap = daysLogicallyInGap[0].week_idx;
        const allDaysOfGapInSameWeek = daysLogicallyInGap.every(
          (d) => d.week_idx === kwIdxOfGap
        );
        const kwOfGapCollapsed = plannerStore.kw_is_collapsed[kwIdxOfGap];
        if (allDaysOfGapInSameWeek && kwOfGapCollapsed) {
          //// PUSH DAY FILLING GAP
          const fillDay = {
            is_fill_day: true,
            day_of_year: daysLogicallyInGap[0].day_of_year,
            week_number: daysLogicallyInGap[0].week_idx + 1,
            month_number: daysLogicallyInGap[0].month_idx + 1,
            style_: `grid-column: ${lastDayPushed.data_columns[1] + 2} / ${
              lastDayPushed.data_columns[1] + 2 + gap
            };`,
          };
          ret.push(fillDay);
        } else if (!allDaysOfGapInSameWeek) {
          console.log(
            "ZU KLÄREN: DIE TAGE ZUR DER LÜCKE LIEGEN NICHT ALLE IN DERSELBEN KW!!!"
          );
          assert(true);
        } else {
          console.log(
            "ZU KLÄREN: DIE TAGE ZUR DER LÜCKE LIEGEN ZWAR ALLE IN DERSELBEN KW, DIESE IST ABER NICHT KOLLABIERT!!!"
          );
          assert(true);
        }
      }

      k = dataColumnsStartOfDaysForRender.indexOf(blockedInterval.end + 1);
      if (k < 0) {
        return ret; // fertig, weil dann das Ende des Blocks mit dem "Ende aller Tage" zusammenfällt
      }
    }
    return [...ret, ...daysForRender.slice(k)]; // slice(k) -> Alle Element ab k (bis zum Letzen also)
  },
  getNumberOfNonHeaderGridColumnsToRender() {
    let k = 0;
    for (let i = 0; i < this.kw_is_collapsed.length; i++) {
      // wenn die aktuell betrachtete KW 'collapsed' ist (kw_flag===false) belegt
      // sie eine Basis-Spalte (mit der Länge 'LOGIC_BASE_COLUMN_WIDTH' [Anzahl Grid-Spalten]),
      // ansonsten so viele wie Tage darin enthalten sind
      k += this.kw_is_collapsed[i]
        ? 1
        : this.date_helper.table_data.weeks[i].length;
    }
    return LOGIC_BASE_COLUMN_WIDTH * k;
  },
  getDataGridColumnsForDayOfYear(dayOfYear) {
    const daysOfKWs = this.date_helper.table_data.weeks;

    let data_column_offset = 0;
    for (let kw_idx = 0; kw_idx < daysOfKWs.length; kw_idx++) {
      const days_of_week = daysOfKWs[kw_idx];
      if (days_of_week.includes(dayOfYear)) {
        if (this.kw_is_collapsed[kw_idx]) {
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
      data_column_offset += this.kw_is_collapsed[kw_idx]
        ? // bei kollabierten KWs wird nur ein Tag gerendert, dieser dann aber mit der Breite LOGIC_BASE_COLUMN_WIDTH
          // daher muss hier als offset die LOGIC_BASE_COLUMN_WIDTH gewählt werden
          LOGIC_BASE_COLUMN_WIDTH
        : LOGIC_BASE_COLUMN_WIDTH * days_of_week.length;
    }
    throw error(`provided day ${dayOfYear} out of bounds`);
  },

  getMonthHeaderColumnsToRender() {
    const months = [];
    this.date_helper.monthNames.forEach((month_name, month_idx) => {
      const days = this.date_helper.table_data.months[month_idx];
      const startColumn =
        this.column_offset + this.getDataGridColumnsForDayOfYear(days[0])[0];
      const lastDayOfMonthAsDayStructure =
        this.date_helper.table_data.days[days.at(-1) - 1];
      let endColumn =
        this.column_offset +
        this.getDataGridColumnsForDayOfYear(
          lastDayOfMonthAsDayStructure.day_of_year
        )[1];
      const is_in_last_week_of_year =
        lastDayOfMonthAsDayStructure.week_idx ===
        this.date_helper.table_data.weeks.length - 1;
      if (
        is_in_last_week_of_year &&
        this.kw_is_collapsed[lastDayOfMonthAsDayStructure.week_idx]
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
    this.date_helper.table_data.weeks.forEach((days, kw_idx) => {
      const week_number = this.date_helper.week_0 ? kw_idx : kw_idx + 1;
      const week_name =
        week_number >= 1 && week_number <= 52
          ? `KW ${week_number.toString().padStart(2, "0")}`
          : "";
      const startColumn =
        this.column_offset + this.getDataGridColumnsForDayOfYear(days[0])[0];
      let endColumn =
        this.column_offset +
        this.getDataGridColumnsForDayOfYear(days.at(-1))[1];
      if (this.kw_is_collapsed[kw_idx]) {
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

    // Im Fall von "collapsed" KWs ist nur ein Tag zu rendern. Über dieses Array
    // merken wir uns, ob zu einer KW schon ein Tag mit render:true gepushed wurde
    const at_least_one_day_of_week_set_visible = Array(
      this.date_helper.table_data.weeks.length
    ).fill(false);

    this.date_helper.table_data.days.forEach((day_structure) => {
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
        this.kw_is_collapsed[kw_idx] &&
        !at_least_one_day_of_week_set_visible[kw_idx]
      ) {
        // Die Woche zu diesem Tag ist collapsed, der aktuelle Tag soll aber angezeigt werden
        // In diesem Fall ist aber kein Text zu dem Tag auszugeben
        display_day_text = false;
      } else if (this.kw_is_collapsed[kw_idx]) {
        // Die Woche zu diesem Tag ist collapsed und der aktuelle Tag NICHT angezeigt werden
        return;
      }

      const week_number = this.date_helper.week_0
        ? day_structure.week_idx
        : day_structure.week_idx + 1;

      days.push({
        day_of_year,
        day_of_month: day_structure.day_of_month,
        week_number,
        month_number: day_structure.month_idx + 1,
        day_of_week: this.date_helper.weekDayNames[day_structure.day_of_week],
        data_columns,
        style_: `grid-column: ${startColumn} / ${endColumn + 1};`,
        display_text: display_day_text,
      });

      at_least_one_day_of_week_set_visible[kw_idx] = true;
    });
    return days;
  },
});
