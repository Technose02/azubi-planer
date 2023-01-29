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
        plannerStore.getDataColumnForDayOfYear(this.daysBlockedStart) +
        plannerStore.column_offset;
      const colEnd =
        plannerStore.getDataColumnForDayOfYear(this.daysBlockedEnd) +
        plannerStore.column_offset;
      const colIdxArray = this.rowsBlocked
        .map((idx) => plannerStore.row_offset + idx)
        .sort((a, b) => a - b);

      return `grid-row: ${colIdxArray[0]} /${
        colIdxArray.at(-1) + 1
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
