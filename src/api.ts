import type { Project, ModuleType, ModuleContent, ChatMessage, ModuleConfig, MediaItem, VideoGenOptions, ImageGenOptions, SceneData } from './types';

const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// ===== AI Config (injected at call time) =====
let _getAIHeaders: () => Record<string, string> = () => ({});
let _getImgHeaders: () => Record<string, string> = () => ({});
let _getVidHeaders: () => Record<string, string> = () => ({});

export function setAIHeadersProvider(fn: () => Record<string, string>) {
  _getAIHeaders = fn;
}
export function setImgHeadersProvider(fn: () => Record<string, string>) {
  _getImgHeaders = fn;
}
export function setVidHeadersProvider(fn: () => Record<string, string>) {
  _getVidHeaders = fn;
}

// ===== Projects =====
export const api = {
  getProjects: () => fetchJSON<Project[]>(`${BASE}/projects`),

  createProject: (title: string, genre?: string, logline?: string) =>
    fetchJSON<Project>(`${BASE}/projects`, {
      method: 'POST',
      body: JSON.stringify({ title, genre, logline }),
    }),

  getProject: (id: string) => fetchJSON<Project>(`${BASE}/projects/${id}`),

  updateProject: (id: string, updates: Partial<Pick<Project, 'title' | 'genre' | 'logline'>>) =>
    fetchJSON<{ success: boolean }>(`${BASE}/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteProject: (id: string) =>
    fetchJSON<{ success: boolean }>(`${BASE}/projects/${id}`, { method: 'DELETE' }),

  // ===== Modules =====
  getModules: () => fetchJSON<ModuleConfig[]>(`${BASE}/modules`),

  getModuleContent: (projectId: string, moduleType: ModuleType) =>
    fetchJSON<ModuleContent>(`${BASE}/projects/${projectId}/modules/${moduleType}/content`),

  saveModuleContent: (projectId: string, moduleType: ModuleType, content: string, metadata?: string) =>
    fetchJSON<{ success: boolean }>(`${BASE}/projects/${projectId}/modules/${moduleType}/content`, {
      method: 'PUT',
      body: JSON.stringify({ content, metadata: metadata || '{}' }),
    }),

  getAllModuleContent: (projectId: string) =>
    fetchJSON<Record<string, ModuleContent>>(`${BASE}/projects/${projectId}/modules`),

  // ===== Chat =====
  getMessages: (projectId: string, moduleType: ModuleType) =>
    fetchJSON<ChatMessage[]>(`${BASE}/projects/${projectId}/modules/${moduleType}/messages`),

  clearMessages: (projectId: string, moduleType: ModuleType) =>
    fetchJSON<{ success: boolean }>(`${BASE}/projects/${projectId}/modules/${moduleType}/messages`, {
      method: 'DELETE',
    }),

  // ===== SSE Chat Stream =====
  chatStream: (
    projectId: string,
    moduleType: ModuleType,
    prompt: string,
    handlers: {
      onDelta: (text: string) => void;
      onToolCall?: (name: string, input: any) => void;
      onDone?: (data: any) => void;
      onError?: (message: string) => void;
    }
  ): AbortController => {
    const controller = new AbortController();
    const url = `${BASE}/projects/${projectId}/modules/${moduleType}/chat?prompt=${encodeURIComponent(prompt)}`;
    const aiHeaders = _getAIHeaders();

    fetch(url, {
      signal: controller.signal,
      headers: { ...aiHeaders },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Stream failed' }));
          handlers.onError?.(err.error);
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7);
            } else if (line.startsWith('data: ') && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6));
                if (currentEvent === 'delta') handlers.onDelta(data.text);
                else if (currentEvent === 'tool_call') handlers.onToolCall?.(data.name, data.input);
                else if (currentEvent === 'done') handlers.onDone?.(data);
                else if (currentEvent === 'error') handlers.onError?.(data.message);
              } catch {}
              currentEvent = '';
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          handlers.onError?.(err.message || 'Connection failed');
        }
      });

    return controller;
  },

  // ===== Image Generation =====
  generateImage: async (
    projectId: string,
    sceneNum: string,
    sceneData: Partial<SceneData>,
    options?: Partial<ImageGenOptions>,
  ): Promise<{ success: boolean; mediaId: string; url: string; prompt: string }> => {
    const imgHeaders = _getImgHeaders();
    return fetchJSON(`${BASE}/projects/${projectId}/scenes/${sceneNum}/image`, {
      method: 'POST',
      headers: { ...imgHeaders },
      body: JSON.stringify({ sceneData, options: options || {} }),
    });
  },

  // ===== Video Generation (SSE with polling) =====
  generateVideo: (
    projectId: string,
    sceneNum: string,
    sceneData: Partial<SceneData>,
    options: VideoGenOptions,
    handlers: {
      onProgress?: (stage: string, message: string, attempt?: number) => void;
      onDone?: (data: { mediaId: string; url: string; prompt: string }) => void;
      onError?: (message: string) => void;
    },
  ): AbortController => {
    const controller = new AbortController();
    const url = `${BASE}/projects/${projectId}/scenes/${sceneNum}/video`;
    const vidHeaders = _getVidHeaders();

    fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...vidHeaders,
      },
      body: JSON.stringify({ sceneData, options: { ...options, customPrompt: (options as any)?.customPrompt || '' } }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Request failed' }));
          handlers.onError?.(err.error);
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7);
            } else if (line.startsWith('data: ') && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6));
                if (currentEvent === 'progress') {
                  handlers.onProgress?.(data.stage, data.message, data.attempt);
                } else if (currentEvent === 'done') {
                  handlers.onDone?.(data);
                } else if (currentEvent === 'error') {
                  handlers.onError?.(data.message);
                }
              } catch {}
              currentEvent = '';
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          handlers.onError?.(err.message || 'Connection failed');
        }
      });

    return controller;
  },

  // ===== Media =====
  getProjectMedia: (projectId: string) =>
    fetchJSON<MediaItem[]>(`${BASE}/projects/${projectId}/media`),

  deleteMedia: (mediaId: string) =>
    fetchJSON<{ success: boolean }>(`${BASE}/media/${mediaId}`, { method: 'DELETE' }),
};
