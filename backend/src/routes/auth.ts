import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { signToken, type Role } from '../auth/jwt.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['TRAINER', 'STUDENT']),
  phone: z.string().optional(),
});

authRouter.post('/register', validateBody(registerSchema), async (req, res) => {
  const { name, email, password, role, phone } = req.body as z.infer<typeof registerSchema>;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'E-mail já cadastrado.' });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role,
      phone,
      // Cria o perfil correspondente ao papel.
      ...(role === 'TRAINER'
        ? { trainerProfile: { create: {} } }
        : { studentProfile: { create: {} } }),
    },
  });

  const token = signToken({ userId: user.id, role: user.role as Role });
  res.status(201).json({ token, user: publicUser(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post('/login', validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }

  const token = signToken({ userId: user.id, role: user.role as Role });
  res.json({ token, user: publicUser(user) });
});

authRouter.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { trainerProfile: true, studentProfile: true },
  });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json({ user: publicUser(user) });
});

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  };
}
