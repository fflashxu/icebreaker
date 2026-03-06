import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../shared/errors';
import { prisma } from '../lib/prisma';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  dashscopeKey: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing authorization token'));
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return next(new UnauthorizedError('User not found'));

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      dashscopeKey: user.dashscopeKey,
    };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
