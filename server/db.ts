/**
 * JSON-based storage layer — drop-in replacement for SQLite.
 * Uses simple JSON files for persistence. Same API as the SQLite version.
 * For production, swap back to better-sqlite3 or a real database.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'screenplay.json');
const MEDIA_DIR = path.join(DATA_DIR, 'media');

interface DBSchema {
  projects: Array<{
    id: string;
    title: string;
    genre: string;
    logline: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  module_content: Array<{
    id: string;
    project_id: string;
    module_type: string;
    content: string;
    metadata: string;
    created_at: string;
    updated_at: string;
  }>;
  chat_messages: Array<{
    id: string;
    project_id: string;
    module_type: string;
    role: string;
    content: string;
    created_at: string;
  }>;
  media: Array<{
    id: string;
    project_id: string;
    scene_num: string;
    type: string;
    file_path: string;
    prompt: string;
    provider: string;
    metadata: string;
    created_at: string;
  }>;
}

let db: DBSchema = { projects: [], module_content: [], chat_messages: [], media: [] };

export function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch {
      db = { projects: [], module_content: [], chat_messages: [], media: [] };
    }
  }
  if (!db.projects) db.projects = [];
  if (!db.module_content) db.module_content = [];
  if (!db.chat_messages) db.chat_messages = [];
  if (!db.media) db.media = [];
  save();
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function getMediaDir() {
  return MEDIA_DIR;
}

const now = () => new Date().toISOString();

// ===== Types =====
export interface Project {
  id: string;
  title: string;
  genre: string;
  logline: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ModuleContent {
  id: string;
  project_id: string;
  module_type: string;
  content: string;
  metadata: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  module_type: string;
  role: string;
  content: string;
  created_at: string;
}

export interface MediaItem {
  id: string;
  project_id: string;
  scene_num: string;
  type: string;
  file_path: string;
  prompt: string;
  provider: string;
  metadata: string;
  created_at: string;
}

// ===== Project CRUD =====

export function createProject(title: string, genre: string = '', logline: string = ''): Project {
  const project: Project = {
    id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title, genre, logline, status: 'active',
    created_at: now(), updated_at: now(),
  };
  db.projects.push(project);
  save();
  return project;
}

export function getProjects(): Project[] {
  return db.projects
    .filter((p) => p.status === 'active')
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function getProject(id: string): Project | undefined {
  return db.projects.find((p) => p.id === id);
}

export function updateProject(id: string, updates: Partial<Pick<Project, 'title' | 'genre' | 'logline'>>): void {
  const p = db.projects.find((p) => p.id === id);
  if (!p) return;
  if (updates.title !== undefined) p.title = updates.title;
  if (updates.genre !== undefined) p.genre = updates.genre;
  if (updates.logline !== undefined) p.logline = updates.logline;
  p.updated_at = now();
  save();
}

export function deleteProject(id: string): void {
  const p = db.projects.find((p) => p.id === id);
  if (p) { p.status = 'deleted'; save(); }
}

// ===== Module Content =====

export function getModuleContent(projectId: string, moduleType: string): ModuleContent | undefined {
  return db.module_content.find((mc) => mc.project_id === projectId && mc.module_type === moduleType);
}

export function getAllModuleContent(projectId: string): ModuleContent[] {
  return db.module_content.filter((mc) => mc.project_id === projectId);
}

export function upsertModuleContent(projectId: string, moduleType: string, content: string, metadata: string = '{}'): void {
  let mc = db.module_content.find((mc) => mc.project_id === projectId && mc.module_type === moduleType);
  if (mc) {
    mc.content = content;
    mc.metadata = metadata;
    mc.updated_at = now();
  } else {
    mc = {
      id: `mc_${projectId}_${moduleType}`,
      project_id: projectId,
      module_type: moduleType,
      content, metadata,
      created_at: now(), updated_at: now(),
    };
    db.module_content.push(mc);
  }
  // Update project timestamp
  const p = db.projects.find((p) => p.id === projectId);
  if (p) p.updated_at = now();
  save();
}

// ===== Chat Messages =====

export function getChatMessages(projectId: string, moduleType: string): ChatMessage[] {
  return db.chat_messages
    .filter((m) => m.project_id === projectId && m.module_type === moduleType)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function addChatMessage(projectId: string, moduleType: string, role: string, content: string): ChatMessage {
  const msg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    project_id: projectId,
    module_type: moduleType,
    role, content,
    created_at: now(),
  };
  db.chat_messages.push(msg);
  save();
  return msg;
}

export function clearChatMessages(projectId: string, moduleType: string): void {
  db.chat_messages = db.chat_messages.filter(
    (m) => !(m.project_id === projectId && m.module_type === moduleType)
  );
  save();
}

// ===== Media (Images / Videos) =====

export function addMedia(
  projectId: string,
  sceneNum: string,
  type: string,
  filePath: string,
  prompt: string,
  provider: string,
  metadata: string = '{}'
): MediaItem {
  const item: MediaItem = {
    id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    project_id: projectId,
    scene_num: sceneNum,
    type,
    file_path: filePath,
    prompt,
    provider,
    metadata,
    created_at: now(),
  };
  db.media.push(item);
  save();
  return item;
}

export function getProjectMedia(projectId: string): MediaItem[] {
  return db.media
    .filter((m) => m.project_id === projectId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function getSceneMedia(projectId: string, sceneNum: string, type?: string): MediaItem[] {
  return db.media
    .filter((m) =>
      m.project_id === projectId &&
      m.scene_num === sceneNum &&
      (!type || m.type === type)
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at)); // newest first
}

export function getLatestSceneImage(projectId: string, sceneNum: string): MediaItem | undefined {
  return getSceneMedia(projectId, sceneNum, 'image')[0];
}

export function getLatestSceneVideo(projectId: string, sceneNum: string): MediaItem | undefined {
  return getSceneMedia(projectId, sceneNum, 'video')[0];
}

export function getMediaById(id: string): MediaItem | undefined {
  return db.media.find((m) => m.id === id);
}

export function deleteMedia(id: string): void {
  const item = db.media.find((m) => m.id === id);
  if (item) {
    // Delete the file from disk
    const fullPath = path.join(MEDIA_DIR, item.file_path);
    try { fs.unlinkSync(fullPath); } catch {}
    db.media = db.media.filter((m) => m.id !== id);
    save();
  }
}

export function deleteProjectMedia(projectId: string): void {
  const items = db.media.filter((m) => m.project_id === projectId);
  for (const item of items) {
    const fullPath = path.join(MEDIA_DIR, item.file_path);
    try { fs.unlinkSync(fullPath); } catch {}
  }
  db.media = db.media.filter((m) => m.project_id !== projectId);
  save();
}

// ===== SDK Session Tracking (no-op in JSON store) =====

export function getSdkSession(_projectId: string, _moduleType: string): string | null {
  return null;
}

export function setSdkSession(_projectId: string, _moduleType: string, _sessionId: string | null): void {
  // no-op
}
