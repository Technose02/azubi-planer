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
        @blocktype-updated="onBlockTypeUpdated"
        @keydown.stop.prevent="onKeyPress($event)"
        @initialized="onInitialized"
        @planner-ready="this.planner_ready = $event"
        tabindex="-1"
        :class="[this.planner_ready ? '' : 'invisible']"
      ></planner>
      <a class="btn btn--apply" @click="this.differentialStateManager.apply()"
        >Übernehmen</a
      >
    </div>
  </main>
</template>
<script>
import Planner from "./components/Planner/Planner.vue";
import createDifferentialStateManager from "./components/Planner/DifferentialState.js";

export default {
  data() {
    return {
      year: 2023,
      currentMapping: new Map(),
      planner_ready: false,
      offline: true,

      differentialStateManager: [],
    };
  },
  components: {
    Planner,
  },
  methods: {
    onBlockAdded(event) {
      this.differentialStateManager.pushBlockAddedDiffState(event);
      this.differentialStateManager.print();
    },
    onBlockDeleted(event) {
      this.differentialStateManager.pushBlockDeletedDiffState(event);
      this.differentialStateManager.print();
    },
    onBlockTypeUpdated(event) {
      this.differentialStateManager.pushBlockTypeUpdatedDiffState(event);
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
      if (this.offline) return this.onCreatedOffline();

      fetch(`http://localhost:8080/api/uidata/displaynames/${this.year}`, {
        method: "get",
      })
        .then((response) => response.json())
        .then((data) => {
          this.$refs.plannerView.initDataHeaderRows(data);
        });

      fetch("http://localhost:8080/api/uidata/blocktypes", {
        method: "get",
      })
        .then((response) => response.json())
        .then((data) => {
          this.$refs.plannerView.initBlockTypes(data);
        });
    },
    onInitialized() {
      if (this.offline) return this.onInitializedOffline();

      fetch(`http://localhost:8080/api/blockdata/all/${this.year}`, {
        method: "get",
      })
        .then((response) => response.json())
        .then((data) => {
          this.$refs.plannerView.resetBlockData(data);
        });
    },

    onCreatedOffline() {
      new Promise((rej, _) => {
        setTimeout(rej, 1000);
      }).then(() =>
        this.$refs.plannerView.initDataHeaderRows([
          { title: "Farina Fachinformatikerin", key: "ffarina" },
          { title: "Ingo Ingenial", key: "iingo" },
          { title: "Sebastian Software", key: "ssebastian" },
          { title: "Vigo Virtuell", key: "vvigo" },
          { title: "Danzo Daten", key: "ddanzo" },
          { title: "Ilse Inzidenz", key: "iilse" },
          { title: "Dennis Decrypter", key: "ddennis" },
        ])
      );

      new Promise((rej, _) => {
        setTimeout(rej, 1000);
      }).then(() =>
        this.$refs.plannerView.initBlockTypes([
          {
            type: "urlaub",
            locked: false,
            data: {
              color: "#FFFF00",
              labels: ["Urlaub"],
            },
          },
          {
            type: "anwendungsentwicklung",
            locked: false,
            data: {
              color: "#E2EFDA",
              labels: ["Anwendungsentwicklung", "AE"],
            },
          },
          {
            type: "userhelpdesk",
            locked: false,
            data: {
              color: "#F4B084",
              labels: ["User Help Desk", "UHD"],
            },
          },
          {
            type: "berufschule",
            locked: true,
            data: {
              color: "#FEB0E8",
              labels: ["Berufschule", "Schule"],
            },
          },
          {
            type: "applikationsbetrieb",
            locked: false,
            data: {
              color: "#FF3399",
              labels: ["Applikationsbetrieb"],
            },
          },
          {
            type: "abschlussprojekt",
            locked: false,
            data: {
              color: "#8EA9DB",
              labels: ["Abschlussprojekt", "Projekt"],
            },
          },
          {
            type: "backoffice",
            locked: false,
            data: {
              color: "#FFEB9C",
              labels: ["Backoffice"],
            },
          },
          {
            type: "personalmanagement",
            locked: false,
            data: {
              color: "#2F75B5",
              labels: ["Personalmanagement", "HR"],
            },
          },
          {
            type: "projektmanagement",
            locked: false,
            data: {
              color: "#FFF2CC",
              labels: ["Projektmanagement", "PJM"],
            },
          },
          {
            type: "einkauf_it_controlling_lizenzmanagement",
            locked: false,
            data: {
              color: "#548235",
              labels: [
                "Einkauf, IT-Controlling, Lizenzmanagement",
                "Einkauf",
                "ECL",
              ],
            },
          },
          {
            type: "it_security",
            locked: false,
            data: {
              color: "#5B9BD5",
              labels: ["IT-Security"],
            },
          },
          {
            type: "it_strategy",
            locked: false,
            data: {
              color: "#BF8F00",
              labels: ["IT-Strategy"],
            },
          },
          {
            type: "recht_compliance_managementsysteme",
            locked: false,
            data: {
              color: "#7030A0",
              labels: ["Recht, Compliance und Managementsysteme", "RCM"],
            },
          },
          {
            type: "datenbanken_middleware_appliances",
            locked: false,
            data: {
              color: "#FCE4D6",
              labels: ["Datenbanken, Middleware und Appliances", "DMA"],
            },
          },
          {
            type: "gesetzlicher_feiertag",
            locked: true,
            data: {
              color: "#DE90C8",
              labels: ["gesetzlicher Feiertag", "Feiertag", ""],
            },
          },
        ])
      );
    },
    onInitializedOffline() {
      new Promise((rej, _) => {
        setTimeout(rej, 1000);
      }).then(() =>
        this.$refs.plannerView.resetBlockData([
          {
            blockId: "server-data-01",
            startDate: `${this.year}-02-01`,
            endDate: `${this.year}-02-28`,
            type: "anwendungsentwicklung",
            rowKeys: ["ffarina", "ssebastian", "iingo"],
          },
          {
            blockId: "server-data-02",
            startDate: `${this.year}-01-23`,
            endDate: `${this.year}-01-31`,
            type: "userhelpdesk",
            rowKeys: ["ddennis", "iingo"],
          },
          {
            blockId: "server-data-03",
            startDate: `${this.year}-01-31`,
            endDate: `${this.year}-02-19`,
            type: "berufschule",
            rowKeys: ["vvigo", "iilse"],
          },
          {
            blockId: "server-data-04",
            startDate: `${this.year}-02-01`,
            endDate: `${this.year}-04-30`,
            type: "abschlussprojekt",
            rowKeys: ["ddennis"],
          },
          {
            blockId: "server-data-05",
            startDate: `${this.year}-01-02`,
            endDate: `${this.year}-01-04`,
            type: "projektmanagement",
            rowKeys: ["ffarina"],
          },
          {
            blockId: "server-data-06",
            startDate: `${this.year}-12-27`,
            endDate: `${this.year}-12-31`,
            type: "einkauf_it_controlling_lizenzmanagement",
            rowKeys: ["ffarina"],
          },
          {
            blockId: "server-data-07",
            startDate: `${this.year}-12-27`,
            endDate: `${this.year}-12-30`,
            type: "einkauf_it_controlling_lizenzmanagement",
            rowKeys: ["iingo", "iilse", "ddennis"],
          },
          {
            blockId: "server-data-08",
            startDate: `${this.year}-12-25`,
            endDate: `${this.year}-12-26`,
            type: "gesetzlicher_feiertag",
            rowKeys: [
              "ffarina",
              "ssebastian",
              "iingo",
              "iilse",
              "ddennis",
              "vvigo",
              "ddanzo",
            ],
          },
        ])
      );
    },
  },
  created() {
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
