import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { trainerProfileId, studentProfileId, studentBelongsToTrainer } from '../lib/profiles.js';

export const workoutsRouter = Router();

workoutsRouter.use(authenticate);

const exerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.number().int().positive().default(3),
  reps: z.string().default('12'),
  weightKg: z.number().nonnegative().optional(),
  restSeconds: z.number().int().nonnegative().optional(),
  order: z.number().int().nonnegative().default(0),
});

const createWorkoutSchema = z.object({
  studentId: z.string(),
  name: z.string().min(1),
  notes: z.string().optional(),
  exercises: z.array(exerciseSchema).default([]),
});

// Lista treinos: personal vê os dos seus alunos (filtrável por ?studentId);
// aluno vê apenas os seus.
workoutsRouter.get('/', async (req, res) => {
  if (req.user!.role === 'STUDENT') {
    const studentId = await studentProfileId(req.user!.userId);
    const workouts = await prisma.workout.findMany({
      where: { studentId: studentId! },
      include: { exercises: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(workouts);
  }

  const trainerId = await trainerProfileId(req.user!.userId);
  const studentId = req.query.studentId as string | undefined;
  const workouts = await prisma.workout.findMany({
    where: { trainerId: trainerId!, ...(studentId ? { studentId } : {}) },
    include: { exercises: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(workouts);
});

// Cria um treino para um aluno (apenas personal).
workoutsRouter.post('/', validateBody(createWorkoutSchema), async (req, res) => {
  if (req.user!.role !== 'TRAINER') {
    return res.status(403).json({ error: 'Apenas o personal pode criar treinos.' });
  }
  const trainerId = await trainerProfileId(req.user!.userId);
  const data = req.body as z.infer<typeof createWorkoutSchema>;

  if (!(await studentBelongsToTrainer(data.studentId, trainerId!))) {
    return res.status(404).json({ error: 'Aluno não encontrado.' });
  }

  const workout = await prisma.workout.create({
    data: {
      name: data.name,
      notes: data.notes,
      studentId: data.studentId,
      trainerId,
      exercises: { create: data.exercises },
    },
    include: { exercises: { orderBy: { order: 'asc' } } },
  });
  res.status(201).json(workout);
});

// Atualiza um treino (substitui exercícios).
workoutsRouter.put('/:id', validateBody(createWorkoutSchema.partial()), async (req, res) => {
  if (req.user!.role !== 'TRAINER') {
    return res.status(403).json({ error: 'Apenas o personal pode editar treinos.' });
  }
  const trainerId = await trainerProfileId(req.user!.userId);
  const workout = await prisma.workout.findFirst({
    where: { id: req.params.id, trainerId: trainerId! },
  });
  if (!workout) return res.status(404).json({ error: 'Treino não encontrado.' });

  const data = req.body as Partial<z.infer<typeof createWorkoutSchema>>;
  const updated = await prisma.workout.update({
    where: { id: workout.id },
    data: {
      name: data.name,
      notes: data.notes,
      ...(data.exercises
        ? { exercises: { deleteMany: {}, create: data.exercises } }
        : {}),
    },
    include: { exercises: { orderBy: { order: 'asc' } } },
  });
  res.json(updated);
});

// Remove um treino.
workoutsRouter.delete('/:id', async (req, res) => {
  if (req.user!.role !== 'TRAINER') {
    return res.status(403).json({ error: 'Apenas o personal pode remover treinos.' });
  }
  const trainerId = await trainerProfileId(req.user!.userId);
  const workout = await prisma.workout.findFirst({
    where: { id: req.params.id, trainerId: trainerId! },
  });
  if (!workout) return res.status(404).json({ error: 'Treino não encontrado.' });
  await prisma.workout.delete({ where: { id: workout.id } });
  res.status(204).end();
});

// --- Check-ins (registro de execução do treino pelo aluno) ---

// Confere se o usuário pode acessar o treino e devolve o treino com o studentId.
async function workoutForUser(workoutId: string, user: { userId: string; role: string }) {
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: { exercises: { orderBy: { order: 'asc' } } },
  });
  if (!workout) return null;
  if (user.role === 'STUDENT') {
    const studentId = await studentProfileId(user.userId);
    return workout.studentId === studentId ? workout : null;
  }
  const trainerId = await trainerProfileId(user.userId);
  if (!(await studentBelongsToTrainer(workout.studentId, trainerId!))) return null;
  return workout;
}

// Histórico de check-ins de um treino.
workoutsRouter.get('/:id/logs', async (req, res) => {
  const workout = await workoutForUser(req.params.id, req.user!);
  if (!workout) return res.status(404).json({ error: 'Treino não encontrado.' });
  const logs = await prisma.workoutLog.findMany({
    where: { workoutId: workout.id },
    include: { entries: { orderBy: { order: 'asc' } } },
    orderBy: { date: 'desc' },
  });
  res.json(logs);
});

const logEntrySchema = z.object({
  exerciseName: z.string().min(1),
  setsDone: z.number().int().nonnegative().optional(),
  repsDone: z.string().optional(),
  weightKg: z.number().nonnegative().optional(),
  done: z.boolean().default(true),
  order: z.number().int().nonnegative().default(0),
});

const createLogSchema = z.object({
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
  entries: z.array(logEntrySchema).default([]),
});

// Aluno registra um check-in (treino feito + cargas executadas).
workoutsRouter.post('/:id/logs', validateBody(createLogSchema), async (req, res) => {
  if (req.user!.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Apenas o aluno faz check-in do treino.' });
  }
  const workout = await workoutForUser(req.params.id, req.user!);
  if (!workout) return res.status(404).json({ error: 'Treino não encontrado.' });
  const studentId = await studentProfileId(req.user!.userId);
  const data = req.body as z.infer<typeof createLogSchema>;

  const log = await prisma.workoutLog.create({
    data: {
      workoutId: workout.id,
      studentId: studentId!,
      date: data.date ? new Date(data.date) : undefined,
      notes: data.notes,
      entries: { create: data.entries },
    },
    include: { entries: { orderBy: { order: 'asc' } } },
  });
  res.status(201).json(log);
});
