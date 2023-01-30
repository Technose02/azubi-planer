<template>
  <div :style="computeStyle()" class="planner-cell data-cell planner-block">
    <slot></slot>
  </div>
</template>
<script>
import { plannerStore } from "./PlannerStore";
export default {
  data() {
    return {
      plannerStore,
      daysBlockedStart: 0,
      daysBlockedEnd: 0,
      rowsBlocked: [],
    };
  },
  props: {
    rowKeys: Array,
    startDate: Date,
    endDate: Date,
    color: String,
  },
  methods: {
    computeStyle() {
      const colStart =
        plannerStore.getDataGridColumnsForDayOfYear(this.daysBlockedStart)[0] +
        plannerStore.column_offset;
      let colEnd =
        plannerStore.getDataGridColumnsForDayOfYear(this.daysBlockedEnd)[1] +
        plannerStore.column_offset;

      // Schönheitskorrektur die nur bei angefangener KW01 des Folgejahres am Ende des Planers
      // durchzuführen ist
      // Liegt das Ende eines Blockes in dieser "Teil-Woche" (sie wird nur zu den Anteilen gerendert, die noch in diesem Jahr liegen),
      // so wird beim Kollabieren dieser "Teil-Woche" nicht das richtige Verhältnis des Blockendes in der kollabierten KW eingehalten
      // der Korrekturterm (s.u.) kompensiert dies
      const blockEndDayAsStructure =
        plannerStore.date_helper.table_data.days[this.daysBlockedEnd - 1];
      if (plannerStore.kw_is_collapsed[blockEndDayAsStructure.week_idx]) {
        const lengthOfWeekOfBlockEnd =
          plannerStore.date_helper.table_data.weeks[
            blockEndDayAsStructure.week_idx
          ].length;

        // Korrekturterm
        // Der Part hinter dem "+" ist genau dann der zuvor abgezogene Anteil "blockEndDayAsStructure.day_of_week",
        // wenn die Länge der Woche 7, also der KW-Standard ist.
        // In dem Randfall allerdings kompensiert er Maßstabsgerecht entsprechend dem Verhältnis "Anteil an der Woche : Länge der Woche"
        // ACHTUNG: OHNE RUNDEN PASSIEREN HIER - zum Beispiel bei der Mitte (3.5) - SELTSAME DINGE
        colEnd =
          colEnd -
          blockEndDayAsStructure.day_of_week +
          Math.round(
            (blockEndDayAsStructure.day_of_week * 7) / lengthOfWeekOfBlockEnd
          );
      }

      const rowIdxArray = this.rowsBlocked
        .map((idx) => plannerStore.row_offset + idx)
        .sort((a, b) => a - b);

      return `grid-row: ${rowIdxArray[0]} / ${
        rowIdxArray.at(-1) + 1
      }; grid-column: ${colStart} / ${colEnd + 1}; background-color: ${
        this.color
      };`;
    },
  },
  created() {
    this.daysBlockedStart = plannerStore.date_helper.dayOfYearFromDate(
      this.startDate
    );
    this.daysBlockedEnd = plannerStore.date_helper.dayOfYearFromDate(
      this.endDate
    );
    this.rowsBlocked = this.rowKeys
      .map((k) => plannerStore.row_keys.indexOf(k))
      .filter((i) => i >= 0);
    this.rowsBlocked.forEach((r) => {
      this.plannerStore.addBlockedDataRange(
        r,
        this.daysBlockedStart,
        this.daysBlockedEnd
      );
    });
  },
};
</script>
<style></style>
