/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_AZURE_TTS_KEY: string
  readonly VITE_AZURE_TTS_REGION: string
  readonly VITE_DIRECTUS_URL: string
  readonly VITE_DIRECTUS_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 