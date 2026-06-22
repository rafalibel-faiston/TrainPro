import { prisma } from '../prisma.js';

// Resolve o id do TrainerProfile do usuário autenticado (ou null se não for personal).
export async function trainerProfileId(userId: string): Promise<string | null> {
  const profile = await prisma.trainerProfile.findUnique({ where: { userId } });
  return profile?.id ?? null;
}

// Resolve o id do StudentProfile do usuário autenticado (ou null se não for aluno).
export async function studentProfileId(userId: string): Promise<string | null> {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  return profile?.id ?? null;
}

// Verifica se um aluno pertence ao personal informado.
export async function studentBelongsToTrainer(
  studentId: string,
  trainerProfileId: string,
): Promise<boolean> {
  const student = await prisma.studentProfile.findFirst({
    where: { id: studentId, trainerId: trainerProfileId },
    select: { id: true },
  });
  return Boolean(student);
}
