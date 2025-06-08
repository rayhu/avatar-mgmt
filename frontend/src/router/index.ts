import { createRouter, createWebHistory, RouteRecordRaw, RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import Login from '../views/Login.vue';
import TestViewer from '../views/TestViewer.vue';
import { useAuthStore } from '../store';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: {
      title: 'login.title'
    }
  },
  {
    path: '/admin',
    name: 'modelManagement',
    component: () => import('../views/Admin/ModelList.vue'),
    meta: {
      title: 'modelManagement.title'
    }
  },
  {
    path: '/user',
    name: 'modelGallery',
    component: () => import('../views/User/ModelGallery.vue'),
    meta: {
      title: 'modelManagement.modelGallery'
    }
  },
  {
    path: '/animate',
    name: 'animate',
    component: () => import('../views/Animate.vue'),
    meta: {
      title: 'animate.title'
    }
  },
  {
    path: '/test',
    name: 'test',
    component: TestViewer,
    meta: {
      title: 'test.title'
    }
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