import { Router } from 'express';
import { z } from 'zod';
import { db as prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { trainerProfileId, studentProfileId, studentBelongsToTrainer } from '../lib/profiles.js';

export const appointmentsRouter = Router();

appointmentsRouter.use(authenticate);

// Lista a agenda: personal vê todas as suas sessões; aluno vê as suas.
appointmentsRouter.get('/', async (req, res) => {
  const include = {
    student: { include: { user: { select: { name: true } } } },
  };
  if (req.user!.role === 'STUDENT') {
    const studentId = await studentProfileId(req.user!.userId);
    const items = await prisma.appointment.findMany({
      where: { studentId: studentId! },
      orderBy: { startsAt: 'asc' },
      include,
    });
    return res.json(items);
  }
  const trainerId = await trainerProfileId(req.user!.userId);
  const items = await prisma.appointment.findMany({
    where: { trainerId: trainerId! },
    orderBy: { startsAt: 'asc' },
    include,
  });
  res.json(items);
});

const createSchema = z.object({
  studentId: z.string(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  notes: z.string().optional(),
});

// Personal agenda uma sessão com um aluno seu.
appointmentsRouter.post('/', validateBody(createSchema), async (req, res) => {
  if (req.user!.role !== 'TRAINER') {
    return res.status(403).json({ error: 'Apenas o personal pode agendar sessões.' });
  }
  const trainerId = await trainerProfileId(req.user!.userId);
  const data = req.body as z.infer<typeof createSchema>;
  if (!(await studentBelongsToTrainer(data.studentId, trainerId!))) {
    return res.status(404).json({ error: 'Aluno não encontrado.' });
  }
  const appointment = await prisma.appointment.create({
    data: {
      trainerId: trainerId!,
      studentId: data.studentId,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      notes: data.notes,
    },
  });
  res.status(201).json(appointment);
});

const updateSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELED']).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// Personal atualiza/cancela uma sessão.
appointmentsRouter.put('/:id', validateBody(updateSchema), async (req, res) => {
  if (req.user!.role !== 'TRAINER') {
    return res.status(403).json({ error: 'Apenas o personal pode alterar sessões.' });
  }
  const trainerId = await trainerProfileId(req.user!.userId);
  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, trainerId: trainerId! },
  });
  if (!existing) return res.status(404).json({ error: 'Sessão não encontrada.' });
  const data = req.body as z.infer<typeof updateSchema>;
  const updated = await prisma.appointment.update({
    where: { id: existing.id },
    data: {
      status: data.status,
      notes: data.notes,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
    },
  });
  res.json(updated);
});
