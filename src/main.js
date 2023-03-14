import { createApp } from "vue";
import App from "./app.vue";
import "./assets/main.css";
import { createRouter, createWebHashHistory } from "vue-router";

import PlannerView from "./views/planner/plannerView.vue";

const app = createApp(App);

const routes = [{ path: "/blockplanung/:year?", component: PlannerView }];

const router = createRouter({
  history: createWebHashHistory(),
  routes: routes,
  linkActiveClass: "active",
});

app.use(router);
app.mount("#app");
