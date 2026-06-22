import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { signToken, type Role } from '../auth/jwt.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { ensureInviteCode, studentProfileId } from '../lib/profiles.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['TRAINER', 'STUDENT']),
  phone: z.string().optional(),
  // Aluno pode já entrar vinculado ao personal informando o código de convite.
  inviteCode: z.string().optional(),
});

authRouter.post('/register', validateBody(registerSchema), async (req, res) => {
  const { name, email, password, role, phone, inviteCode } = req.body as z.infer<
    typeof registerSchema
  >;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'E-mail já cadastrado.' });
  }

  // Se o aluno informou um código, valida antes de criar a conta.
  let trainerId: string | undefined;
  if (role === 'STUDENT' && inviteCode) {
    const trainer = await prisma.trainerProfile.findUnique({
      where: { inviteCode: inviteCode.trim().toUpperCase() },
    });
    if (!trainer) return res.status(404).json({ error: 'Código de personal inválido.' });
    trainerId = trainer.id;
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
        : { studentProfile: { create: { trainerId } } }),
    },
    include: { trainerProfile: true },
  });

  // Já gera o código de convite do personal no cadastro.
  if (role === 'TRAINER' && user.trainerProfile) {
    await ensureInviteCode(user.trainerProfile.id);
  }

  const token = signToken({ userId: user.id, role: user.role as Role });
  res.status(201).json({ token, user: publicUser(user) });
});

// Aluno já cadastrado se vincula a um personal informando o código de convite.
const joinSchema = z.object({ inviteCode: z.string().min(1) });
authRouter.post('/join', authenticate, validateBody(joinSchema), async (req, res) => {
  if (req.user!.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Apenas alunos podem usar um código de convite.' });
  }
  const studentId = await studentProfileId(req.user!.userId);
  if (!studentId) return res.status(404).json({ error: 'Perfil de aluno não encontrado.' });

  const code = (req.body as z.infer<typeof joinSchema>).inviteCode.trim().toUpperCase();
  const trainer = await prisma.trainerProfile.findUnique({ where: { inviteCode: code } });
  if (!trainer) return res.status(404).json({ error: 'Código de personal inválido.' });

  await prisma.studentProfile.update({
    where: { id: studentId },
    data: { trainerId: trainer.id },
  });
  res.json({ ok: true });
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
    include: {
      trainerProfile: true,
      studentProfile: { include: { trainer: { include: { user: { select: { name: true } } } } } },
    },
  });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  // Para o aluno, informa o personal vinculado (se houver).
  const trainer = user.studentProfile?.trainer
    ? { id: user.studentProfile.trainer.id, name: user.studentProfile.trainer.user.name }
    : null;

  res.json({ user: { ...publicUser(user), trainer } });
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
