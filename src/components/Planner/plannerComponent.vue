<template>
  <div
    @click="onPlannerContainerClick"
    @contextmenu="onPlannerContainerContextMenu"
    @mousemove="onPlannerContainerMouseMove"
    ref="plannerContainer"
    class="planner-container-grid"
  >
    <div
      class="planner-cell planner-header planner-header-row planner-header-row-month"
      v-for="m in getMonthHeaderRowObjects()"
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
        'planner-header',
        'planner-header-row',
        'planner-header-row-week',
        Number.isFinite(w.week_number)
          ? `planner-header-row-week--${w.week_number}`
          : '',
        w.collapsed ? 'collapsed' : '',
      ]"
      v-for="w in getWeekHeaderRowObjects()"
      :style="w.style_"
    >
      {{ w.name }}
    </div>
    <div
      v-for="d in getDayHeaderRowObjects()"
      :class="[
        'planner-cell',
        'planner-header',
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
      <div class="planner-header-row-day-container">
        <template v-if="d.display_text">
          <span class="planner-header-day-week">{{ d.day_of_week_str }}</span>
          <span class="planner-header-day-month">{{ d.day_of_month }}</span>
        </template>
      </div>
    </div>
    <div
      class="planner-cell planner-header planner-header-corner"
      style="grid-column: 1; grid-row: 1 / 4"
      ref="headerCorner"
    ></div>
    <div
      :class="[
        'planner-cell',
        'planner-header',
        'planner-header-column',
        row.key ? `planner-header-column--${row.key}` : '',
      ]"
      v-for="row in getDataHeaderColumnObjects()"
      :style="`${row.style_}`"
    >
      {{ row.title }}
    </div>

    <!-- Rendern der Blöcke -->
    <div
      v-for="b in getBlockDataRenderObjects()"
      :class="[
        'planner-cell',
        'data-cell',
        'planner-block',
        b.block_id ? `planner-block--${b.block_id}` : '',
        b.row_key_list ? `planner-rows--${b.row_key_list}` : '',
        b.unspecified ? 'unspecified' : '',
      ]"
      :style="b.style_"
    >
      {{ b.block_name }}
    </div>

    <!-- Rendern der freien "Data-Cells" -->
    <template v-for="(row, rowIdx) in this.getDataHeaderColumnObjects()">
      <template
        v-for="d in getNonBlockedDayFillingObjectsForRowByIndex(rowIdx)"
      >
        <div
          v-if="d.is_fill_day"
          :class="[
            'planner-cell',
            'data-cell',
            'free-day',
            Number.isFinite(d.day_of_year)
              ? `day-of-year--${d.day_of_year}`
              : '',
            Number.isFinite(d.week_number) ? `week--${d.week_number}` : '',
            Number.isFinite(d.month_number) ? `month--${d.month_number}` : '',
            row.key ? `planner-row--${row.key}` : '',
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
    <div
      ref="createBlockVisualizer"
      class="create-block-visualizer invisible"
    ></div>
    <div class="planner-header-column text-tester" ref="textTester"></div>
    <div class="menu menu--block-type invisible" ref="blockTypeMenu">
      <template v-for="t in getBlockTypeEntriesForBlocktypeSelectionMenu()">
        <div
          class="menu-item-block-type"
          :class="`block-type--${t.type}`"
          :style="`background-color: ${t.color};`"
        >
          {{ t.label }}
        </div></template
      >
    </div>
    <div class="menu block-context-menu invisible" ref="blockContextMenu">
      <icon-edit
        class="menu-item block-context-menu-item block-context-menu-item--edit-block action--edit"
      ></icon-edit>
      <icon-delete
        class="menu-item block-context-menu-item block-context-menu-item--delete-block action--delete"
      ></icon-delete>
    </div>
  </div>
</template>
<script>
import { ref, getCurrentInstance } from "vue";
import initServices from "./services/ServiceManager";
import IconDelete from "../icons/IconDelete.vue";
import IconEdit from "../icons/IconEdit.vue";
import { createBlock } from "./Block";

export default {
  name: "PlannerComponent",
  props: {
    year: Number,
    weekDayMask: Array,
    rows: Array,
    types: Array,
    selectionColorValid: String,
    selectionColorInvalid: String,
  },
  components: {
    IconDelete,
    IconEdit,
  },

  setup(props, context) {
    const serviceManager = ref([]);
    const headerRowData = ref(undefined);
    const blockTypeData = ref(undefined);

    // Element-References:
    const plannerContainer = ref(undefined);
    const headerCorner = ref(undefined);
    const createBlockVisualizer = ref(undefined);
    const blockContextMenu = ref(undefined);
    const blockTypeMenu = ref(undefined);
    const textTester = ref(undefined);
    const forceUpdate = getCurrentInstance()?.proxy?.$forceUpdate;

    function initialized() {
      return (
        headerRowData.value != undefined && blockTypeData.value != undefined
      );
    }

    function onPlannerContainerClick(event) {
      if (initialized()) {
        serviceManager.value.tableInteractionService.onPlannerContainerClick(
          event
        );
      }
    }

    function onPlannerContainerContextMenu(event) {
      if (initialized()) {
        serviceManager.value.tableInteractionService.onPlannerContainerContextMenu(
          event
        );
      }
    }

    function onPlannerContainerMouseMove(event) {
      if (initialized())
        serviceManager.value.tableInteractionService.onPlannerContainerMouseMove(
          event
        );
    }

    function getMonthHeaderRowObjects() {
      return initialized()
        ? serviceManager.value.tableStructureService.getMonthHeaderRowObjects()
        : [];
    }

    function getWeekHeaderRowObjects() {
      return initialized()
        ? serviceManager.value.tableStructureService.getWeekHeaderRowObjects()
        : [];
    }

    function getDayHeaderRowObjects() {
      return initialized()
        ? serviceManager.value.tableStructureService.getDayHeaderRowObjects()
        : [];
    }

    function getDataHeaderColumnObjects() {
      return initialized()
        ? serviceManager.value.tableStructureService.getDataHeaderColumnObjects()
        : [];
    }

    function getBlockDataRenderObjects() {
      return initialized()
        ? serviceManager.value.tableStructureService.getBlockDataRenderObjects()
        : [];
    }

    function getNonBlockedDayFillingObjectsForRowByIndex(rowIdx) {
      return initialized()
        ? serviceManager.value.tableStructureService.getNonBlockedDayFillingObjectsForRowByIndex(
            rowIdx
          )
        : [];
    }

    function getBlockTypeEntriesForBlocktypeSelectionMenu() {
      return initialized()
        ? serviceManager.value.tableStructureService.getBlockTypeEntriesForBlocktypeSelectionMenu()
        : [];
    }

    function _onInitStep() {
      if (initialized()) {
        // Hier und nur hier wird der ServiceManager initialisiert
        serviceManager.value = initServices(props.year, props.weekDayMask);
        serviceManager.value.tableInteractionService.setForceUpdate(
          forceUpdate
        );
        serviceManager.value.tableInteractionService.setOnBlockAddedHandler(
          onBlockAdded
        );
        serviceManager.value.tableInteractionService.setOnBlockDeletedHandler(
          onBlockDeleted
        );
        serviceManager.value.tableInteractionService.setOnBlockUpdatedHandler(
          onBlockUpdated
        );

        serviceManager.value.tableInteractionService.setWidgets(
          plannerContainer.value,
          headerCorner.value,
          createBlockVisualizer.value,
          blockContextMenu.value,
          blockTypeMenu.value
        );

        serviceManager.value.tableInteractionService.setSelectionColors(
          props.selectionColorValid,
          props.selectionColorInvalid
        ); //"#0B03", "#B004"

        serviceManager.value.tableStructureService.setTextTesterWidget(
          textTester.value
        );
        serviceManager.value.tableStructureService.setBlockTypeMenuWidget(
          blockTypeMenu.value
        );
        serviceManager.value.tableDataService.setUnspecifiedTypeDataColor(
          props.selectionColorValid
        );

        serviceManager.value.tableDataService.resetDataHeaderRows(
          headerRowData.value
        );
        serviceManager.value.tableDataService.resetBlockTypes(
          blockTypeData.value
        );
        context.emit("initialized");
      }
    }

    function addBlockData(blockData) {
      serviceManager.value.tableDataService.importBlockData(blockData);
    }

    function deleteBlock(blockId) {
      serviceManager.value.tableDataService.deleteBlock(blockId);
    }

    function initDataHeaderRows(data) {
      headerRowData.value = data;
      _onInitStep();
    }

    function initBlockTypes(data) {
      blockTypeData.value = data;
      _onInitStep();
    }

    function resetBlockData(serverBlockData) {
      context.emit("planner-ready", false);

      if (!initialized()) return;

      new Promise((rej, _) => {
        serviceManager.value.tableDataService.resetBlockData();

        const dateStringToDate = (str) => {
          const dateTime = new Date(str);
          return new Date(
            dateTime.getFullYear(),
            dateTime.getMonth(),
            dateTime.getDate()
          );
        };

        serverBlockData
          .map((d) => {
            const block = createBlock(
              d.type,
              dateStringToDate(d.startDate),
              dateStringToDate(d.endDate),
              d.rowKeys
            );
            block.blockId = d.blockId;
            return block;
          })
          .forEach((d) =>
            serviceManager.value.tableDataService.importBlockData(d)
          );
        rej();
      }).then(() => {
        context.emit("planner-ready", true);
      });
    }

    function onDeleteKeyPressed() {
      serviceManager.value.tableInteractionService.onDeleteKeyPressed();
    }

    function onBlockAdded(event) {
      context.emit("block-added", event);
    }

    function onBlockDeleted(event) {
      context.emit("block-deleted", event);
    }

    function onBlockUpdated(event) {
      context.emit("block-updated", event);
    }

    return {
      plannerContainer,
      headerCorner,
      createBlockVisualizer,
      blockContextMenu,
      blockTypeMenu,
      textTester,
      onPlannerContainerClick,
      onPlannerContainerContextMenu,
      onPlannerContainerMouseMove,
      getMonthHeaderRowObjects,
      getWeekHeaderRowObjects,
      getDayHeaderRowObjects,
      getDataHeaderColumnObjects,
      getBlockDataRenderObjects,
      getNonBlockedDayFillingObjectsForRowByIndex,
      getBlockTypeEntriesForBlocktypeSelectionMenu,
      initDataHeaderRows,
      initBlockTypes,
      resetBlockData,
      onDeleteKeyPressed,
      addBlockData,
      deleteBlock,
    };
  },
  emits: [
    "block-added",
    "block-deleted",
    "block-updated",
    "initialized",
    "planner-ready",
  ],
};
</script>
<style>
* {
  opacity: 1;
  pointer-events: auto;
  visibility: visible;
}

.planner-container-grid {
  display: grid;
  text-align: center;
  font-size: 1.6rem;
  cursor: default;
  user-select: none;
  position: relative;
  outline: none;
}

.planner-header {
  display: flex;
  align-items: center;
}
.planner-header-row {
  justify-content: center;
}

.planner-header-column {
  justify-content: flex-end;
}

.planner-header-row-month--1 {
  /* Januar */
  background-color: #4424d688;
}

.planner-header-row-month--2 {
  background-color: #0247fe88;
}

.planner-header-row-month--3 {
  background-color: #347c9888;
}

.planner-header-row-month--4 {
  background-color: #66b03288;
}

.planner-header-row-month--5 {
  background-color: #b2d73288;
}

.planner-header-row-month--6 {
  background-color: #fefe3388;
}

.planner-header-row-month--7 {
  background-color: #fccc1a88;
}

.planner-header-row-month--8 {
  background-color: #fb990288;
}

.planner-header-row-month--9 {
  background-color: #fc600a88;
}

.planner-header-row-month--10 {
  background-color: #fe271288;
}

.planner-header-row-month--11 {
  background-color: #c2146088;
}

.planner-header-row-month--12 {
  /* Dezember */
  background-color: #8601af88;
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
  background-color: #fff;
}

.planner-header-corner {
  background-color: #efefef;
  border-left: 0.1rem solid black;
  border-top: 0.1rem solid black;
}

.planner-header-column {
  background-color: #efefef;
  grid-column: 1;
  border-left: 0.1rem solid black;
  font-size: 1.8rem;
  text-align: left;
}
.planner-header-column.text-tester {
  position: absolute;
  visibility: hidden;
  height: auto;
  width: auto;
  white-space: nowrap;
}

.planner-header-row-month {
  grid-row: 1;
  border-top: 0.1rem solid black;
  font-size: 2rem;
}

.planner-header-row-week {
  grid-row: 2;
  background-color: #dfdfdf;
  font-size: 1.8rem;
}

.planner-header-row-week.collapsed {
  grid-row: 2;
  background-color: #cfcfcf;
  font-size: 1.8rem;
}

.planner-header-row-day {
  grid-row: 3;
  background-color: #efefef;
  font-size: 1vw;
  display: block;
}

.planner-header-row-day-container {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: 100%;
  width: 100%;
}

.planner-header-row-day.not-this-year {
  color: #888;
  font-weight: lighter;
}

.planner-header-day-week {
  font-size: 1.8rem;
  /*font-weight: bold;*/
  align-self: flex-start;
}
.planner-header-day-month {
  font-size: 1.8rem;
  align-self: flex-end;
}
.planner-block {
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 0.1rem solid black;
  border-right: 0.1rem solid black;
}

.planner-block.selected {
  box-shadow: inset 0 0 0.2rem 0.15rem #000000be;

  opacity: 0.8;
  background-size: 10rem 10rem;
  background-image: repeating-linear-gradient(
    45deg,
    rgba(49, 4, 4, 0) -0.01rem,
    #000000be 0.1rem,
    rgba(49, 4, 4, 0) 0.2rem,
    rgba(49, 4, 4, 0) 1rem
  );
}

.planner-block.unspecified {
  font-style: italic;
}

.create-block-visualizer {
  display: flex;
  align-items: center;
  justify-content: center;
  /* border-bottom: 0.1rem solid black;
  border-right: 0.1rem solid black; */
  border: none;
  background-color: rgba(250, 194, 245, 0.534);

  position: absolute;
  top: 0;
  left: 0;
  width: 10rem;
  height: 5rem;
}

.menu {
  position: absolute;
  top: 0;
  left: 0;
  background-color: #fffa;
  border-radius: 0.8rem;
  padding: 0.6rem 0.8rem;
  box-shadow: 0 0 0.4rem #000;
}

.block-context-menu {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 0.4rem;
}

.block-context-menu-item {
  width: 2rem;
  height: 2rem;
  stroke: #888;
  transition: transform 300ms;
}

.block-context-menu-item:hover {
  width: 2rem;
  height: 2rem;
  color: #444;
  transform: scale(1.2);
}

.menu--block-type {
  display: grid;
  grid-template-columns: 20rem;
  row-gap: 0.3rem;
  justify-content: stretch;
  align-content: stretch;
  justify-items: stretch;
  align-items: flex-start;
  gap: 0.3rem;
  width: auto;
  font-size: 1.6rem;
  max-height: 30rem;
  overflow-y: scroll;
  z-index: 99;
}

.menu--block-type.invisible {
  left: 0;
  top: 0;
  z-index: -9999;
}

.menu-item-block-type {
  padding: 0.4rem 0.8rem;
  border: 0.1rem solid #555;
  border-radius: 5%;
}
</style>
