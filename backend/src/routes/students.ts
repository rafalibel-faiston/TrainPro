import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db as prisma } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { trainerProfileId, studentBelongsToTrainer } from '../lib/profiles.js';

export const studentsRouter = Router();

studentsRouter.use(authenticate, requireRole('TRAINER'));

// Lista os alunos vinculados ao personal autenticado.
studentsRouter.get('/', async (req, res) => {
  const trainerId = await trainerProfileId(req.user!.userId);
  const students = await prisma.studentProfile.findMany({
    where: { trainerId: trainerId! },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    orderBy: { user: { name: 'asc' } },
  });
  res.json(students.map(serializeStudent));
});

const createStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  goal: z.string().optional(),
  birthDate: z.string().datetime().optional(),
});

// Cria um aluno já vinculado ao personal autenticado.
studentsRouter.post('/', validateBody(createStudentSchema), async (req, res) => {
  const trainerId = await trainerProfileId(req.user!.userId);
  const data = req.body as z.infer<typeof createStudentSchema>;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return res.status(409).json({ error: 'E-mail já cadastrado.' });

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashed,
      role: 'STUDENT',
      studentProfile: {
        create: {
          trainerId,
          goal: data.goal,
          birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        },
      },
    },
    include: { studentProfile: true },
  });

  res.status(201).json(
    serializeStudent({
      ...user.studentProfile!,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    }),
  );
});

// Detalhe de um aluno (com treinos, evolução, agenda e pagamentos resumidos).
studentsRouter.get('/:id', async (req, res) => {
  const trainerId = await trainerProfileId(req.user!.userId);
  if (!(await studentBelongsToTrainer(req.params.id, trainerId!))) {
    return res.status(404).json({ error: 'Aluno não encontrado.' });
  }
  const student = await prisma.studentProfile.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      workouts: { include: { exercises: true } },
      progress: { orderBy: { date: 'desc' } },
      appointments: { orderBy: { startsAt: 'desc' } },
      payments: { orderBy: { dueDate: 'desc' } },
    },
  });
  res.json(student);
});

function serializeStudent(s: {
  id: string;
  goal: string | null;
  birthDate: Date | null;
  user: { id: string; name: string; email: string; phone: string | null };
}) {
  return {
    id: s.id,
    name: s.user.name,
    email: s.user.email,
    phone: s.user.phone,
    goal: s.goal,
    birthDate: s.birthDate,
    userId: s.user.id,
  };
}
