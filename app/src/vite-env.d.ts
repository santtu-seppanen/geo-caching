/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOYTO_API_URL: string;
  readonly VITE_LOYTO_SALASANA: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
