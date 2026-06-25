import type { NextFunction, Request, Response } from 'express';
import { verifyToken, type Role, type TokenPayload } from '../auth/jwt.js';

// Estende o Request do Express com o usuário autenticado.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente.' });
  }
  try {
    req.user = verifyToken(header.slice('Bearer '.length));
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado para este papel.' });
    }
    next();
  };
}
