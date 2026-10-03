export const normalizeToken = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();

export const statusToneClass = (value = '') => {
  const token = normalizeToken(value);
  return token ? `hop-status--${token}` : '';
};

export const formatDate = (date) => {
  if (!date) return '—';
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

export const formatDateTime = (dateTime) => {
  if (!dateTime) return '—';
  const targetDate = new Date(dateTime);
  if (Number.isNaN(targetDate.getTime())) return '—';

  const now = new Date();
  const isToday = targetDate.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = targetDate.toDateString() === yesterday.toDateString();

  const timeStr = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(targetDate);

  if (isToday) {
    return `Hoje, ${timeStr}`;
  }
  if (isYesterday) {
    return `Ontem, ${timeStr}`;
  }

  const isSameYear = targetDate.getFullYear() === now.getFullYear();
  const dateStr = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    ...(isSameYear ? {} : { year: 'numeric' }),
  }).format(targetDate);

  return `${dateStr}, ${timeStr}`;
};

export const formatElapsedMinutes = (minutes = 0) => {
  const safeMinutes = Math.max(0, Number(minutes) || 0);
  if (safeMinutes < 1) return 'há menos de 1 min';
  if (safeMinutes < 60) return `há ${safeMinutes} min`;
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  return remainingMinutes ? `há ${hours}h ${remainingMinutes}min` : `há ${hours}h`;
};

