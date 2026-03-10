import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { UnauthorizedError, NotFoundError } from '../../shared/errors';
import { ValidationError } from '../../shared/errors';

function signToken(user: { id: string; email: string; name: string; isAdmin: boolean; dashscopeKey: string | null }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      dashscopeKey: user.dashscopeKey,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<{ token: string; user: object }> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ValidationError('Email already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { id: uuidv4(), name, email, passwordHash },
  });

  const token = signToken(user);
  return { token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } };
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: object }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedError('Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  const token = signToken(user);
  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, dashscopeKey: user.dashscopeKey },
  };
}

export async function getMe(userId: string): Promise<object> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User not found');
  return { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, dashscopeKey: user.dashscopeKey };
}

export async function updateDashscopeKey(userId: string, dashscopeKey: string): Promise<object> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { dashscopeKey },
  });
  return { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin, dashscopeKey: user.dashscopeKey };
}

export async function createInviteToken(): Promise<object> {
  const token = uuidv4().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invite = await prisma.inviteToken.create({
    data: { id: uuidv4(), token, expiresAt },
  });
  return invite;
}

export async function listInviteTokens(): Promise<object[]> {
  return prisma.inviteToken.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function seedAdminUser(): Promise<void> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return;

  const existing = await prisma.user.findUnique({ where: { email: env.ADMIN_EMAIL } });
  if (existing) return;

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  await prisma.user.create({
    data: {
      id: uuidv4(),
      email: env.ADMIN_EMAIL,
      name: 'Admin',
      passwordHash,
      isAdmin: true,
    },
  });
  console.log(`[seed] Admin user created: ${env.ADMIN_EMAIL}`);
}
