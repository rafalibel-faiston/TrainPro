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
      trainerProfile: { create: { bio: 'Especialista em hipertrofia.', inviteCode: 'CARLOS' } },
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

  const workout = await prisma.workout.create({
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

  // Check-in de exemplo: a Ana executou o treino com cargas ligeiramente maiores.
  await prisma.workoutLog.create({
    data: {
      workoutId: workout.id,
      studentId: ana.studentProfile!.id,
      notes: 'Senti firme, subi a carga no leg press.',
      entries: {
        create: [
          { exerciseName: 'Agachamento livre', setsDone: 4, repsDone: '12', weightKg: 42, order: 0 },
          { exerciseName: 'Leg press', setsDone: 4, repsDone: '12', weightKg: 130, order: 1 },
          { exerciseName: 'Cadeira extensora', setsDone: 3, repsDone: '15', weightKg: 35, order: 2 },
        ],
      },
    },
  });

  // Plano alimentar de exemplo.
  await prisma.dietPlan.create({
    data: {
      name: 'Plano de emagrecimento',
      notes: 'Beber 2,5L de água por dia.',
      studentId: ana.studentProfile!.id,
      trainerId: trainer.trainerProfile!.id,
      meals: {
        create: [
          { name: 'Café da manhã', time: '07:30', description: '2 ovos, 1 fatia de pão integral, café sem açúcar.', order: 0 },
          { name: 'Almoço', time: '12:30', description: '150g de frango, arroz integral, salada à vontade.', order: 1 },
          { name: 'Lanche', time: '16:00', description: '1 iogurte natural + 1 fruta.', order: 2 },
          { name: 'Jantar', time: '20:00', description: 'Omelete de legumes + salada.', order: 3 },
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
  console.log('Personal: personal@trainpro.dev / 123456  (código de convite: CARLOS)');
  console.log('Aluno:    ana@trainpro.dev / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
