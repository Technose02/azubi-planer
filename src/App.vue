<template>
  <header>
    <h1>Azubi-Blockplanung für {{ this.year }}</h1>
  </header>

  <main>
    <div class="planner-container">
      <p class="loading-screen" v-if="!this.planner_ready" tabindex="-1">
        <em>Loading...</em>
      </p>
      <planner
        ref="plannerView"
        :year="this.year"
        selection-color-valid="#0000FF0F"
        selection-color-invalid="#FF000030"
        @block-added="onBlockAdded"
        @block-deleted="onBlockDeleted"
        @block-updated="onBlockUpdated"
        @keydown.stop.prevent="onKeyPress($event)"
        @initialized="onInitialized"
        @planner-ready="this.planner_ready = $event"
        tabindex="-1"
        :class="[this.planner_ready ? '' : 'invisible']"
      ></planner>
      <a
        class="btn btn--apply"
        @click="this.differentialStateManager.apply(this.apiClient)"
        v-if="this.planner_ready"
        >Übernehmen</a
      >
    </div>
  </main>
</template>
<script>
import Planner from "./components/Planner/Planner.vue";
import createDifferentialStateManager from "./components/Planner/DifferentialState.js";
import ApiClient from "./components/ApiClient/ApiClient.js";
import MockedApiClient from "./components/ApiClient/MockedApiClient.js";

export default {
  data() {
    return {
      year: 2023,
      currentMapping: new Map(),
      planner_ready: false,

      differentialStateManager: [],
      apiClient: undefined,
    };
  },
  components: {
    Planner,
  },
  methods: {
    onBlockAdded(event) {
      this.differentialStateManager.pushBlockAddedDiffState(event.block_data);
      this.differentialStateManager.print();
    },
    onBlockDeleted(event) {
      this.differentialStateManager.pushBlockDeletedDiffState(event.block_data);
      this.differentialStateManager.print();
    },
    onBlockUpdated(event) {
      this.differentialStateManager.pushBlockUpdatedDiffState(
        event.block_data_after,
        event.block_data_before
      );
      this.differentialStateManager.print();
    },
    onKeyPress(event) {
      if (event.ctrlKey && event.key === "z") {
        if (this.differentialStateManager.rewind()) {
          this.differentialStateManager.print();
        }
      } else if (event.ctrlKey && event.key === "y") {
        if (this.differentialStateManager.forward()) {
          this.differentialStateManager.print();
        }
      } else if (event.key === "Delete") {
        this.$refs.plannerView.onDeleteKeyPressed();
      }
    },
    onCreated() {
      this.apiClient.getUiDataDisplaynames().then((data) => {
        this.$refs.plannerView.initDataHeaderRows(data);
      });

      this.apiClient.getUiDataBlocktypes().then((data) => {
        this.$refs.plannerView.initBlockTypes(data);
      });
    },
    onInitialized() {
      this.apiClient.getAll().then((data) => {
        this.$refs.plannerView.resetBlockData(data);
      });
    },
  },
  created() {
    this.apiClient = new MockedApiClient(this.year);
    this.apiClient = new ApiClient("http://localhost:8080/api", this.year);

    this.onCreated();
  },
  mounted() {
    this.differentialStateManager = createDifferentialStateManager(
      this.$refs.plannerView
    );
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
