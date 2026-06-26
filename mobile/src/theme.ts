// Paleta e tokens — TEMA DARK PREMIUM (pegada Cruip "Open").
export const COLORS = {
  // Fundo (quase preto com leve tom azulado)
  bgTop: '#0A0B11',
  bgMid: '#0B0D16',
  bgBot: '#0C1022',

  // Superfícies
  surface: '#14161F',
  surfaceStrong: '#1B1E2A',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',

  // Acento (azul → índigo, com glow)
  accent: '#6E8BFF',
  accentDeep: '#6366F1',
  gradA: '#4F7BFF',
  gradB: '#7C5CFF',
  accentSoft: 'rgba(110,139,255,0.14)',

  // Texto
  text: '#F4F6FB',
  text2: '#A2A9BC',
  text3: '#646B80',

  // Status
  success: '#34D399',
  successBg: 'rgba(52,211,153,0.14)',
  warning: '#FBBF24',
  warningBg: 'rgba(251,191,36,0.14)',
  danger: '#F87171',
  dangerBg: 'rgba(248,113,113,0.14)',
};

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
