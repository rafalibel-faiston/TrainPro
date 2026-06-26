// Paleta e tokens compartilhados do app (tema dark premium).
export const COLORS = {
  bgTop: '#0A1124',
  bgMid: '#0C1B3A',
  bgBot: '#0B2447',
  accent: '#2E90FF',
  accentDeep: '#1E6FE0',
  text: '#EAF2FB',
  text2: '#9FB3C8',
  text3: '#5E7390',
  surface: 'rgba(255,255,255,0.05)',
  surfaceStrong: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.10)',
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

// Converte texto digitado (aceitando vírgula como separador decimal, comum no
// pt-BR) em número. Retorna undefined quando vazio/ inválido.
export function parseNum(s: string): number | undefined {
  const t = s.replace(',', '.').trim();
  if (!t) return undefined;
  const n = Number(t);
  return isNaN(n) ? undefined : n;
}

export function formatMoney(v: number) {
  return 'R$ ' + v.toFixed(2).replace('.', ',');
}

// Status de pagamento calculado (igual à web): pago / atrasado / pendente.
export function paymentInfo(status: string, dueDate: string) {
  if (status === 'PAID') return { label: 'Pago', tone: 'success' as const };
  if (new Date(dueDate).getTime() < Date.now()) return { label: 'Atrasado', tone: 'danger' as const };
  return { label: 'Pendente', tone: 'warning' as const };
}
