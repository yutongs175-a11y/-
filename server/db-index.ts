/**
 * DB index — switches between JSON file storage (dev) and MongoDB (prod)
 * based on MONGODB_URI environment variable.
 *
 * Import from here instead of directly from db.ts or db-mongo.ts.
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── JSON file storage (dev / local) ────────────────────────────────
import {
  initDB as initJSON,
  getMediaDir as getMediaDirJSON,
  createProject as createProjectJSON,
  getProjects as getProjectsJSON,
  getProject as getProjectJSON,
  updateProject as updateProjectJSON,
  deleteProject as deleteProjectJSON,
  getModuleContent as getModuleContentJSON,
  getAllModuleContent as getAllModuleContentJSON,
  upsertModuleContent as upsertModuleContentJSON,
  getChatMessages as getChatMessagesJSON,
  addChatMessage as addChatMessageJSON,
  clearChatMessages as clearChatMessagesJSON,
  addMedia as addMediaJSON,
  getProjectMedia as getProjectMediaJSON,
  getSceneMedia as getSceneMediaJSON,
  getLatestSceneImage as getLatestSceneImageJSON,
  getLatestSceneVideo as getLatestSceneVideoJSON,
  getMediaById as getMediaByIdJSON,
  deleteMedia as deleteMediaJSON,
  deleteProjectMedia as deleteProjectMediaJSON,
} from './db.js';

// ── MongoDB storage (prod / Railway) ──────────────────────────────
import {
  connectDB,
  createProject as createProjectMongo,
  getProjects as getProjectsMongo,
  getProject as getProjectMongo,
  updateProject as updateProjectMongo,
  deleteProject as deleteProjectMongo,
  getModuleContent as getModuleContentMongo,
  getAllModuleContent as getAllModuleContentMongo,
  upsertModuleContent as upsertModuleContentMongo,
  getChatMessages as getChatMessagesMongo,
  addChatMessage as addChatMessageMongo,
  clearChatMessages as clearChatMessagesMongo,
  addMedia as addMediaMongo,
  getProjectMedia as getProjectMediaMongo,
  getSceneMedia as getSceneMediaMongo,
  getLatestSceneImage as getLatestSceneImageMongo,
  getLatestSceneVideo as getLatestSceneVideoMongo,
  getMediaById as getMediaByIdMongo,
  deleteMedia as deleteMediaMongo,
  deleteProjectMedia as deleteProjectMediaMongo,
} from './db-mongo.js';

const useMongo = !!process.env.MONGODB_URI;

// ── Init ────────────────────────────────────────────────────────────
export async function initDB(): Promise<void> {
  if (useMongo) {
    await connectDB();
    // Ensure media directory exists on this server
    const mediaDir = path.join(__dirname, '..', 'data', 'media');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
  } else {
    initJSON();
  }
}

export function getMediaDir(): string {
  if (useMongo) {
    // When using MongoDB, media files are stored locally on the server
    // (or use Cloudinary in production for persistence)
    return path.join(__dirname, '..', 'data', 'media');
  }
  // Delegate to JSON db's getMediaDir
  return getMediaDirJSON();
}

// ── Project CRUD ─────────────────────────────────────────────────────
export const createProject = useMongo ? createProjectMongo : createProjectJSON;
export const getProjects = useMongo ? getProjectsMongo : getProjectsJSON;
export const getProject = useMongo ? getProjectMongo : getProjectJSON;
export const updateProject = useMongo ? updateProjectMongo : updateProjectJSON;
export const deleteProject = useMongo ? deleteProjectMongo : deleteProjectJSON;

// ── Module Content ─────────────────────────────────────────────────
export const getModuleContent = useMongo ? getModuleContentMongo : getModuleContentJSON;
export const getAllModuleContent = useMongo ? getAllModuleContentMongo : getAllModuleContentJSON;
export const upsertModuleContent = useMongo ? upsertModuleContentMongo : upsertModuleContentJSON;

// ── Chat Messages ──────────────────────────────────────────────────
export const getChatMessages = useMongo ? getChatMessagesMongo : getChatMessagesJSON;
export const addChatMessage = useMongo ? addChatMessageMongo : addChatMessageJSON;
export const clearChatMessages = useMongo ? clearChatMessagesMongo : clearChatMessagesJSON;

// ── Media ──────────────────────────────────────────────────────────
export const addMedia = useMongo ? addMediaMongo : addMediaJSON;
export const getProjectMedia = useMongo ? getProjectMediaMongo : getProjectMediaJSON;
export const getSceneMedia = useMongo ? getSceneMediaMongo : getSceneMediaJSON;
export const getLatestSceneImage = useMongo ? getLatestSceneImageMongo : getLatestSceneImageJSON;
export const getLatestSceneVideo = useMongo ? getLatestSceneVideoMongo : getLatestSceneVideoJSON;
export const getMediaById = useMongo ? getMediaByIdMongo : getMediaByIdJSON;
export const deleteMedia = useMongo ? deleteMediaMongo : deleteMediaJSON;
export const deleteProjectMedia = useMongo ? deleteProjectMediaMongo : deleteProjectMediaJSON;
