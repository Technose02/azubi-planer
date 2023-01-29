<template>
  <!-- dirty hack for forced rerender -->
  <template v-if="this.plannerStore.render_planner_flag">
    <div
      @click="onClick"
      class="planner-container-grid"
      :style="`grid-template-columns: 2fr repeat(${plannerStore.getNumberOfNonHeaderColumnsToRender()}, 1fr);`"
    >
      <div
        class="planner-cell planner-header-row planner-header-row-month"
        v-for="m in plannerStore.getMonthHeaderColumnsToRender()"
        :class="`planner-header-row-month--${m.month_number}`"
        :style="m.style_"
      >
        {{ m.name }}
      </div>
      <div
        :class="`planner-cell planner-header-row planner-header-row-week planner-header-row-week--${w.kw_idx}`"
        v-for="w in plannerStore.getWeekHeaderColumnsToRender()"
        :style="w.style_"
      >
        {{ w.name }}
      </div>
      <div
        class="planner-cell planner-header-row planner-header-row-day"
        v-for="d in plannerStore.getDayHeaderColumnsToRender()"
        :style="d.style_"
      >
        <template v-if="d.render">
          <div style="display: flex; flex-direction: column">
            <template v-if="d.display_text">
              <span class="planner-header-day-week">{{ d.day_of_week }}</span>
              <span class="planner-header-day-month">{{ d.day_of_month }}</span>
            </template>
          </div>
        </template>
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
          :class="`planner-cell data-cell data-cell--${r} day-of-year--${d.day_of_year} week--${d.week_number} month--${d.month_number}`"
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
  methods: {
    onClick(e) {
      e.preventDefault();

      // Wählen des zuständigen Handlers
      const target_classList = e.target.classList;
      if (target_classList.contains("planner-header-row-week")) {
        this.onClickKWHeaderField(e);
      }
      e.stopPropagation();
    },
    onClickKWHeaderField(e) {
      // determine KW-Index of clicked KW-HeaderField through class 'planner-header-row-week--??'
      const kw_idx = Number(
        Array.from(e.target.classList)
          .find((c) => c.startsWith("planner-header-row-week--"))
          .split("--")[1]
      );

      // toggle collapsed-state of KW-HeaderField
      if (plannerStore.kw_flags[kw_idx]) {
        plannerStore.kw_flags[kw_idx] = false;
        e.target.classList.add("collapsed");
      } else {
        plannerStore.kw_flags[kw_idx] = true;
        e.target.classList.remove("collapsed");
      }
    },
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

    plannerStore.date_helper.table_data.weeks.forEach((w) => {
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
  cursor: default;
  user-select: none;
}

.planner-header-row-month--1 {
  /* Januar */
  background-color: #4424d6;
}

.planner-header-row-month--2 {
  background-color: #0247fe;
}

.planner-header-row-month--3 {
  background-color: #347c98;
}

.planner-header-row-month--4 {
  background-color: #66b032;
}

.planner-header-row-month--5 {
  background-color: #b2d732;
}

.planner-header-row-month--6 {
  background-color: #fefe33;
}

.planner-header-row-month--7 {
  background-color: #fccc1a;
}

.planner-header-row-month--8 {
  background-color: #fb9902;
}

.planner-header-row-month--9 {
  background-color: #fc600a;
}

.planner-header-row-month--10 {
  background-color: #fe2712;
}

.planner-header-row-month--11 {
  background-color: #c21460;
}

.planner-header-row-month--12 {
  /* Dezember */
  background-color: #8601af;
}

.planner-header-row-week {
  cursor: pointer;
}

.planner-cell {
  border-right: 0.1rem solid black;
  border-bottom: 0.1rem solid black;
  padding: 0.15rem 0.3rem;
}

.data-cell {
  background-color: #f3e0be;
  min-width: 2.93rem;
}

.planner-header-corner {
  background-color: #ff6f61;
  border-left: 0.1rem solid black;
  border-top: 0.1rem solid black;
}

.planner-header-column {
  background-color: #f7cac9;
  grid-column: 1;
  border-left: 0.1rem solid black;
  font-size: 1.8rem;
  min-width: 18rem;
  text-align: left;
}

.planner-header-row-month {
  grid-row: 1;
  border-top: 0.1rem solid black;
  font-size: 2rem;
}

.planner-header-row-week {
  grid-row: 2;
  background-color: #92a8d1;
  font-size: 1.8rem;
  /*min-width: 5.5rem;*/
}

.planner-header-row-week.collapsed {
  grid-row: 2;
  background-color: #8298c0;
  font-size: 1.8rem;
  /*min-width: 5.5rem;*/
}

.planner-header-row-day {
  grid-row: 3;
  background-color: #f7cac9;
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
