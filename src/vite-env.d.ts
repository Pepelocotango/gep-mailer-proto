/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REPLY_BASE_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
