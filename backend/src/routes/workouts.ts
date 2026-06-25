import { Router } from 'express';
import { z } from 'zod';
import { db as prisma } from '../db.js';
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
