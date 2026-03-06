import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../shared/errors';

export interface SenderProfile {
  id: string;
  userId: string;
  name: string;
  title: string;
  company: string;
  role: 'HR' | 'INTERVIEWER' | 'EXECUTIVE' | 'REFERRAL' | 'CUSTOM';
  signature: string;
  personalNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function listProfiles(userId: string): Promise<SenderProfile[]> {
  return prisma.profile.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  }) as Promise<SenderProfile[]>;
}

export async function createProfile(
  userId: string,
  data: Omit<SenderProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<SenderProfile> {
  return prisma.profile.create({
    data: { ...data, userId },
  }) as Promise<SenderProfile>;
}

export async function updateProfile(
  id: string,
  userId: string,
  data: Partial<Omit<SenderProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<SenderProfile> {
  const existing = await prisma.profile.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError(`Profile ${id} not found`);
  return prisma.profile.update({
    where: { id },
    data,
  }) as Promise<SenderProfile>;
}

export async function deleteProfile(id: string, userId: string): Promise<void> {
  const existing = await prisma.profile.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError(`Profile ${id} not found`);
  await prisma.profile.delete({ where: { id } });
}

export async function getProfileById(id: string, userId: string): Promise<SenderProfile> {
  const profile = await prisma.profile.findFirst({ where: { id, userId } });
  if (!profile) throw new NotFoundError(`Profile ${id} not found`);
  return profile as SenderProfile;
}
