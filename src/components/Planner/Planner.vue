<template>
  <!-- dirty hack for forced rerender -->
  <template
    v-if="
      this.store.model.store.state._force_rerender_handle_for_planner_component
    "
  >
    <div
      @click="onClick"
      class="planner-container-grid"
      :style="`grid-template-columns: 24rem repeat(${this.serviceManager.tableStructureService.getNumberOfLogicalDataColumns()}, 0.5rem);`"
    >
      <div
        class="planner-cell planner-header-row planner-header-row-month"
        v-for="m in this.serviceManager.tableStructureService.getMonthHeaderRowObjects()"
        :class="[
          Number.isFinite(m.month_number)
            ? `planner-header-row-month--${m.month_number}`
            : '',
        ]"
        :style="m.style_"
      >
        {{ m.name }}
      </div>
      <div
        :class="[
          'planner-cell',
          'planner-header-row',
          'planner-header-row-week',
          Number.isFinite(w.week_number)
            ? `planner-header-row-week--${w.week_number}`
            : '',
        ]"
        v-for="w in this.serviceManager.tableStructureService.getWeekHeaderRowObjects()"
        :style="w.style_"
      >
        {{ w.name }}
      </div>
      <div
        v-for="d in this.serviceManager.tableStructureService.getDayHeaderRowObjects()"
        :class="[
          'planner-cell',
          'planner-header-row',
          'planner-header-row-day',
          Number.isFinite(d.day_of_year) ? `day-year--${d.day_of_year}` : '',
          Number.isFinite(d.month_number) ? `month--${d.month_number}` : '',
          Number.isFinite(d.week_number) ? `week--${d.week_number}` : '',
          Number.isFinite(d.day_of_week) ? `day-week--${d.day_of_week}` : '',
          Number.isFinite(d.day_of_month) ? `day-month--${d.day_of_month}` : '',
          Number.isFinite(d.day_of_year) ? `day-year--${d.day_of_year}` : '',
          d.not_this_year ? `not-this-year` : '',
          d.collapsed ? 'collapsed' : '',
        ]"
        :style="d.style_"
      >
        <div style="display: flex; flex-direction: column">
          <template v-if="d.display_text">
            <span class="planner-header-day-week">{{ d.day_of_week_str }}</span>
            <span class="planner-header-day-month">{{ d.day_of_month }}</span>
          </template>
        </div>
      </div>
      <div
        class="planner-cell planner-header-corner"
        style="grid-column: 1; grid-row: 1 / 4"
      ></div>
      <div
        :class="[
          'planner-cell',
          'planner-header-column',
          row.key ? `planner-header-column--${row.key}` : '',
        ]"
        v-for="row in this.serviceManager.tableStructureService.getDataHeaderColumnObjects()"
        :style="`${row.style_}`"
      >
        {{ row.title }}
      </div>

      <!-- Rendern der Blöcke -->
      <template style="display: none"><slot></slot></template>
      <!-- Über den Slot werden lediglich Blöcke 'logisch' in den Planner geladen, nicht gerendert -->
      <!-- Rendern der Block-Daten erfolgt nur direkt aus dem Model heraus in diesem div: -->
      <div
        v-for="b in this.serviceManager.tableStructureService.getBlockDataRenderObjects()"
        :class="[
          'planner-cell',
          'data-cell',
          'planner-block',
          b.block_name ? `planner-block--${b.block_name}` : '',
          b.row_key ? `planner-row--${b.row_key}` : '',
        ]"
        :style="b.style_"
      >
        {{ b.block_name }}
      </div>

      <!-- Rendern der freien "Data-Cells" -->
      <template
        v-for="(
          row, rowIdx
        ) in this.serviceManager.tableStructureService.getDataHeaderColumnObjects()"
      >
        <template
          v-for="d in this.serviceManager.tableStructureService.getNonBlockedDayFillingObjectsForRowByIndex(
            rowIdx
          )"
        >
          <div
            v-if="d.is_fill_day"
            :class="[
              'planner-cell',
              'data-cell',
              'fill-day',
              Number.isFinite(d.day_of_year)
                ? `day-of-year--${d.day_of_year}`
                : '',
              Number.isFinite(d.week_number) ? `week--${d.week_number}` : '',
              Number.isFinite(d.month_number) ? `month--${d.month_number}` : '',
              row.key ? `data--${row.key}` : '',
            ]"
            :style="`${row.row_style} ${d.style_}`"
          ></div>
          <div
            v-else
            :class="[
              'planner-cell',
              'data-cell',
              row.key ? `data-cell--${row.key}` : '',
              Number.isFinite(d.day_of_year)
                ? `day-of-year--${d.day_of_year}`
                : '',
              Number.isFinite(d.week_number) ? `week--${d.week_number}` : '',
              Number.isFinite(d.month_number) ? `month--${d.month_number}` : '',
            ]"
            :style="`${row.row_style} ${d.style_}`"
          ></div>
        </template>
      </template>
    </div>
  </template>
</template>
<script>
import { plannerStore } from "./PlannerStore";
import { store } from "./store.js";
import initPlannerModel from "./PlannerModel";
import initServices from "./services/ServiceManager";

export default {
  data() {
    return {
      serviceManager: [],
      shared: store,
      store: plannerStore,
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
      const kwIdx = Number(
        Array.from(e.target.classList)
          .find((c) => c.startsWith("planner-header-row-week--"))
          ?.split("--")[1]
      );
      if (!Number.isFinite(kwIdx)) {
        console.error("error: unable to determine the week to collapse/expand");
        return;
      }
      if (!this.store.model.getCollapsedState(kwIdx)) {
        this.store.model.setCollapsedState(kwIdx, true);
        this.serviceManager.tableStateService.setCalenderWeeksCollapsedState(
          kwIdx,
          true
        );
        e.target.classList.add("collapsed");
      } else {
        this.store.model.setCollapsedState(kwIdx, false);
        this.serviceManager.tableStateService.setCalenderWeeksCollapsedState(
          kwIdx,
          false
        );
        e.target.classList.remove("collapsed");
      }
    },
  },
  created() {
    // Hier und nur hier wird der ServiceManager initialisiert
    this.serviceManager = initServices(this.year, this.rows);
    this.shared.serviceManager = this.serviceManager;

    // Test
    //console.log(this.serviceManager.tableStructureService.getEntityArrays());
    //console.log(
    //  this.serviceManager.tableStructureService.getMonthHeaderRowObjects(),
    //  this.serviceManager.tableStructureService.getWeekHeaderRowObjects()
    //);
    //////////////////////////////////////////////////////////

    this.store.model = initPlannerModel(1, 4, this.year, this.rows, this.store);
    this.rowTitles = this.rows.map((r) => r.title);

    this.store.model.getCacheForYear().weeks.forEach((_, id) => {
      this.store.model.setCollapsedState(id, false);
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

.fill-day {
  min-width: 0;
}

.planner-block {
  min-width: 0;
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

.planner-header-row-day.not-this-year {
  color: #888;
  font-weight: lighter;
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
