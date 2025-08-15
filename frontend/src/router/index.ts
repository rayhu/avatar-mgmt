import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  RouteLocationNormalized,
  NavigationGuardNext,
} from 'vue-router';
import Login from '../views/Login.vue';
import TestViewer from '../views/TestViewer.vue';
import EnvTest from '../views/EnvTest.vue';
import About from '../views/About.vue';
import { useAuthStore } from '../store';
import { logger } from '@/utils/logger';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: {
      title: 'login.title',
      public: true, // 公开路由，不需要登录
    },
  },
  {
    path: '/admin',
    name: 'modelManagement',
    component: () => import('../views/Admin/ModelList.vue'),
    meta: {
      title: 'modelManagement.title',
      roles: ['admin'], // 仅管理员可访问
    },
  },
  {
    path: '/user',
    name: 'modelGallery',
    component: () => import('../views/User/ModelGallery.vue'),
    meta: {
      title: 'modelManagement.modelGallery',
      roles: ['user', 'admin'], // 用户和管理员都可访问
    },
  },
  {
    path: '/animate',
    name: 'animate',
    component: () => import('../views/Animate.vue'),
    meta: {
      title: 'animate.title',
      roles: ['user', 'admin'], // 用户和管理员都可访问
    },
  },
  {
    path: '/test',
    name: 'test',
    component: TestViewer,
    meta: {
      title: 'test.title',
      roles: ['admin'], // 仅管理员可访问
    },
  },
  {
    path: '/env-test',
    name: 'envTest',
    component: EnvTest,
    meta: {
      title: '环境测试',
      public: true, // 公开路由，不需要登录
    },
  },
  {
    path: '/about',
    name: 'about',
    component: About,
    meta: {
      title: 'about.title',
      public: true, // 公开路由，不需要登录
    },
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

router.beforeEach(
  (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
    const auth = useAuthStore();
    
    // 添加更详细的调试信息
    console.log('🔍 路由守卫检查:', {
      from: from.path,
      to: to.path,
      toName: to.name,
      toMeta: to.meta,
      isAuthenticated: auth.isAuthenticated,
      userRole: auth.user?.role,
      requiredRoles: to.meta.roles,
      isPublic: to.meta.public
    });
    
    logger.info('路由守卫检查', {
      component: 'Router',
      method: 'beforeEach',
      from: from.path,
      to: to.path,
      isAuthenticated: auth.isAuthenticated,
      userRole: auth.user?.role,
      requiredRoles: to.meta.roles,
      isPublic: to.meta.public
    });

    // 检查是否是公开路由
    if (to.meta.public) {
      // 如果已登录且访问登录页，重定向到对应角色首页
      if (to.path === '/login' && auth.isAuthenticated) {
        const redirectPath = auth.user?.role === 'admin' ? '/admin' : '/user';
        logger.info('已登录用户访问登录页，重定向', {
          component: 'Router',
          method: 'beforeEach',
          redirectPath,
          userRole: auth.user?.role
        });
        next(redirectPath);
      } else {
        logger.info('用户访问公开路由，允许访问', {
          component: 'Router',
          method: 'beforeEach',
          route: to.path,
          isAuthenticated: auth.isAuthenticated,
          userRole: auth.user?.role
        });
        next();
      }
      return;
    }

    // 检查是否已登录
    if (!auth.isAuthenticated) {
      logger.warn('未登录用户访问受保护路由，重定向到登录页', {
        component: 'Router',
        method: 'beforeEach',
        attemptedRoute: to.path
      });
      next('/login');
      return;
    }

    // 检查角色权限
    const requiredRoles = to.meta.roles as string[] | undefined;
    if (requiredRoles && !requiredRoles.includes(auth.user?.role || '')) {
      // 如果没有权限，重定向到对应角色首页
      const redirectPath = auth.user?.role === 'admin' ? '/admin' : '/user';
      logger.warn('用户权限不足，重定向', {
        component: 'Router',
        method: 'beforeEach',
        userRole: auth.user?.role,
        requiredRoles,
        attemptedRoute: to.path,
        redirectPath
      });
      next(redirectPath);
      return;
    }

    logger.info('路由守卫检查通过，允许访问', {
      component: 'Router',
      method: 'beforeEach',
      route: to.path,
      userRole: auth.user?.role
    });
    next();
  },
);

export default router;
