/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 后端 API 地址（Vercel 部署时设为 Railway 后端 URL） */
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
