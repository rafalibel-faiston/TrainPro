// Paleta e tokens compartilhados do app — TEMA CLARO (day).
export const COLORS = {
  // Fundo (gradiente claro e suave)
  bgTop: '#FFFFFF',
  bgMid: '#F3F7FD',
  bgBot: '#E9F1FB',

  // Superfícies
  surface: '#FFFFFF',
  surfaceStrong: '#EEF3FA',
  border: '#E3E9F1',
  borderStrong: '#D2DBE7',

  // Acento (azul limpo)
  accent: '#0F6FFF',
  accentDeep: '#0A57D6',
  accentSoft: 'rgba(15,111,255,0.10)',

  // Texto
  text: '#0F1B2D',
  text2: '#56657C',
  text3: '#8A99AE',

  // Status
  success: '#15A34A',
  successBg: 'rgba(21,163,74,0.12)',
  warning: '#B45309',
  warningBg: 'rgba(180,83,9,0.12)',
  danger: '#DC2626',
  dangerBg: 'rgba(220,38,38,0.10)',
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

// Converte texto digitado (aceitando vírgula como separador decimal, comum no
// pt-BR) em número. Retorna undefined quando vazio/ inválido.
export function parseNum(s: string): number | undefined {
  const t = s.replace(',', '.').trim();
  if (!t) return undefined;
  const n = Number(t);
  return isNaN(n) ? undefined : n;
}

// Status de pagamento calculado (igual à web): pago / atrasado / pendente.
export function paymentInfo(status: string, dueDate: string) {
  if (status === 'PAID') return { label: 'Pago', tone: 'success' as const };
  if (new Date(dueDate).getTime() < Date.now()) return { label: 'Atrasado', tone: 'danger' as const };
  return { label: 'Pendente', tone: 'warning' as const };
}

// mm:ss a partir de segundos.
export function formatDuration(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
