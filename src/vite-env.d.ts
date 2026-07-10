/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_MOCK: string;
  readonly GEMINI_API_KEY: string;
  readonly VITE_SRS_HLS_CHUNAN: string;
  readonly VITE_SRS_HLS_JIAXING: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
