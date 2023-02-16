<template>
  <header>
    <h1>Azubi-Blockplanung für {{ this.year }}</h1>
  </header>

  <main>
    <div class="planner-container">
      <planner
        ref="plannerView"
        :year="this.year"
        selection-color-valid="#0000FF0F"
        selection-color-invalid="#FF000030"
        @block-added="onBlockAdded"
        @block-deleted="onBlockDeleted"
        @block-updated="onBlockUpdated"
        @keydown.stop.prevent="onKeyPress($event)"
        tabindex="-1"
      ></planner>
    </div>
  </main>
</template>
<script>
import Planner from "./components/Planner/Planner.vue";
export default {
  data() {
    return {
      year: 2024,

      currentMapping: new Map(),

      blockStates: {
        head: -1,
        stack: [],
        push(state, description) {
          if (this.head >= 0 && this.head < this.stack.length - 1) {
            // head points to e previous state
            // -> truncate stack to this point before applying new state
            const newstack = [];
            for (let i = 0; i <= this.head; i++) {
              newstack.push(this.copyState(this.stack[i]));
            }
            this.stack = newstack;
          }
          state.description = description;
          const stateToPush = this.copyState(state);

          this.stack.push(stateToPush);
          this.head = this.stack.length - 1;
        },
        rewind() {
          if (this.head > 0) {
            this.head -= 1;
            return true;
          }
          return false;
        },
        forward() {
          if (this.head < this.stack.length - 1) {
            this.head += 1;
            return true;
          }
          return false;
        },
        get() {
          if (this.head >= 0) return this.stack[this.head];
        },
        print() {
          console.log(`-----\n`);
          this.stack.forEach((state, idx) => {
            console.log(
              `\t${idx}\t${state.description}\tcount: ${state.length}${
                idx === this.head ? "\t[HEAD]" : ""
              }`
            );
          });
          console.log(`-----\n`);
        },
        copyDate(date) {
          if (!date) return;
          return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        },
        copyBlock(block) {
          if (!block) return;
          const startDate = this.copyDate(block.startDate);
          const endDate = this.copyDate(block.endDate);
          const type = `${block.type}`;
          const rowKeys = block.rowKeys.map((k) => `${k}`);
          return { startDate, endDate, type, rowKeys };
        },
        copyState(state) {
          if (!state) return;
          const copiedState = state.map((block) => this.copyBlock(block));
          if (state.description) {
            copiedState.description = `${state.description}`;
          }
          return copiedState;
        },
      },
    };
  },
  components: {
    Planner,
  },
  methods: {
    onBlockAdded(event) {
      const { blockId, startDate, endDate, type, rowKeys } = event;
      this.mapping.set(blockId, { startDate, endDate, type, rowKeys });
      this.updateStatesFromMapping(`block ${blockId} added`);
    },
    onBlockDeleted(event) {
      const { blockId } = event;
      this.mapping.delete(blockId);
      this.updateStatesFromMapping(`block ${blockId} deleted`);
    },
    onBlockUpdated(event) {
      const { blockId, startDate, endDate, type, rowKeys } = event;
      this.mapping.set(blockId, { startDate, endDate, type, rowKeys });
      this.updateStatesFromMapping(`block ${blockId} edited`);
    },
    onKeyPress(event) {
      if (event.ctrlKey && event.key === "z") {
        if (this.blockStates.rewind()) {
          this.restoreState();
          this.blockStates.print();
        }
      } else if (event.ctrlKey && event.key === "y") {
        if (this.blockStates.forward()) {
          this.restoreState();
          this.blockStates.print();
        }
      }
    },
    onServerData(data) {
      this.blockStates.push(data, "server-data");
      this.blockStates.print();
      this.restoreState();
    },
    updateStatesFromMapping(description) {
      const newState = [];
      this.mapping.forEach((v, k) => {
        newState.push(v);
      });
      this.blockStates.push(newState, description);
      this.blockStates.print();
    },
    restoreState() {
      this.mapping = new Map();
      this.$refs.plannerView.resetBlockData();
      this.blockStates.get().forEach((blockData) => {
        const key = this.$refs.plannerView.addBlockData(
          blockData.startDate,
          blockData.endDate,
          blockData.type,
          blockData.rowKeys
        );
        this.mapping.set(key, blockData);
      });
    },
  },
  created() {},
  mounted() {
    this.$refs.plannerView.resetDataHeaderRows([
      { title: "Farina Fachinformatikerin", key: "ffarina" },
      { title: "Ingo Ingenial", key: "iingo" },
      { title: "Sebastian Software", key: "ssebastian" },
      { title: "Vigo Virtuell", key: "vvigo" },
      { title: "Danzo Daten", key: "ddanzo" },
      { title: "Ilse Inzidenz", key: "iilse" },
      { title: "Dennis Decrypter", key: "ddennis" },
    ]);

    this.$refs.plannerView.resetBlockTypes([
      {
        type: "urlaub",
        data: {
          color: "#FFFF00",
          labels: ["Urlaub"],
        },
      },
      {
        type: "anwendungsentwicklung",
        data: {
          color: "#E2EFDA",
          labels: ["Anwendungsentwicklung", "AE"],
        },
      },
      {
        type: "userhelpdesk",
        data: {
          color: "#F4B084",
          labels: ["User Help Desk", "UHD"],
        },
      },
      {
        type: "berufschule",
        data: {
          color: "#FEB0E8",
          labels: ["Berufschule", "Schule"],
        },
      },
      {
        type: "applikationsbetrieb",
        data: {
          color: "#FF3399",
          labels: ["Applikationsbetrieb"],
        },
      },
      {
        type: "abschlussprojekt",
        data: {
          color: "#8EA9DB",
          labels: ["Abschlussprojekt", "Projekt"],
        },
      },
      {
        type: "backoffice",
        data: {
          color: "#FFEB9C",
          labels: ["Backoffice"],
        },
      },
      {
        type: "personalmanagement",
        data: {
          color: "#2F75B5",
          labels: ["Personalmanagement", "HR"],
        },
      },
      {
        type: "projektmanagement",
        data: {
          color: "#FFF2CC",
          labels: ["Projektmanagement", "PJM"],
        },
      },
      {
        type: "einkauf_it_controlling_lizenzmanagement",
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
        data: {
          color: "#5B9BD5",
          labels: ["IT-Security"],
        },
      },
      {
        type: "it_strategy",
        data: {
          color: "#BF8F00",
          labels: ["IT-Strategy"],
        },
      },
      {
        type: "recht_compliance_managementsysteme",
        data: {
          color: "#7030A0",
          labels: ["Recht, Compliance und Managementsysteme", "RCM"],
        },
      },
      {
        type: "datenbanken_middleware_appliances",
        data: {
          color: "#FCE4D6",
          labels: ["Datenbanken, Middleware und Appliances", "DMA"],
        },
      },
    ]);

    this.onServerData([
      {
        startDate: new Date(this.year, 1, 1),
        endDate: new Date(this.year, 1, 28),
        type: "anwendungsentwicklung",
        rowKeys: ["ffarina", "ssebastian", "iingo"],
      },
      {
        startDate: new Date(this.year, 0, 23),
        endDate: new Date(this.year, 0, 31),
        type: "userhelpdesk",
        rowKeys: ["ddennis", "iingo"],
      },
      {
        startDate: new Date(this.year, 0, 31),
        endDate: new Date(this.year, 1, 19),
        type: "berufschule",
        rowKeys: ["vvigo", "iilse"],
      },
      {
        startDate: new Date(this.year, 1, 1),
        endDate: new Date(this.year, 3, 30),
        type: "abschlussprojekt",
        rowKeys: ["ddennis"],
      },
      {
        startDate: new Date(this.year, 0, 2),
        endDate: new Date(this.year, 0, 4),
        type: "projektmanagement",
        rowKeys: ["ffarina"],
      },
      {
        startDate: new Date(this.year, 11, 25),
        endDate: new Date(this.year, 11, 31),
        type: "einkauf_it_controlling_lizenzmanagement",
        rowKeys: ["ffarina"],
      },
      {
        startDate: new Date(this.year, 11, 25),
        endDate: new Date(this.year, 11, 30),
        type: "einkauf_it_controlling_lizenzmanagement",
        rowKeys: ["iingo", "iilse", "ddennis"],
      },
    ]);
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
}
</style>
