import fs from "fs";
import path from "path";
import os from "os";
import { encryptToken, decryptToken } from "./crypto";

// On Vercel / serverless runtimes, root directories are read-only (/var/task).
// Only /tmp is writable.
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "podloom_data")
  : path.join(process.cwd(), "data");

const USERS_FILE = path.join(DATA_DIR, "users.json");
const EPISODES_FILE = path.join(DATA_DIR, "episodes.json");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");

function ensureDirectoryExistence() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, defaultVal: T): T {
  ensureDirectoryExistence();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
    return defaultVal;
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Failed to read JSON at ${filePath}:`, err);
    return defaultVal;
  }
}

function writeJsonFile<T>(filePath: string, data: T) {
  ensureDirectoryExistence();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export interface UserRecord {
  id: string; // userId or anonymous cookie id
  bufferAccessTokenEncrypted?: string;
  bufferRefreshTokenEncrypted?: string;
  bufferTokenExpiresAt?: number;
  bufferOrganizationId?: string;
  connectedAt?: string;
  isMockConnection?: boolean;
}

export interface SocialDraft {
  id: string;
  platform: "twitter" | "linkedin" | "instagram" | "threads" | "newsletter";
  platformName: string;
  title: string;
  content: string;
  characterLimit?: number;
  tags?: string[];
  keyMomentTimestamp?: string;
  recommendedChannelService?: string;
  status: "draft" | "queued" | "failed";
  bufferPostId?: string;
  error?: string;
}

export interface KeyMoment {
  id: string;
  title: string;
  timestamp: string;
  summary: string;
  quote: string;
}

export interface EpisodeRecord {
  id: string;
  userId: string;
  title: string;
  audioSourceType: "upload" | "url" | "sample";
  audioUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  status: "idle" | "downloading" | "transcribing" | "generating" | "completed" | "error";
  statusMessage?: string;
  progressPercent: number;
  transcript?: string;
  keyMoments: KeyMoment[];
  drafts: SocialDraft[];
  createdAt: string;
  updatedAt: string;
}

export interface PostPublishRecord {
  id: string;
  userId: string;
  episodeId: string;
  draftId: string;
  channelId: string;
  channelName: string;
  channelService: string;
  mode: "addToQueue" | "saveToDraft" | "shareNow";
  text: string;
  bufferPostId?: string;
  status: "success" | "failed";
  errorMessage?: string;
  createdAt: string;
}

// User methods
export function getUser(userId: string): UserRecord | null {
  const users = readJsonFile<Record<string, UserRecord>>(USERS_FILE, {});
  return users[userId] || null;
}

export function saveUser(user: UserRecord): void {
  const users = readJsonFile<Record<string, UserRecord>>(USERS_FILE, {});
  users[user.id] = user;
  writeJsonFile(USERS_FILE, users);
}

export function getUserBufferToken(userId: string): string | null {
  const user = getUser(userId);
  if (!user || !user.bufferAccessTokenEncrypted) {
    // Check fallback env var for quick testing
    return process.env.BUFFER_ACCESS_TOKEN || null;
  }
  return decryptToken(user.bufferAccessTokenEncrypted);
}

export function setUserBufferToken(userId: string, token: string, orgId?: string, isMock: boolean = false): void {
  const user = getUser(userId) || { id: userId };
  user.bufferAccessTokenEncrypted = encryptToken(token);
  if (orgId) user.bufferOrganizationId = orgId;
  user.connectedAt = new Date().toISOString();
  user.isMockConnection = isMock;
  saveUser(user);
}

export function clearUserBufferToken(userId: string): void {
  const user = getUser(userId);
  if (user) {
    delete user.bufferAccessTokenEncrypted;
    delete user.bufferRefreshTokenEncrypted;
    delete user.bufferOrganizationId;
    saveUser(user);
  }
}

// Episode methods
export function getEpisodes(userId: string): EpisodeRecord[] {
  const all = readJsonFile<Record<string, EpisodeRecord>>(EPISODES_FILE, {});
  return Object.values(all)
    .filter((ep) => ep.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getEpisode(id: string, userId?: string): EpisodeRecord | null {
  const all = readJsonFile<Record<string, EpisodeRecord>>(EPISODES_FILE, {});
  const ep = all[id];
  if (!ep) return null;
  if (userId && ep.userId !== userId) return null; // isolate users' records
  return ep;
}

export function saveEpisode(episode: EpisodeRecord): void {
  const all = readJsonFile<Record<string, EpisodeRecord>>(EPISODES_FILE, {});
  episode.updatedAt = new Date().toISOString();
  all[episode.id] = episode;
  writeJsonFile(EPISODES_FILE, all);
}

// Publishing history methods
export function recordPostPublish(record: PostPublishRecord): void {
  const history = readJsonFile<PostPublishRecord[]>(POSTS_FILE, []);
  history.unshift(record);
  writeJsonFile(POSTS_FILE, history.slice(0, 100)); // retain last 100
}

export function getPublishHistory(userId: string): PostPublishRecord[] {
  const history = readJsonFile<PostPublishRecord[]>(POSTS_FILE, []);
  return history.filter((p) => p.userId === userId);
}
