// ============================================================
// Module Types
// ============================================================

export type ModuleType = 'ideation' | 'character' | 'outline' | 'screenplay' | 'dialogue';

// ============================================================
// Text LLM (existing)
// ============================================================

export type AIProvider = 'doubao' | 'qwen' | 'deepseek' | 'tongyi' | 'custom';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface ProviderInfo {
  id: AIProvider;
  name: string;
  baseURL: string;
  models: { id: string; name: string }[];
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3 (通用)' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (推理)' },
    ],
  },
  {
    id: 'doubao',
    name: '豆包 (字节跳动)',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      { id: 'doubao-pro-32k', name: '豆包 Pro 32K' },
      { id: 'doubao-lite-32k', name: '豆包 Lite 32K' },
    ],
  },
  {
    id: 'tongyi',
    name: '通义千问 (阿里云)',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-plus', name: 'Qwen-Plus (通用)' },
      { id: 'qwen-max', name: 'Qwen-Max (最强)' },
    ],
  },
  {
    id: 'qwen',
    name: '通义千问 (阿里云)',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-plus', name: 'Qwen-Plus (通用)' },
      { id: 'qwen-max', name: 'Qwen-Max (最强)' },
      { id: 'qwen-turbo', name: 'Qwen-Turbo (轻量)' },
    ],
  },
  {
    id: 'custom',
    name: '自定义',
    baseURL: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    ],
  },
];

// ============================================================
// Image Generation
// ============================================================

export type ImageProvider = 'jimeng' | 'sd' | 'custom';

export interface ImageSettings {
  provider: ImageProvider;
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface ImageProviderInfo {
  id: ImageProvider;
  name: string;
  baseURL: string;
  models: { id: string; name: string }[];
  helpUrl: string;
}

export const IMG_PROVIDERS: ImageProviderInfo[] = [
  {
    id: 'jimeng',
    name: '即梦 AI (火山引擎)',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      { id: 'doubao-seedream-3-0-t2i-250415', name: 'Seedream 3.0 (高质量)' },
    ],
    helpUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apikey',
  },
  {
    id: 'sd',
    name: 'Stable Diffusion (Stability AI)',
    baseURL: 'https://api.stability.ai/v2beta/stable-image/generate/core',
    models: [
      { id: 'sd3.5-large', name: 'SD 3.5 Large' },
      { id: 'sd3.5-medium', name: 'SD 3.5 Medium' },
      { id: 'sd-core', name: 'SD Core' },
    ],
    helpUrl: 'https://platform.stability.ai/account/keys',
  },
];

// ============================================================
// Video Generation
// ============================================================

export type VideoProvider = 'jimeng' | 'runway' | 'pika' | 'custom';

export interface VideoSettings {
  provider: VideoProvider;
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface VideoProviderInfo {
  id: VideoProvider;
  name: string;
  baseURL: string;
  models: { id: string; name: string }[];
  helpUrl: string;
}

export const VID_PROVIDERS: VideoProviderInfo[] = [
  {
    id: 'jimeng',
    name: '即梦 AI (火山引擎)',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      { id: 'doubao-seedance-1-0-pro-t2v-250528', name: 'Seedance Pro (文生视频)' },
    ],
    helpUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apikey',
  },
  {
    id: 'runway',
    name: 'Runway',
    baseURL: 'https://api.runwayml.com/v1',
    models: [
      { id: 'gen3a_turbo', name: 'Gen-3 Alpha Turbo' },
    ],
    helpUrl: 'https://runwayml.com/api',
  },
  {
    id: 'pika',
    name: 'Pika',
    baseURL: 'https://api.pika.art/v1',
    models: [
      { id: 'pika-2.0', name: 'Pika 2.0' },
    ],
    helpUrl: 'https://pika.art',
  },
  {
    id: 'custom',
    name: '自定义 API',
    baseURL: 'https://api.runwayml.com/v1',
    models: [
      { id: 'custom-video-model', name: '自定义视频模型' },
    ],
    helpUrl: '',
  },
];

// ============================================================
// Project / Module Types
// ============================================================

export interface Project {
  id: string;
  title: string;
  genre: string;
  logline: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ModuleConfig {
  type: ModuleType;
  label: string;
  labelEn: string;
  icon: string;
  description: string;
  welcomeMessage: string;
  suggestions: string[];
}

export interface ModuleContent {
  content: string;
  metadata: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  module_type: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatStreamEvent {
  event: 'delta' | 'tool_call' | 'done' | 'error';
  data: any;
}

// ============================================================
// Scene / Storyboard Types
// ============================================================

export interface SceneData {
  num: string;
  beat: string;
  location: string;
  time: string;
  characters: string;
  purpose: string;
  description: string;
  // Visual details (optional, for image/video generation)
  visualDesc?: string;
  shotSize?: string;
  cameraMove?: string;
  lighting?: string;
  colorTone?: string;
  style?: string;
  // Raw line index in the outline content (for matching)
  lineIndex: number;
}

// ============================================================
// Media Types
// ============================================================

export interface MediaItem {
  id: string;
  project_id: string;
  scene_num: string;
  type: 'image' | 'video';
  file_path: string;
  prompt: string;
  provider: string;
  metadata: string;
  created_at: string;
  url?: string; // added by server when serving
}

// ============================================================
// Video Generation Options
// ============================================================

export type VideoMode = 'single' | 'multi';

export interface VideoGenOptions {
  mode: VideoMode;
  sceneNums: string[];
  duration: number;
  cameraMovement: string;
  style: string;
  customPrompt?: string;
}

// ============================================================
// Image Generation Options
// ============================================================

export interface ImageGenOptions {
  customPrompt: string;   // 用户自定义提示词（构图、美术设计等）
  style: string;          // 画面风格预设
  aspectRatio: string;    // 宽高比
}
