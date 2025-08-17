<template>
  <div class="mobile-menu">
    <!-- 汉堡菜单按钮 -->
    <button 
      class="menu-toggle"
      @click="toggleMenu"
      :aria-expanded="isMenuOpen"
      aria-label="Toggle navigation menu"
    >
      <span class="hamburger-line" :class="{ active: isMenuOpen }"></span>
      <span class="hamburger-line" :class="{ active: isMenuOpen }"></span>
      <span class="hamburger-line" :class="{ active: isMenuOpen }"></span>
    </button>

    <!-- 移动端菜单覆盖层 -->
    <Teleport to="body">
      <div 
        v-if="isMenuOpen" 
        class="menu-overlay"
        @click="closeMenu"
      >
        <nav class="mobile-nav" @click.stop>
          <div class="mobile-nav-header">
            <h3>{{ t('navigation.menu') }}</h3>
            <button 
              class="close-btn"
              @click="closeMenu"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          
          <div class="mobile-nav-content">
            <!-- 系统信息链接 - 始终显示 -->
            <router-link 
              to="/about"
              class="mobile-nav-link"
              @click="closeMenu"
            >
              {{ t('common.about') }}
            </router-link>
            
            <div class="mobile-nav-divider"></div>
            
            <template v-if="auth.isAuthenticated">
              <router-link 
                v-if="auth.isAdmin" 
                to="/admin"
                class="mobile-nav-link"
                @click="closeMenu"
              >
                {{ t('modelManagement.title') }}
              </router-link>
              <router-link 
                to="/user"
                class="mobile-nav-link"
                @click="closeMenu"
              >
                {{ t('modelManagement.modelGallery') }}
              </router-link>
              <router-link 
                to="/animate"
                class="mobile-nav-link"
                @click="closeMenu"
              >
                {{ t('animate.title') }}
              </router-link>
              <router-link 
                to="/test"
                class="mobile-nav-link"
                @click="closeMenu"
              >
                {{ t('test.title') }}
              </router-link>              
              <div class="mobile-nav-divider"></div>
              
              <div class="mobile-user-info">
                <span class="user-name">{{ auth.user?.name }}</span>
                <span class="user-role">{{ t(auth.user?.role || 'user') }}</span>
                <button class="logout-btn" @click="handleLogout">
                  {{ t('logout') }}
                </button>
              </div>
            </template>
            
            <template v-else>
              <router-link 
                to="/login"
                class="mobile-nav-link"
                @click="closeMenu"
              >
                {{ t('login.title') }}
              </router-link>
            </template>
          </div>
        </nav>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../store';
import { useRouter } from 'vue-router';
import { logout as apiLogout } from '../api/auth';

const { t } = useI18n();
const auth = useAuthStore();
const router = useRouter();

const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

const handleLogout = async () => {
  try {
    // Call API logout with refresh token
    await apiLogout(auth.refreshToken || undefined);
  } catch (error) {
    console.warn('Logout API call failed, but continuing with local logout:', error);
  }
  
  auth.clearUser();
  router.push('/login');
  closeMenu();
};
</script>

<style scoped lang="scss">
.mobile-menu {
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
}

.menu-toggle {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  &:active {
    background-color: rgba(0, 0, 0, 0.1);
  }
}

.hamburger-line {
  width: 100%;
  height: 3px;
  background-color: #2c3e50;
  transition: all 0.3s ease;
  transform-origin: center;
  
  &.active {
    &:nth-child(1) {
      transform: rotate(45deg) translate(6px, 6px);
    }
    
    &:nth-child(2) {
      opacity: 0;
      transform: scaleX(0);
    }
    
    &:nth-child(3) {
      transform: rotate(-45deg) translate(6px, -6px);
    }
  }
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.mobile-nav {
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  max-width: 80vw;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  animation: slideInRight 0.3s ease;
  overflow-y: auto;
}

.mobile-nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  
  h3 {
    margin: 0;
    color: #2c3e50;
  }
}

.close-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.mobile-nav-content {
  padding: 20px;
}

.mobile-nav-link {
  display: block;
  padding: 16px 0;
  color: #2c3e50;
  text-decoration: none;
  font-size: 18px;
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
  transition: color 0.3s ease;
  
  &:hover {
    color: #42b883;
  }
  
  &:last-child {
    border-bottom: none;
  }
}

.mobile-nav-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 20px 0;
}

.mobile-user-info {
  text-align: center;
  
  .user-name {
    display: block;
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 4px;
  }
  
  .user-role {
    display: block;
    font-size: 14px;
    color: #666;
    margin-bottom: 16px;
  }
  
  .logout-btn {
    width: 100%;
    padding: 12px;
    background: #e74c3c;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    
    &:hover {
      background: #c0392b;
    }
    
    &:active {
      background: #a93226;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInRight {
  from { 
    transform: translateX(100%);
    opacity: 0;
  }
  to { 
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
