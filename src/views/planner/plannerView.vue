<template>
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
    <a class="btn btn--apply" @click="onApply" v-if="plannerReady"
      >Übernehmen</a
    >
  </div>
</template>
<script>
import { ref, watch } from "vue";
import PlannerComponent from "./../../components/planner/plannerComponent.vue";
import createDifferentialStateManager from "./DifferentialState.js";
import ApiClient from "./apiclient/ApiClient.js";
import MockedApiClient from "./apiclient/MockedApiClient.js";

export default {
  components: {
    PlannerComponent,
  },
  props: {
    year: Number,
  },
  setup(props) {
    const year = ref(props.year);
    const plannerReady = ref(false);
    const differentialStateManager = ref([]);
    const apiClient = ref(undefined);
    const plannerComponent = ref(undefined);

    //apiClient.value = new MockedApiClient(props.year);
    apiClient.value = new ApiClient("http://localhost:8080/api", year.value);

    watch(plannerComponent, (cur, old) => {
      if (!cur || cur === old) return;
      differentialStateManager.value = createDifferentialStateManager(
        plannerComponent.value.addBlockData,
        plannerComponent.value.deleteBlock,
        plannerComponent.value.resetBlockData
      );
      apiClient.value.getUiDataDisplaynames().then((data) => {
        plannerComponent.value.initDataHeaderRows(data);
      });
      apiClient.value.getUiDataBlocktypes().then((data) => {
        plannerComponent.value.initBlockTypes(data);
      });
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
    };
  },
};
</script>

<style scoped>
h1 {
  display: inline-block;
  margin-bottom: 2rem;
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
  align-self: center;
}

.btn:hover {
  background-color: #bfe1f8;
  border-color: #98d6ff;
}
.btn:active {
  background-color: #7acaff;
}
</style>
