/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_AZURE_TTS_KEY: string;
  readonly VITE_AZURE_TTS_REGION: string;
  readonly VITE_DIRECTUS_URL: string;
  readonly VITE_DIRECTUS_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


// 扩展 Window 接口
declare global {
  interface Window {
    APP_CONFIG: {
      API_BASE_URL: string;
      DIRECTUS_BASE_URL: string;
      APP_ENV: string;
      APP_TITLE: string;
      APP_DESCRIPTION?: string;
      FEATURE_ANIMATION?: boolean;
      FEATURE_UPLOAD?: boolean;
      FEATURE_SHARING?: boolean;
      DEBUG?: boolean;
      BUILD_TIME?: string;
    };
  }
}

export { };
