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
      ></planner>
    </div>
  </main>
</template>
<script>
import Planner from "./components/Planner/Planner.vue";
export default {
  data() {
    return {
      year: 2023,
    };
  },
  components: {
    Planner,
  },
  methods: {
    onBlockAdded(event) {
      console.log(`onBlockAdded(): `, event);
    },
    onBlockDeleted(event) {
      console.log(`onBlockDeleted(): `, event);
    },
    onBlockUpdated(event) {
      console.log(`onBlockUpdated(): `, event);
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

    this.$refs.plannerView.addBlockData(
      new Date(this.year, 1, 1),
      new Date(this.year, 1, 28),
      "anwendungsentwicklung",
      ["ffarina", "ssebastian", "iingo"]
    );
    this.$refs.plannerView.addBlockData(
      new Date(this.year, 0, 23),
      new Date(this.year, 0, 31),
      "userhelpdesk",
      ["ddennis", "iingo"]
    );
    this.$refs.plannerView.addBlockData(
      new Date(this.year, 0, 31),
      new Date(this.year, 1, 19),
      "berufschule",
      ["vvigo", "iilse"]
    );
    this.$refs.plannerView.addBlockData(
      new Date(this.year, 1, 1),
      new Date(this.year, 3, 30),
      "abschlussprojekt",
      ["ddennis"]
    );
    this.$refs.plannerView.addBlockData(
      new Date(this.year, 0, 2),
      new Date(this.year, 0, 4),
      "projektmanagement",
      ["ffarina"]
    );
    this.$refs.plannerView.addBlockData(
      new Date(this.year, 11, 25),
      new Date(this.year, 11, 31),
      "einkauf_it_controlling_lizenzmanagement",
      ["ffarina"]
    );
    this.$refs.plannerView.addBlockData(
      new Date(this.year, 11, 25),
      new Date(this.year, 11, 30),
      "einkauf_it_controlling_lizenzmanagement",
      ["iingo", "iilse", "ddennis"]
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
}
</style>
