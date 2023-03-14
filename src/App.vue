<template>
  <body>
    <router-view :key="route.fullPath"></router-view>
  </body>
</template>
<script>
import { useRoute } from "vue-router";

export default {
  name: "App",
  components: {},
  setup() {
    const route = useRoute();
    return {
      route,
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
