<template>
  <header>
    <h1>Azubi-Blockplanung für {{ year }}</h1>
  </header>
  <main>
    <div class="planner-container">
      <p class="loading-screen" v-if="!plannerReady" tabindex="-1">
        <em>Loading...</em>
      </p>
      <plannerComponent
        ref="plannerComponent"
        :year="year"
        selection-color-valid="#0000FF0F"
        selection-color-invalid="#FF000030"
        @block-added="onBlockAdded"
        @block-deleted="onBlockDeleted"
        @block-updated="onBlockUpdated"
        @keydown.stop.prevent="onKeyPress"
        @initialized="onInitialized"
        @planner-ready="plannerReady = $event"
        tabindex="-1"
        :class="[plannerReady ? '' : 'invisible']"
      ></plannerComponent>
      <a
        class="btn btn--apply"
        @click="onApply"
        v-if="plannerReady"
        :class="[applyTasksCount > 0 ? '' : 'invisible']"
        >Übernehmen</a
      >
    </div>
  </main>
</template>
<script>
import { ref, watch } from "vue";
import PlannerComponent from "./../../components/planner/plannerComponent.vue";
import createDifferentialStateManager from "./DifferentialState.js";
import ApiClient from "./apiclient/ApiClient.js";
import MockedApiClient from "./apiclient/MockedApiClient.js";
import { useRoute, useRouter } from "vue-router";

export default {
  components: {
    PlannerComponent,
  },
  setup() {
    const year = ref(undefined);
    const plannerReady = ref(false);
    const differentialStateManager = ref([]);
    const apiClient = ref(undefined);
    const plannerComponent = ref(undefined);
    const undoCount = ref(0);
    const redoCount = ref(0);
    const applyTasksCount = ref(0);

    const route = useRoute();
    const router = useRouter();

    const tmpYearValue = Number.parseInt(route.params["year"]);
    if (!Number.isFinite(tmpYearValue)) {
      let altRoute = route.fullPath;
      altRoute += altRoute.endsWith("/") ? "" : "/";
      altRoute += `${new Date().getFullYear()}`;
      router.push(altRoute);
    } else {
      year.value = tmpYearValue;
    }

    //apiClient.value = new MockedApiClient(props.year);
    apiClient.value = new ApiClient("http://localhost:8080/api", year.value);

    const unwatchPlannerComponent = watch(plannerComponent, (cur, old) => {
      if (!cur || cur === old) return;
      differentialStateManager.value = createDifferentialStateManager(
        plannerComponent.value.addBlockData,
        plannerComponent.value.deleteBlock,
        plannerComponent.value.resetBlockData,
        (e) => {
          ({ undo_count: undoCount.value, redo_count: redoCount.value } = e);
          applyTasksCount.value =
            e.tasks.additions.length +
            e.tasks.deletions.length +
            e.tasks.updates.length;
        }
      );
      apiClient.value.getUiDataDisplaynames().then((data) => {
        plannerComponent.value.initDataHeaderRows(data);
      });
      apiClient.value.getUiDataBlocktypes().then((data) => {
        plannerComponent.value.initBlockTypes(data);
      });
      unwatchPlannerComponent();
    });

    function onBlockAdded(event) {
      differentialStateManager.value.pushBlockAddedDiffState(event.block_data);
      differentialStateManager.value.print();
    }

    function onBlockDeleted(event) {
      differentialStateManager.value.pushBlockDeletedDiffState(
        event.block_data
      );
      differentialStateManager.value.print();
    }

    function onBlockUpdated(event) {
      differentialStateManager.value.pushBlockUpdatedDiffState(
        event.block_data_after,
        event.block_data_before
      );
      differentialStateManager.value.print();
    }

    function onKeyPress(event) {
      if (event.ctrlKey && event.key === "z") {
        if (differentialStateManager.value.rewind()) {
          differentialStateManager.value.print();
        }
      } else if (event.ctrlKey && event.key === "y") {
        if (differentialStateManager.value.forward()) {
          differentialStateManager.value.print();
        }
      } else if (event.key === "Delete") {
        plannerComponent.value.onDeleteKeyPressed();
      }
    }

    function onInitialized() {
      apiClient.value.getAll().then((data) => {
        plannerComponent.value.resetBlockData(data);
      });
    }

    const onApply = function () {
      differentialStateManager.value.apply(apiClient.value);
    };

    return {
      year,
      plannerReady,
      plannerComponent,
      onBlockAdded,
      onBlockDeleted,
      onBlockUpdated,
      onKeyPress,
      onInitialized,
      onApply,
      undoCount,
      redoCount,
      applyTasksCount,
    };
  },
};
</script>

<style scoped>
h1 {
  display: inline-block;
  font-size: 5rem;
  margin-top: 2rem;
  margin-left: 4rem;
  margin-bottom: 4rem;
}

.planner-container {
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  align-items: flex-start;
}

.loading-screen {
  display: block;
  font-size: 2.8rem;
}
.btn {
  display: inline-block;
  cursor: pointer;
  font-size: 2.4rem;
  padding: 0.6rem 1.2rem;
  background-color: #efefef;
  color: black;
  border: 0.3rem solid #cfcfcf;
  user-select: none;
  /*align-self: center;*/
}

.btn:hover {
  background-color: #bfe1f8;
  border-color: #98d6ff;
}
.btn:active {
  background-color: #7acaff;
}

.btn--apply {
  left: 0px;
  position: sticky;
}
</style>
