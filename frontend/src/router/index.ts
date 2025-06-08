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
      title: 'login.title',
      public: true // 公开路由，不需要登录
    }
  },
  {
    path: '/admin',
    name: 'modelManagement',
    component: () => import('../views/Admin/ModelList.vue'),
    meta: {
      title: 'modelManagement.title',
      roles: ['admin'] // 仅管理员可访问
    }
  },
  {
    path: '/user',
    name: 'modelGallery',
    component: () => import('../views/User/ModelGallery.vue'),
    meta: {
      title: 'modelManagement.modelGallery',
      roles: ['user', 'admin'] // 用户和管理员都可访问
    }
  },
  {
    path: '/animate',
    name: 'animate',
    component: () => import('../views/Animate.vue'),
    meta: {
      title: 'animate.title',
      roles: ['user', 'admin'] // 用户和管理员都可访问
    }
  },
  {
    path: '/test',
    name: 'test',
    component: TestViewer,
    meta: {
      title: 'test.title',
      roles: ['admin'] // 仅管理员可访问
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
  
  // 检查是否是公开路由
  if (to.meta.public) {
    // 如果已登录且访问登录页，重定向到对应角色首页
    if (auth.isAuthenticated) {
      next(auth.user?.role === 'admin' ? '/admin' : '/user');
    } else {
      next();
    }
    return;
  }

  // 检查是否已登录
  if (!auth.isAuthenticated) {
    next('/login');
    return;
  }

  // 检查角色权限
  const requiredRoles = to.meta.roles as string[] | undefined;
  if (requiredRoles && !requiredRoles.includes(auth.user?.role || '')) {
    // 如果没有权限，重定向到对应角色首页
    next(auth.user?.role === 'admin' ? '/admin' : '/user');
    return;
  }

  next();
});

export default router; 