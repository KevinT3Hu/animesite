// Composables
import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("@/views/Home.vue"),
  },
  {
    path: '/watchlist/:title',
    component: () => import("@/views/WatchListView.vue"),
    name: 'watchList',
    props: true
  },
  {
    path: '/calendar',
    component: () => import("@/views/Calendar.vue"),
    name: 'calendar',
  }
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
});

export default router;
