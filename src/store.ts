import { create } from 'zustand';
import type {
  Project,
  ModuleType,
  ModuleConfig,
  ChatMessage,
  AISettings,
  ImageSettings,
  VideoSettings,
  MediaItem,
} from './types';
import { PROVIDERS, IMG_PROVIDERS, VID_PROVIDERS } from './types';
import { api } from './api';

// ============================================================
// Settings — localStorage persistence
// ============================================================
const SETTINGS_KEY = 'scriptcraft_ai_settings';
const IMG_SETTINGS_KEY = 'scriptcraft_img_settings';
const VID_SETTINGS_KEY = 'scriptcraft_vid_settings';
const BG_KEY = 'scriptcraft_bg_image';

function loadBgImage(): string {
  try {
    return localStorage.getItem(BG_KEY) || '';
  } catch { return ''; }
}

function saveBgImage(dataUrl: string | null) {
  if (dataUrl) {
    localStorage.setItem(BG_KEY, dataUrl);
  } else {
    localStorage.removeItem(BG_KEY);
  }
}

function loadSettings(): AISettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.provider && parsed.apiKey && parsed.model) return parsed;
    }
  } catch {}
  return { provider: 'deepseek', apiKey: '', baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' };
}

function saveSettings(s: AISettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function loadImgSettings(): ImageSettings {
  try {
    const raw = localStorage.getItem(IMG_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.provider && parsed.apiKey && parsed.model) return parsed;
    }
  } catch {}
  return { provider: 'jimeng', apiKey: '', baseURL: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-seedream-4-0-250828' };
}

function saveImgSettings(s: ImageSettings) {
  localStorage.setItem(IMG_SETTINGS_KEY, JSON.stringify(s));
}

function loadVidSettings(): VideoSettings {
  try {
    const raw = localStorage.getItem(VID_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.provider && parsed.apiKey && parsed.model) return parsed;
    }
  } catch {}
  return { provider: 'jimeng', apiKey: '', baseURL: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-seedance-1-0-pro-t2v-250528' };
}

function saveVidSettings(s: VideoSettings) {
  localStorage.setItem(VID_SETTINGS_KEY, JSON.stringify(s));
}

// ============================================================
// Store
// ============================================================

interface AppState {
  // Projects
  projects: Project[];
  currentProject: Project | null;
  loadingProjects: boolean;

  // Modules
  modules: ModuleConfig[];
  currentModule: ModuleType;

  // Content
  moduleContents: Record<ModuleType, string>;

  // Chat
  chatMessages: Record<ModuleType, ChatMessage[]>;
  isStreaming: boolean;

  // UI
  sidebarOpen: boolean;
  showSettings: boolean;

  // AI Settings
  aiSettings: AISettings;
  imgSettings: ImageSettings;
  vidSettings: VideoSettings;

  // Media
  projectMedia: MediaItem[];

  // Custom Background
  customBackground: string | null;
  setCustomBackground: (dataUrl: string) => void;
  clearCustomBackground: () => void;

  // Actions — Projects
  loadProjects: () => Promise<void>;
  selectProject: (project: Project) => Promise<void>;
  createProject: (title: string, genre?: string, logline?: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateProject: (id: string, updates: Partial<Pick<Project, 'title' | 'genre' | 'logline'>>) => Promise<void>;

  // Actions — Modules
  loadModules: () => Promise<void>;
  switchModule: (moduleType: ModuleType) => Promise<void>;

  // Actions — Content
  saveContent: (content: string) => void;
  loadContent: (projectId: string, moduleType: ModuleType) => Promise<void>;

  // Actions — Chat
  loadMessages: (projectId: string, moduleType: ModuleType) => Promise<void>;
  addMessage: (moduleType: ModuleType, message: ChatMessage) => void;
  updateLastAssistantMessage: (moduleType: ModuleType, text: string) => void;
  clearMessages: (projectId: string, moduleType: ModuleType) => Promise<void>;
  setStreaming: (streaming: boolean) => void;

  // Actions — UI
  toggleSidebar: () => void;
  toggleSettings: () => void;

  // Actions — AI Settings
  updateAISettings: (settings: Partial<AISettings>) => void;
  updateImgSettings: (settings: Partial<ImageSettings>) => void;
  updateVidSettings: (settings: Partial<VideoSettings>) => void;
  getAIConfigHeaders: () => Record<string, string>;
  getImgConfigHeaders: () => Record<string, string>;
  getVidConfigHeaders: () => Record<string, string>;

  // Actions — Media
  loadMedia: (projectId: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  projects: [],
  currentProject: null,
  loadingProjects: false,
  modules: [],
  currentModule: 'ideation',
  moduleContents: { ideation: '', character: '', outline: '', screenplay: '', dialogue: '' },
  chatMessages: { ideation: [], character: [], outline: [], screenplay: [], dialogue: [] },
  isStreaming: false,
  sidebarOpen: true,
  showSettings: false,
  aiSettings: loadSettings(),
  imgSettings: loadImgSettings(),
  vidSettings: loadVidSettings(),
  projectMedia: [],
  customBackground: loadBgImage(),

  // ---- Projects ----

  loadProjects: async () => {
    set({ loadingProjects: true });
    try {
      const projects = await api.getProjects();
      set({ projects, loadingProjects: false });
    } catch {
      set({ loadingProjects: false });
    }
  },

  selectProject: async (project) => {
    set({ currentProject: project });
    const { currentModule } = get();
    await get().loadContent(project.id, currentModule);
    await get().loadMessages(project.id, currentModule);
    await get().loadMedia(project.id);
  },

  createProject: async (title, genre, logline) => {
    try {
      const project = await api.createProject(title, genre, logline);
      set((state) => ({ projects: [project, ...state.projects] }));
      await get().selectProject(project);
    } catch (err) {
      console.error('创建项目失败:', err);
      alert('创建项目失败，请检查后端服务是否正常运行');
    }
  },

  deleteProject: async (id) => {
    await api.deleteProject(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }));
  },

  updateProject: async (id, updates) => {
    await api.updateProject(id, updates);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      currentProject: state.currentProject?.id === id ? { ...state.currentProject, updates } : state.currentProject,
    }));
  },

  // ---- Modules ----

  loadModules: async () => {
    const modules = await api.getModules();
    set({ modules });
  },

  switchModule: async (moduleType) => {
    set({ currentModule: moduleType });
    const { currentProject } = get();
    if (currentProject) {
      await get().loadContent(currentProject.id, moduleType);
      await get().loadMessages(currentProject.id, moduleType);
    }
  },

  // ---- Content ----

  saveContent: (content) => {
    const { currentProject, currentModule } = get();
    if (!currentProject) return;
    set((state) => ({
      moduleContents: { ...state.moduleContents, [currentModule]: content },
    }));
    api.saveModuleContent(currentProject.id, currentModule, content).catch(console.error);
  },

  loadContent: async (projectId, moduleType) => {
    try {
      const mc = await api.getModuleContent(projectId, moduleType);
      set((state) => ({
        moduleContents: { ...state.moduleContents, [moduleType]: mc.content },
      }));
    } catch { /* ignore */ }
  },

  // ---- Chat ----

  loadMessages: async (projectId, moduleType) => {
    try {
      const messages = await api.getMessages(projectId, moduleType);
      set((state) => ({
        chatMessages: { ...state.chatMessages, [moduleType]: messages },
      }));
    } catch { /* ignore */ }
  },

  addMessage: (moduleType, message) => {
    set((state) => ({
      chatMessages: {
        ...state.chatMessages,
        [moduleType]: [...state.chatMessages[moduleType], message],
      },
    }));
  },

  updateLastAssistantMessage: (moduleType, text) => {
    set((state) => {
      const messages = [...state.chatMessages[moduleType]];
      const lastIdx = messages.length - 1;
      if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
        messages[lastIdx] = { ...messages[lastIdx], content: text };
      }
      return { chatMessages: { ...state.chatMessages, [moduleType]: messages } };
    });
  },

  clearMessages: async (projectId, moduleType) => {
    await api.clearMessages(projectId, moduleType);
    set((state) => ({
      chatMessages: { ...state.chatMessages, [moduleType]: [] },
    }));
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  // ---- UI ----

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),

  // ---- AI Settings ----

  updateAISettings: (partial) => {
    const current = get().aiSettings;
    const updated: AISettings = { ...current, ...partial };
    if (partial.provider && partial.provider !== current.provider) {
      const provider = PROVIDERS.find((p) => p.id === partial.provider);
      if (provider) { updated.model = provider.models[0].id; updated.baseURL = provider.baseURL; }
    }
    saveSettings(updated);
    set({ aiSettings: updated });
  },

  updateImgSettings: (partial) => {
    const current = get().imgSettings;
    const updated: ImageSettings = { ...current, ...partial };
    if (partial.provider && partial.provider !== current.provider) {
      const provider = IMG_PROVIDERS.find((p) => p.id === partial.provider);
      if (provider) { updated.model = provider.models[0].id; updated.baseURL = provider.baseURL; }
    }
    saveImgSettings(updated);
    set({ imgSettings: updated });
  },

  updateVidSettings: (partial) => {
    const current = get().vidSettings;
    const updated: VideoSettings = { ...current, ...partial };
    if (partial.provider && partial.provider !== current.provider) {
      const provider = VID_PROVIDERS.find((p) => p.id === partial.provider);
      if (provider) { updated.model = provider.models[0].id; updated.baseURL = provider.baseURL; }
    }
    saveVidSettings(updated);
    set({ vidSettings: updated });
  },

  getAIConfigHeaders: (): Record<string, string> => {
    const { aiSettings } = get();
    if (!aiSettings.apiKey) return {};
    const provider = PROVIDERS.find((p) => p.id === aiSettings.provider);
    return {
      'X-AI-Provider': aiSettings.provider,
      'X-AI-ApiKey': aiSettings.apiKey,
      'X-AI-Model': aiSettings.model,
      'X-AI-BaseURL': provider?.baseURL || '',
    };
  },

  getImgConfigHeaders: (): Record<string, string> => {
    const { imgSettings } = get();
    if (!imgSettings.apiKey) return {};
    const provider = IMG_PROVIDERS.find((p) => p.id === imgSettings.provider);
    return {
      'X-IMG-Provider': imgSettings.provider,
      'X-IMG-ApiKey': imgSettings.apiKey,
      'X-IMG-Model': imgSettings.model,
      'X-IMG-BaseURL': provider?.baseURL || '',
    };
  },

  getVidConfigHeaders: (): Record<string, string> => {
    const { vidSettings } = get();
    if (!vidSettings.apiKey) return {};
    const provider = VID_PROVIDERS.find((p) => p.id === vidSettings.provider);
    return {
      'X-VID-Provider': vidSettings.provider,
      'X-VID-ApiKey': vidSettings.apiKey,
      'X-VID-Model': vidSettings.model,
      'X-VID-BaseURL': provider?.baseURL || '',
    };
  },

  // ---- Media ----

  loadMedia: async (projectId) => {
    try {
      const media = await api.getProjectMedia(projectId);
      set({ projectMedia: media });
    } catch {
      set({ projectMedia: [] });
    }
  },

  // ---- Custom Background ----

  setCustomBackground: (dataUrl: string) => {
    saveBgImage(dataUrl);
    set({ customBackground: dataUrl });
  },

  clearCustomBackground: () => {
    saveBgImage(null);
    set({ customBackground: null });
  },
}));
