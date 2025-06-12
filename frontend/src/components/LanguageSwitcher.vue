<template>
  <div v-click-outside="closeDropdown" class="language-switcher" @keydown.esc="closeDropdown">
    <button
      class="lang-btn"
      :aria-label="t('language.selectLanguage')"
      :aria-expanded="isOpen"
      @click="toggleDropdown"
      @keydown.enter="toggleDropdown"
      @keydown.space.prevent="toggleDropdown"
    >
      <span class="flag">{{ currentFlag }}</span>
      <span class="current-lang">
        {{ t(`language.${currentLocale}`) }}
      </span>
      <span class="dropdown-icon" :class="{ 'is-open': isOpen }">▼</span>
    </button>

    <div
      v-show="isOpen"
      class="dropdown-menu"
      role="menu"
      @keydown.down.prevent="navigateOptions(1)"
      @keydown.up.prevent="navigateOptions(-1)"
      @keydown.enter="selectHighlightedLanguage"
      @keydown.space.prevent="selectHighlightedLanguage"
    >
      <button
        v-for="lang in languages"
        :key="lang.code"
        class="dropdown-item"
        :class="{
          active: currentLocale === lang.code,
          highlighted: highlightedIndex === languages.indexOf(lang),
        }"
        role="menuitem"
        :aria-selected="currentLocale === lang.code"
        @click="selectLanguage(lang.code)"
        @mouseenter="highlightedIndex = languages.indexOf(lang)"
      >
        <span class="flag">{{ lang.flag }}</span>
        <span class="lang-name">{{ t(`language.${lang.code}`) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Language {
  code: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'zh-CN', flag: '🇨🇳' },
  { code: 'en', flag: '🇺🇸' },
];

const { locale, t } = useI18n();
const currentLocale = computed(() => locale.value);
const isOpen = ref(false);
const highlightedIndex = ref(0);

const currentFlag = computed(() => {
  const lang = languages.find((l) => l.code === currentLocale.value);
  return lang?.flag || languages[0].flag;
});

function toggleDropdown() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    highlightedIndex.value = languages.findIndex((l) => l.code === currentLocale.value);
  }
}

function closeDropdown() {
  isOpen.value = false;
}

function selectLanguage(lang: string) {
  if (lang !== currentLocale.value) {
    locale.value = lang;
    localStorage.setItem('preferred-language', lang);
  }
  closeDropdown();
}

function navigateOptions(direction: number) {
  const newIndex = highlightedIndex.value + direction;
  if (newIndex >= 0 && newIndex < languages.length) {
    highlightedIndex.value = newIndex;
  }
}

function selectHighlightedLanguage() {
  const lang = languages[highlightedIndex.value];
  if (lang) {
    selectLanguage(lang.code);
  }
}

// Click outside directive
const vClickOutside = {
  mounted(el: HTMLElement & { clickOutsideEvent?: (event: Event) => void }, binding: any) {
    el.clickOutsideEvent = function (event: Event) {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value();
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el: HTMLElement & { clickOutsideEvent?: (event: Event) => void }) {
    if (el.clickOutsideEvent) {
      document.removeEventListener('click', el.clickOutsideEvent);
    }
  },
};
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.language-switcher {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;

  .lang-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
    color: #2c3e50;
    font-weight: 500;

    &:hover {
      border-color: #42b883;
      background: #f8f9fa;
    }

    &:focus {
      outline: none;
      border-color: #42b883;
      box-shadow: 0 0 0 2px rgba(66, 184, 131, 0.2);
    }

    .current-lang {
      min-width: 60px;
    }

    .dropdown-icon {
      font-size: 10px;
      transition: transform 0.2s ease;

      &.is-open {
        transform: rotate(180deg);
      }
    }

    .flag {
      font-size: 16px;
      line-height: 1;
    }
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    min-width: 120px;
    z-index: 1000;
    animation: slideDown 0.2s ease;

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      color: #2c3e50;
      text-align: left;
      transition: all 0.2s ease;

      &:hover,
      &.highlighted {
        background: #f8f9fa;
      }

      &:focus {
        outline: none;
        background: #f8f9fa;
      }

      &.active {
        color: #42b883;
        font-weight: 600;
        background: rgba(66, 184, 131, 0.1);
      }

      .flag {
        font-size: 16px;
        line-height: 1;
        min-width: 24px;
        text-align: center;
      }
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
