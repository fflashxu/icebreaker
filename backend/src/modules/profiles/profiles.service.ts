import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { NotFoundError } from '../../shared/errors';

const DATA_FILE = path.join(env.DATA_DIR, 'profiles.json');

export interface SenderProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  role: 'HR' | 'INTERVIEWER' | 'EXECUTIVE' | 'REFERRAL' | 'CUSTOM';
  signature: string;
  personalNote?: string;
  createdAt: string;
  updatedAt: string;
}

function readProfiles(): SenderProfile[] {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeProfiles(profiles: SenderProfile[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
}

export function listProfiles(): SenderProfile[] {
  return readProfiles();
}

export function createProfile(data: Omit<SenderProfile, 'id' | 'createdAt' | 'updatedAt'>): SenderProfile {
  const profiles = readProfiles();
  const now = new Date().toISOString();
  const profile: SenderProfile = {
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  profiles.push(profile);
  writeProfiles(profiles);
  return profile;
}

export function updateProfile(id: string, data: Partial<Omit<SenderProfile, 'id' | 'createdAt' | 'updatedAt'>>): SenderProfile {
  const profiles = readProfiles();
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) throw new NotFoundError(`Profile ${id} not found`);
  profiles[idx] = { ...profiles[idx], ...data, updatedAt: new Date().toISOString() };
  writeProfiles(profiles);
  return profiles[idx];
}

export function deleteProfile(id: string): void {
  const profiles = readProfiles();
  const idx = profiles.findIndex((p) => p.id === id);
  if (idx === -1) throw new NotFoundError(`Profile ${id} not found`);
  profiles.splice(idx, 1);
  writeProfiles(profiles);
}

export function getProfileById(id: string): SenderProfile {
  const profiles = readProfiles();
  const profile = profiles.find((p) => p.id === id);
  if (!profile) throw new NotFoundError(`Profile ${id} not found`);
  return profile;
}
