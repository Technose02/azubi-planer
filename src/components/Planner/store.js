import { reactive } from "vue";

// Nur der ServiceManager ist explizit geteilt unter allen Komponenten!
export const store = reactive({
  serviceManager: [],
});
