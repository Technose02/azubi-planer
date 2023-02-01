<template>
  <div :style="computeStyle()" class="planner-cell data-cell planner-block">
    <slot></slot>
  </div>
</template>
<script>
import { plannerStore } from "./PlannerStore";
import { store } from "./store";

export default {
  data() {
    return {
      store: plannerStore,
      daysBlockedStart: 0,
      daysBlockedEnd: 0,
      rowsBlocked: [],

      shared: store,
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
      const dataGridColumnsForDayOfYear =
        this.store.model.getCacheForCollapsedState()
          .dataGridColumnsForDayOfYear;
      const colStart =
        dataGridColumnsForDayOfYear[this.daysBlockedStart][0] +
        this.store.column_offset;
      let colEnd =
        dataGridColumnsForDayOfYear[this.daysBlockedEnd][1] +
        this.store.column_offset;

      // Schönheitskorrektur die nur bei angefangener KW01 des Folgejahres am Ende des Planers
      // durchzuführen ist
      // Liegt das Ende eines Blockes in dieser "Teil-Woche" (sie wird nur zu den Anteilen gerendert, die noch in diesem Jahr liegen),
      // so wird beim Kollabieren dieser "Teil-Woche" nicht das richtige Verhältnis des Blockendes in der kollabierten KW eingehalten
      // der Korrekturterm (s.u.) kompensiert dies
      const cacheForYear = this.store.model.getCacheForYear();
      const blockEndDayAsStructure = cacheForYear.days[this.daysBlockedEnd - 1];
      if (this.store.model.getCollapsedState(blockEndDayAsStructure.week_idx)) {
        const lengthOfWeekOfBlockEnd =
          cacheForYear.weeks[blockEndDayAsStructure.week_idx].length;

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
        .map((idx) => this.store.row_offset + idx)
        .sort((a, b) => a - b);

      return `grid-row: ${rowIdxArray[0]} / ${
        rowIdxArray.at(-1) + 1
      }; grid-column: ${colStart} / ${colEnd + 1}; background-color: ${
        this.color
      };`;
    },
  },
  created() {
    this.daysBlockedStart = this.store.model.dayOfYearFromDate(this.startDate);
    this.daysBlockedEnd = this.store.model.dayOfYearFromDate(this.endDate);
    this.rowsBlocked = this.rowKeys
      .map((k) => this.store.model.getDataRowKeys().indexOf(k))
      .filter((i) => i >= 0);
    this.rowsBlocked.forEach((r) => {
      this.store.model.addBlockedDataRange(
        r,
        this.daysBlockedStart,
        this.daysBlockedEnd
      );
    });
  },
};
</script>
<style></style>
