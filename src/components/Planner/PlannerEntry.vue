<template></template>
<script>
import { store } from "./store";

export default {
  data() {
    return {
      shared: store,
    };
  },
  props: {
    rowKeys: Array,
    startDate: Date,
    endDate: Date,
    color: String,
    name: String,
  },
  beforeCreate() {
    //console.log("PlannerEntry -- beforeCreate");
  },
  created() {
    //console.log("PlannerEntry -- created");
    this.shared.serviceManager.tableDataService.importBlockData(
      this.name,
      this.startDate,
      this.endDate,
      {
        style: {
          color: this.color,
        },
        class: {},
      },
      this.rowKeys
    );
  },
  beforeMount() {
    //console.log("PlannerEntry -- beforeMount");
  },
  mounted() {
    //console.log("PlannerEntry -- mounted");
  },
  beforeUpdate() {
    //console.log("PlannerEntry -- beforeUpdate");
  },
  updated() {
    //console.log("PlannerEntry -- updated");
  },
  beforeUnmount() {
    //console.log("PlannerEntry -- beforeUnmount");
  },
  unmounted() {
    //console.log("PlannerEntry -- unmounted");
  },
};
</script>
<style></style>
