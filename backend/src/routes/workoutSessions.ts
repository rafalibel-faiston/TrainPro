import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { trainerProfileId, studentProfileId, studentBelongsToTrainer } from '../lib/profiles.js';

export const workoutSessionsRouter = Router();

workoutSessionsRouter.use(authenticate);

const sessionInclude = {
  sets: { orderBy: { order: 'asc' } },
  workout: { select: { id: true, name: true } },
} as const;

// Lista sessões de treino: aluno vê as suas; personal vê as de um aluno (?studentId=).
workoutSessionsRouter.get('/', async (req, res) => {
  if (req.user!.role === 'STUDENT') {
    const studentId = await studentProfileId(req.user!.userId);
    const sessions = await prisma.workoutSession.findMany({
      where: { studentId: studentId! },
      include: sessionInclude,
      orderBy: { startedAt: 'desc' },
    });
    return res.json(sessions);
  }

  const trainerId = await trainerProfileId(req.user!.userId);
  const studentId = req.query.studentId as string | undefined;
  if (!studentId) return res.status(400).json({ error: 'Informe studentId.' });
  if (!(await studentBelongsToTrainer(studentId, trainerId!))) {
    return res.status(404).json({ error: 'Aluno não encontrado.' });
  }
  const sessions = await prisma.workoutSession.findMany({
    where: { studentId },
    include: sessionInclude,
    orderBy: { startedAt: 'desc' },
  });
  res.json(sessions);
});

const createSchema = z.object({
  workoutId: z.string(),
  durationSec: z.number().int().nonnegative().default(0),
  sets: z
    .array(
      z.object({
        exerciseName: z.string().min(1),
        setNumber: z.number().int().positive(),
        weightKg: z.number().nonnegative().optional(),
        reps: z.number().int().nonnegative().optional(),
        done: z.boolean().default(true),
        order: z.number().int().nonnegative().default(0),
      }),
    )
    .default([]),
});

// O aluno registra uma sessão concluída de um treino seu.
workoutSessionsRouter.post('/', validateBody(createSchema), async (req, res) => {
  if (req.user!.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Apenas o aluno registra a sessão de treino.' });
  }
  const studentId = await studentProfileId(req.user!.userId);
  const data = req.body as z.infer<typeof createSchema>;

  const workout = await prisma.workout.findFirst({
    where: { id: data.workoutId, studentId: studentId! },
    select: { id: true },
  });
  if (!workout) return res.status(404).json({ error: 'Treino não encontrado.' });

  const session = await prisma.workoutSession.create({
    data: {
      workoutId: data.workoutId,
      studentId: studentId!,
      durationSec: data.durationSec,
      sets: { create: data.sets },
    },
    include: { sets: { orderBy: { order: 'asc' } } },
  });
  res.status(201).json(session);
});
