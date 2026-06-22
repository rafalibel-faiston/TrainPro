import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { trainerProfileId, studentProfileId, studentBelongsToTrainer } from '../lib/profiles.js';

export const paymentsRouter = Router();

paymentsRouter.use(authenticate);

// Lista pagamentos: personal vê os dos seus alunos (filtrável por ?studentId);
// aluno vê os seus.
paymentsRouter.get('/', async (req, res) => {
  if (req.user!.role === 'STUDENT') {
    const studentId = await studentProfileId(req.user!.userId);
    const items = await prisma.payment.findMany({
      where: { studentId: studentId! },
      orderBy: { dueDate: 'desc' },
    });
    return res.json(items);
  }
  const trainerId = await trainerProfileId(req.user!.userId);
  const studentId = req.query.studentId as string | undefined;
  const items = await prisma.payment.findMany({
    where: {
      student: { trainerId: trainerId! },
      ...(studentId ? { studentId } : {}),
    },
    orderBy: { dueDate: 'desc' },
    include: { student: { include: { user: { select: { name: true } } } } },
  });
  res.json(items);
});

const createSchema = z.object({
  studentId: z.string(),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
  notes: z.string().optional(),
});

// Personal lança uma mensalidade para um aluno seu.
paymentsRouter.post('/', validateBody(createSchema), async (req, res) => {
  if (req.user!.role !== 'TRAINER') {
    return res.status(403).json({ error: 'Apenas o personal pode lançar pagamentos.' });
  }
  const trainerId = await trainerProfileId(req.user!.userId);
  const data = req.body as z.infer<typeof createSchema>;
  if (!(await studentBelongsToTrainer(data.studentId, trainerId!))) {
    return res.status(404).json({ error: 'Aluno não encontrado.' });
  }
  const payment = await prisma.payment.create({
    data: {
      studentId: data.studentId,
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      notes: data.notes,
    },
  });
  res.status(201).json(payment);
});

// Personal marca uma mensalidade como paga.
paymentsRouter.post('/:id/pay', async (req, res) => {
  if (req.user!.role !== 'TRAINER') {
    return res.status(403).json({ error: 'Apenas o personal pode dar baixa em pagamentos.' });
  }
  const trainerId = await trainerProfileId(req.user!.userId);
  const payment = await prisma.payment.findFirst({
    where: { id: req.params.id, student: { trainerId: trainerId! } },
  });
  if (!payment) return res.status(404).json({ error: 'Pagamento não encontrado.' });
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'PAID', paidAt: new Date() },
  });
  res.json(updated);
});
