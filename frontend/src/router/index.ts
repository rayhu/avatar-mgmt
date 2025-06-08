import { createRouter, createWebHistory, RouteRecordRaw, RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import Login from '../views/Login.vue';
import TestViewer from '../views/TestViewer.vue';
import { useAuthStore } from '../store';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin/ModelList.vue'),
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('../views/User/ModelGallery.vue'),
  },
  {
    path: '/animate',
    name: 'animate',
    component: () => import('../views/Animate.vue'),
  },
  {
    path: '/test',
    name: 'test',
    component: TestViewer,
  },
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const auth = useAuthStore();
  if (!auth.isAuthenticated && to.path !== '/login') {
    next('/login');
  } else {
    next();
  }
});

export default router; 