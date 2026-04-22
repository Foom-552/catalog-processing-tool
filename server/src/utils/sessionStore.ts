import * as fs from 'fs';
import { SessionData } from '../types/catalog';

const store = new Map<string, SessionData>();
const TTL_MS = Math.max(5, parseInt(process.env.SESSION_TTL_MINUTES ?? '30', 10)) * 60 * 1000;

function unlinkFile(filePath: string | undefined): void {
  if (filePath) fs.unlink(filePath, () => {});
}

export function setSession(id: string, data: SessionData): void {
  store.set(id, data);
}

export function getSession(id: string): SessionData | undefined {
  return store.get(id);
}

export function deleteSession(id: string): void {
  const session = store.get(id);
  if (session) {
    unlinkFile(session.filePath);
    store.delete(id);
  }
}

export function updateSession(id: string, updates: Partial<SessionData>): void {
  const existing = store.get(id);
  if (existing) {
    store.set(id, { ...existing, ...updates });
  }
}

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of store.entries()) {
    if (now - data.createdAt > TTL_MS) {
      unlinkFile(data.filePath);
      store.delete(id);
    }
  }
}, 5 * 60 * 1000);
