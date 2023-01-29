<template>
  <!-- dirty hack for forced rerender -->
  <template v-if="this.plannerStore.render_planner_flag">
    <div
      class="planner-container-grid"
      :style="`grid-template-columns: 2fr repeat(${plannerStore.getNumberOfNonHeaderColumnsToRender()}, 1fr);`"
    >
      <div
        class="planner-cell planner-header-row planner-header-row-month"
        v-for="m in plannerStore.date_helper.monthsForRender"
        :style="m.style_"
      >
        {{ m.name }}
      </div>
      <div
        class="planner-cell planner-header-row planner-header-row-week"
        v-for="w in plannerStore.date_helper.weeksForRender"
        :style="w.style_"
      >
        {{ w.name }}
      </div>
      <div
        class="planner-cell planner-header-row planner-header-row-day"
        v-for="d in plannerStore.date_helper.daysForRender"
        :style="d.style_"
      >
        <div style="display: flex; flex-direction: column">
          <span class="planner-header-day-week">{{ d.day_of_week }}</span>
          <span class="planner-header-day-month">{{ d.day_of_month }}</span>
        </div>
      </div>
      <div
        class="planner-cell planner-header-corner"
        style="grid-column: 1; grid-row: 1 / 4"
      ></div>
      <div
        class="planner-cell planner-header-column"
        v-for="(r, idx) in this.rowTitles"
        :style="`grid-column: 1; grid-row: ${idx + 4};`"
      >
        {{ r }}
      </div>

      <!-- Rendern der "Entries" -->
      <slot></slot>

      <!-- Rendern der freien "Data-Cells" -->
      <template v-for="(r, idx) in this.rowTitles">
        <div
          _v-for_="//d in plannerStore.date_helper.daysForRender"
          v-for="d in plannerStore.freeDaysToRender(idx)"
          :class="`planner-cell data-cell data-cell--${r} day-of-year--${d.day_of_year} week--${d.in_week} month--${d.in_month}`"
          :style="`grid-row: ${idx + this.plannerStore.row_offset};`"
        ></div>
      </template>
    </div>
  </template>
</template>
<script>
import DateHelper from "../DateHelper";
import { plannerStore } from "./PlannerStore";

export default {
  data() {
    return {
      plannerStore,
      rowTitles: [],
    };
  },
  name: "planner",
  props: {
    rows: Array,
    year: Number,
  },
  created() {
    // write to plannerStore
    plannerStore.column_offset = 1;
    plannerStore.row_offset = 4;
    plannerStore.year = this.year;
    plannerStore.row_keys = this.rows.map((r) => r.key);
    this.rowTitles = this.rows.map((r) => r.title);

    plannerStore.date_helper = DateHelper.init(
      plannerStore.year,
      plannerStore.column_offset
    );

    plannerStore.date_helper.weeksForRender.forEach((w) => {
      plannerStore.kw_flags.push(true); /* initial alle KWs anzeigen */
    });
  },
};
</script>
<style>
.planner-container-grid {
  display: grid;
  text-align: center;
  font-size: 1.6rem;
}

.planner-cell {
  border-right: 0.1rem solid black;
  border-bottom: 0.1rem solid black;
  padding: 0.15rem 0.3rem;
}

.data-cell {
  min-width: 2.93rem;
}

.planner-header-corner {
  border-left: 0.1rem solid black;
  border-top: 0.1rem solid black;
}

.planner-header-column {
  grid-column: 1;
  border-left: 0.1rem solid black;
  font-size: 1.8rem;
  min-width: 18rem;
  text-align: right;
}

.planner-header-row-month {
  grid-row: 1;
  border-top: 0.1rem solid black;
  background-color: green;
  font-size: 2rem;
}
.planner-header-row-week {
  grid-row: 2;
  background-color: blue;
  font-size: 1.8rem;
  /*min-width: 5.5rem;*/
}
.planner-header-row-day {
  grid-row: 3;
  background-color: yellow;
}
.planner-header-day-week {
  font-size: 1.2rem;
  font-weight: bold;
  align-self: flex-start;
}
.planner-header-day-month {
  font-size: 1.4rem;
  align-self: flex-end;
}
.planner-block {
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 0.1rem solid black;
  border-right: 0.1rem solid black;
}
</style>
