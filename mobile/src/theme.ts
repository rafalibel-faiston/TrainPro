// Paleta e tokens — TEMA DARK + ACENTO LIMÃO (base nas telas enviadas pelo cliente).
export const COLORS = {
  // Fundo quase preto
  bgTop: '#0B0B10',
  bgMid: '#0A0A0E',
  bgBot: '#0C0C12',

  // Superfícies
  surface: '#15151C',
  surfaceStrong: '#1C1C25',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.14)',

  // Acento — verde-limão
  accent: '#A3E635',
  accentDeep: '#84CC16',
  accentSoft: 'rgba(163,230,53,0.14)',
  onAccent: '#0A0A0A', // texto sobre o limão

  // Texto
  text: '#F4F6FB',
  text2: '#9AA4B2',
  text3: '#646B7A',
  eyebrow: '#6E7A8A', // rótulo pequeno acima dos títulos

  // Status
  success: '#A3E635',
  successBg: 'rgba(163,230,53,0.14)',
  warning: '#FBBF24',
  warningBg: 'rgba(251,191,36,0.14)',
  danger: '#F87171',
  dangerBg: 'rgba(248,113,113,0.14)',

  // Cores para avatares e gráficos
  c1: '#3B82F6',
  c2: '#EF6B53',
  c3: '#8B5CF6',
  c4: '#22C2A6',
  c5: '#EC4899',
  c6: '#F59E0B',
};

const AVATAR = [COLORS.c1, COLORS.c2, COLORS.c3, COLORS.c4, COLORS.c5, COLORS.c6, COLORS.accentDeep];

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0x7fffffff;
  return AVATAR[h % AVATAR.length];
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatTime(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatMoney(v: number) {
  return 'R$ ' + v.toFixed(2).replace('.', ',');
}

export function parseNum(s: string): number | undefined {
  const t = s.replace(',', '.').trim();
  if (!t) return undefined;
  const n = Number(t);
  return isNaN(n) ? undefined : n;
}

export function paymentInfo(status: string, dueDate: string) {
  if (status === 'PAID') return { label: 'Pago', tone: 'success' as const };
  if (new Date(dueDate).getTime() < Date.now()) return { label: 'Atrasado', tone: 'danger' as const };
  return { label: 'Pendente', tone: 'warning' as const };
}

export function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
