import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { trainerProfileId, studentProfileId, studentBelongsToTrainer } from '../lib/profiles.js';

export const dietRouter = Router();

dietRouter.use(authenticate);

// Lista planos alimentares: aluno vê os seus; personal vê os de um aluno (?studentId=).
dietRouter.get('/', async (req, res) => {
  let studentId: string | null;
  if (req.user!.role === 'STUDENT') {
    studentId = await studentProfileId(req.user!.userId);
  } else {
    studentId = (req.query.studentId as string | undefined) ?? null;
    if (!studentId) return res.status(400).json({ error: 'Informe studentId.' });
    const trainerId = await trainerProfileId(req.user!.userId);
    if (!(await studentBelongsToTrainer(studentId, trainerId!))) {
      return res.status(404).json({ error: 'Aluno não encontrado.' });
    }
  }
  const plans = await prisma.dietPlan.findMany({
    where: { studentId: studentId! },
    include: { meals: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(plans);
});

const mealSchema = z.object({
  name: z.string().min(1),
  time: z.string().optional(),
  description: z.string().min(1),
  order: z.number().int().nonnegative().default(0),
});

const createDietSchema = z.object({
  studentId: z.string(),
  name: z.string().min(1),
  notes: z.string().optional(),
  meals: z.array(mealSchema).default([]),
});

// Personal cria um plano alimentar para um aluno seu.
dietRouter.post('/', validateBody(createDietSchema), async (req, res) => {
  if (req.user!.role !== 'TRAINER') {
    return res.status(403).json({ error: 'Apenas o personal monta a dieta.' });
  }
  const trainerId = await trainerProfileId(req.user!.userId);
  const data = req.body as z.infer<typeof createDietSchema>;

  if (!(await studentBelongsToTrainer(data.studentId, trainerId!))) {
    return res.status(404).json({ error: 'Aluno não encontrado.' });
  }

  const plan = await prisma.dietPlan.create({
    data: {
      name: data.name,
      notes: data.notes,
      studentId: data.studentId,
      trainerId,
      meals: { create: data.meals },
    },
    include: { meals: { orderBy: { order: 'asc' } } },
  });
  res.status(201).json(plan);
});

// Personal remove um plano alimentar de um aluno seu.
dietRouter.delete('/:id', async (req, res) => {
  if (req.user!.role !== 'TRAINER') {
    return res.status(403).json({ error: 'Apenas o personal pode remover a dieta.' });
  }
  const trainerId = await trainerProfileId(req.user!.userId);
  const plan = await prisma.dietPlan.findUnique({
    where: { id: req.params.id },
    select: { id: true, studentId: true },
  });
  if (!plan || !(await studentBelongsToTrainer(plan.studentId, trainerId!))) {
    return res.status(404).json({ error: 'Plano não encontrado.' });
  }
  await prisma.dietPlan.delete({ where: { id: plan.id } });
  res.status(204).end();
});
