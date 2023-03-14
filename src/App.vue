<template>
  <header>
    <h1>Azubi-Blockplanung für {{ year }}</h1>
  </header>
  <body>
    <plannerView :year="year"></plannerView>
  </body>
</template>
<script>
import PlannerView from "./views/planner/plannerView.vue";
import { ref } from "vue";

export default {
  components: {
    PlannerView,
  },
  setup() {
    const year = ref(2023);

    return {
      year,
    };
  },
};
</script>

<style scoped>
h1 {
  display: inline-block;
  margin-bottom: 2rem;
}
</style>
