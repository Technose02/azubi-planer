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
    startDate: Date,
    endDate: Date,
    type: String,
    rowKeys: Array,
  },
  beforeCreate() {
    //console.log("PlannerEntry -- beforeCreate");
  },
  created() {
    //console.log("PlannerEntry -- created");
    this.shared.serviceManager.tableDataService.importBlockData(
      this.startDate,
      this.endDate,
      this.type,
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
