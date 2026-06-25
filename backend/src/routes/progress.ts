import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { trainerProfileId, studentProfileId, studentBelongsToTrainer } from '../lib/profiles.js';

export const progressRouter = Router();

progressRouter.use(authenticate);

// Resolve o studentId alvo conforme o papel e valida a permissão de acesso.
// O personal informa o aluno via query (?studentId=) ou no corpo da requisição.
async function resolveStudentId(req: {
  user?: { userId: string; role: string };
  query: Record<string, unknown>;
  body?: Record<string, unknown>;
}): Promise<{ studentId: string } | { error: string; status: number }> {
  if (req.user!.role === 'STUDENT') {
    const id = await studentProfileId(req.user!.userId);
    return id ? { studentId: id } : { error: 'Perfil de aluno não encontrado.', status: 404 };
  }
  const studentId = (req.query.studentId ?? req.body?.studentId) as string | undefined;
  if (!studentId) return { error: 'Informe studentId.', status: 400 };
  const trainerId = await trainerProfileId(req.user!.userId);
  if (!(await studentBelongsToTrainer(studentId, trainerId!))) {
    return { error: 'Aluno não encontrado.', status: 404 };
  }
  return { studentId };
}

// Lista os registros de evolução (mais recentes primeiro).
progressRouter.get('/', async (req, res) => {
  const resolved = await resolveStudentId(req);
  if ('error' in resolved) return res.status(resolved.status).json({ error: resolved.error });
  const entries = await prisma.progressEntry.findMany({
    where: { studentId: resolved.studentId },
    orderBy: { date: 'desc' },
  });
  res.json(entries);
});

const createProgressSchema = z.object({
  studentId: z.string().optional(), // ignorado para aluno (usa o próprio perfil)
  date: z.string().datetime().optional(),
  weightKg: z.number().positive().optional(),
  bodyFat: z.number().min(0).max(100).optional(),
  measurements: z.record(z.number()).optional(),
  notes: z.string().optional(),
});

// Cria um registro de evolução (aluno para si, ou personal para um aluno seu).
progressRouter.post('/', validateBody(createProgressSchema), async (req, res) => {
  const resolved = await resolveStudentId(req);
  if ('error' in resolved) return res.status(resolved.status).json({ error: resolved.error });
  const data = req.body as z.infer<typeof createProgressSchema>;

  const entry = await prisma.progressEntry.create({
    data: {
      studentId: resolved.studentId,
      date: data.date ? new Date(data.date) : undefined,
      weightKg: data.weightKg,
      bodyFat: data.bodyFat,
      measurements: data.measurements ? JSON.stringify(data.measurements) : undefined,
      notes: data.notes,
    },
  });
  res.status(201).json(entry);
});
