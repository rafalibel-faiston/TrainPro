import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Popula o banco com um personal e dois alunos de exemplo.
async function main() {
  const password = await bcrypt.hash('123456', 10);

  const trainer = await prisma.user.upsert({
    where: { email: 'personal@trainpro.dev' },
    update: {},
    create: {
      name: 'Carlos Personal',
      email: 'personal@trainpro.dev',
      password,
      role: 'TRAINER',
      trainerProfile: { create: { bio: 'Especialista em hipertrofia.' } },
    },
    include: { trainerProfile: true },
  });

  const ana = await prisma.user.upsert({
    where: { email: 'ana@trainpro.dev' },
    update: {},
    create: {
      name: 'Ana Aluna',
      email: 'ana@trainpro.dev',
      password,
      role: 'STUDENT',
      studentProfile: {
        create: { trainerId: trainer.trainerProfile!.id, goal: 'Emagrecimento' },
      },
    },
    include: { studentProfile: true },
  });

  await prisma.workout.create({
    data: {
      name: 'Treino A — Membros Inferiores',
      studentId: ana.studentProfile!.id,
      trainerId: trainer.trainerProfile!.id,
      notes: 'Foco em quadríceps e glúteos.',
      exercises: {
        create: [
          { name: 'Agachamento livre', sets: 4, reps: '10-12', weightKg: 40, order: 0 },
          { name: 'Leg press', sets: 4, reps: '12', weightKg: 120, order: 1 },
          { name: 'Cadeira extensora', sets: 3, reps: '15', weightKg: 35, order: 2 },
        ],
      },
    },
  });

  await prisma.progressEntry.create({
    data: { studentId: ana.studentProfile!.id, weightKg: 68.5, bodyFat: 27, notes: 'Início.' },
  });

  await prisma.payment.create({
    data: {
      studentId: ana.studentProfile!.id,
      amount: 250,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Seed concluído.');
  console.log('Personal: personal@trainpro.dev / 123456');
  console.log('Aluno:    ana@trainpro.dev / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
