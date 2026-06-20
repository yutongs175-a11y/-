/**
 * MongoDB-backed storage layer — drop-in replacement for db.ts.
 * When MONGODB_URI env var is set, server/index.ts uses this instead of db.ts.
 * Same function signatures as db.ts — just swap the import.
 */

import { MongoClient, Collection, ObjectId, type WithId } from 'mongodb';

// ── Types (same as db.ts) ─────────────────────────────────────────────────

export interface Project {
  _id?: ObjectId;
  id: string;
  title: string;
  genre: string;
  logline: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ModuleContent {
  _id?: ObjectId;
  id: string;
  project_id: string;
  module_type: string;
  content: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  _id?: ObjectId;
  id: string;
  project_id: string;
  module_type: string;
  role: string;
  content: string;
  created_at: string;
}

export interface MediaItem {
  _id?: ObjectId;
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

// ── Singleton ────────────────────────────────────────────────────────────────

let client: MongoClient | null = null;
let db: any = null;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  if (client) return;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  console.log('[MongoDB] Connected to Atlas');
}

export function getProjectsCollection(): Collection<Project> {
  return db.collection<Project>('projects');
}
export function getModuleContentCollection(): Collection<ModuleContent> {
  return db.collection<ModuleContent>('module_content');
}
export function getChatMessagesCollection(): Collection<ChatMessage> {
  return db.collection<ChatMessage>('chat_messages');
}
export function getMediaCollection(): Collection<MediaItem> {
  return db.collection<MediaItem>('media');
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const now = () => new Date().toISOString();

function toObj<T extends { id: string }>(doc: WithId<T> | null): T | undefined {
  if (!doc) return undefined;
  const { _id, ...rest } = doc as any;
  return rest as T;
}

function toObjArray<T extends { id: string }>(docs: WithId<T>[]): T[] {
  return docs.map((doc) => {
    const { _id, ...rest } = doc as any;
    return rest as T;
  });
}

// ── Project CRUD ─────────────────────────────────────────────────────────────

export async function createProject(
  title: string,
  genre: string = '',
  logline: string = ''
): Promise<Project> {
  const project: Project = {
    id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    genre,
    logline,
    status: 'active',
    created_at: now(),
    updated_at: now(),
  };
  await getProjectsCollection().insertOne(project as any);
  return project;
}

export async function getProjects(): Promise<Project[]> {
  const docs = await getProjectsCollection()
    .find({ status: 'active' })
    .sort({ updated_at: -1 })
    .toArray();
  return toObjArray(docs);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const doc = await getProjectsCollection().findOne({ id });
  return toObj(doc);
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, 'title' | 'genre' | 'logline'>>
): Promise<void> {
  const $set: any = { updated_at: now() };
  if (updates.title !== undefined) $set.title = updates.title;
  if (updates.genre !== undefined) $set.genre = updates.genre;
  if (updates.logline !== undefined) $set.logline = updates.logline;
  await getProjectsCollection().updateOne({ id }, { $set });
}

export async function deleteProject(id: string): Promise<void> {
  await getProjectsCollection().updateOne({ id }, { $set: { status: 'deleted' } });
  // Also delete related data
  await getModuleContentCollection().deleteMany({ project_id: id });
  await getChatMessagesCollection().deleteMany({ project_id: id });
  await getMediaCollection().deleteMany({ project_id: id });
}

// ── Module Content ──────────────────────────────────────────────────────────

export async function getModuleContent(
  projectId: string,
  moduleType: string
): Promise<ModuleContent | undefined> {
  const doc = await getModuleContentCollection().findOne({
    project_id: projectId,
    module_type: moduleType,
  });
  return toObj(doc);
}

export async function getAllModuleContent(
  projectId: string
): Promise<ModuleContent[]> {
  const docs = await getModuleContentCollection()
    .find({ project_id: projectId })
    .toArray();
  return toObjArray(docs);
}

export async function upsertModuleContent(
  projectId: string,
  moduleType: string,
  content: string,
  metadata: string = '{}'
): Promise<void> {
  const existing = await getModuleContentCollection().findOne({
    project_id: projectId,
    module_type: moduleType,
  });

  if (existing) {
    await getModuleContentCollection().updateOne(
      { project_id: projectId, module_type: moduleType },
      { $set: { content, metadata, updated_at: now() } }
    );
  } else {
    await getModuleContentCollection().insertOne({
      id: `mc_${projectId}_${moduleType}`,
      project_id: projectId,
      module_type: moduleType,
      content,
      metadata,
      created_at: now(),
      updated_at: now(),
    } as any);
  }

  // Update project timestamp
  await getProjectsCollection().updateOne(
    { id: projectId },
    { $set: { updated_at: now() } }
  );
}

// ── Chat Messages ────────────────────────────────────────────────────────────

export async function getChatMessages(
  projectId: string,
  moduleType: string
): Promise<ChatMessage[]> {
  const docs = await getChatMessagesCollection()
    .find({ project_id: projectId, module_type: moduleType })
    .sort({ created_at: 1 })
    .toArray();
  return toObjArray(docs);
}

export async function addChatMessage(
  projectId: string,
  moduleType: string,
  role: string,
  content: string
): Promise<ChatMessage> {
  const msg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    project_id: projectId,
    module_type: moduleType,
    role,
    content,
    created_at: now(),
  };
  await getChatMessagesCollection().insertOne(msg as any);
  return msg;
}

export async function clearChatMessages(
  projectId: string,
  moduleType: string
): Promise<void> {
  await getChatMessagesCollection().deleteMany({
    project_id: projectId,
    module_type: moduleType,
  });
}

// ── Media (Images / Videos) ────────────────────────────────────────────────

export async function addMedia(
  projectId: string,
  sceneNum: string,
  type: string,
  filePath: string,
  prompt: string,
  provider: string,
  metadata: string = '{}'
): Promise<MediaItem> {
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
  await getMediaCollection().insertOne(item as any);
  return item;
}

export async function getProjectMedia(projectId: string): Promise<MediaItem[]> {
  const docs = await getMediaCollection()
    .find({ project_id: projectId })
    .sort({ created_at: 1 })
    .toArray();
  return toObjArray(docs);
}

export async function getSceneMedia(
  projectId: string,
  sceneNum: string,
  type?: string
): Promise<MediaItem[]> {
  const query: any = { project_id: projectId, scene_num: sceneNum };
  if (type) query.type = type;
  const docs = await getMediaCollection()
    .find(query)
    .sort({ created_at: -1 })
    .toArray();
  return toObjArray(docs);
}

export async function getLatestSceneImage(
  projectId: string,
  sceneNum: string
): Promise<MediaItem | undefined> {
  const results = await getSceneMedia(projectId, sceneNum, 'image');
  return results[0];
}

export async function getLatestSceneVideo(
  projectId: string,
  sceneNum: string
): Promise<MediaItem | undefined> {
  const results = await getSceneMedia(projectId, sceneNum, 'video');
  return results[0];
}

export async function getMediaById(id: string): Promise<MediaItem | undefined> {
  const doc = await getMediaCollection().findOne({ id });
  return toObj(doc);
}

export async function deleteMedia(id: string): Promise<void> {
  await getMediaCollection().deleteOne({ id });
}

export async function deleteProjectMedia(projectId: string): Promise<void> {
  await getMediaCollection().deleteMany({ project_id: projectId });
}
