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

// Gera um código de convite curto e legível (sem caracteres ambíguos).
function randomInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

// Garante que o personal tenha um código de convite, criando um se necessário.
export async function ensureInviteCode(trainerProfileId: string): Promise<string> {
  const profile = await prisma.trainerProfile.findUnique({
    where: { id: trainerProfileId },
    select: { inviteCode: true },
  });
  if (profile?.inviteCode) return profile.inviteCode;

  // Tenta gerar um código único (colisões são raras com 32^6 combinações).
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomInviteCode();
    const exists = await prisma.trainerProfile.findUnique({ where: { inviteCode: code } });
    if (!exists) {
      await prisma.trainerProfile.update({ where: { id: trainerProfileId }, data: { inviteCode: code } });
      return code;
    }
  }
  throw new Error('Não foi possível gerar um código de convite.');
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
