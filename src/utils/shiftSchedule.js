export const DEFAULT_SHIFT_PLAN = Object.freeze({ start: '07:00', lunchStart: '12:00', lunchEnd: '13:00', end: '16:00' });
export const SHIFT_LABELS = { start: 'Início do turno', 'lunch-start': 'Saída para almoço', 'lunch-end': 'Retorno do almoço', end: 'Encerramento do turno' };
export const SHIFT_STATUS = { off: 'Fora de turno', active: 'Em andamento', break: 'Em intervalo', ended: 'Concluído' };
const sequence = ['start', 'lunch-start', 'lunch-end', 'end'];
const minuteOf = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
export const validShiftPlan = (plan) => ['start', 'lunchStart', 'lunchEnd', 'end'].every((key) => /^([01]\d|2[0-3]):[0-5]\d$/.test(plan?.[key] || ''))
  && minuteOf(plan.start) < minuteOf(plan.lunchStart) && minuteOf(plan.lunchStart) < minuteOf(plan.lunchEnd) && minuteOf(plan.lunchEnd) < minuteOf(plan.end);
export const localDay = (date) => { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const formatClock = (at) => at ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(at)) : '—';
export const formatMinutes = (minutes) => minutes == null ? 'Não calculável' : `${String(Math.floor(minutes / 60)).padStart(2, '0')}h ${String(minutes % 60).padStart(2, '0')}min`;

export function deriveShift(events = [], now = new Date()) {
  const ordered = events.filter((event) => sequence.includes(event.type) && !Number.isNaN(new Date(event.at).getTime())).sort((a, b) => new Date(a.at) - new Date(b.at));
  const records = {};
  for (const event of ordered) {
    if (event.type === 'start') { records.start = event.at; delete records.lunchStart; delete records.lunchEnd; delete records.end; }
    if (event.type === 'lunch-start' && records.start && !records.lunchStart) records.lunchStart = event.at;
    if (event.type === 'lunch-end' && records.lunchStart && !records.lunchEnd) records.lunchEnd = event.at;
    if (event.type === 'end' && records.start && !records.end) records.end = event.at;
  }
  const status = records.end ? 'ended' : records.lunchStart && !records.lunchEnd ? 'break' : records.start ? 'active' : 'off';
  const endTime = records.end ? new Date(records.end).getTime() : new Date(now).getTime();
  const startTime = records.start ? new Date(records.start).getTime() : NaN;
  const lunchStartTime = records.lunchStart ? new Date(records.lunchStart).getTime() : NaN;
  const lunchEndTime = records.lunchEnd ? new Date(records.lunchEnd).getTime() : NaN;
  const breakEnd = Number.isFinite(lunchStartTime) ? (Number.isFinite(lunchEndTime) ? lunchEndTime : endTime) : NaN;
  const breakMinutes = Number.isFinite(breakEnd) ? Math.max(0, Math.floor((breakEnd - lunchStartTime) / 60000)) : 0;
  const activeMinutes = Number.isFinite(startTime) ? Math.max(0, Math.floor((endTime - startTime) / 60000) - breakMinutes) : null;
  const nextAction = status === 'off' || status === 'ended' ? 'start' : status === 'break' ? 'lunch-end' : records.lunchEnd ? 'end' : 'lunch-start';
  return { records, status, activeMinutes, breakMinutes, nextAction, events: ordered };
}

export function getShiftDays(events = [], technicianId, now = new Date()) {
  const grouped = new Map();
  events.filter((event) => event.technicianId === technicianId).forEach((event) => {
    const day = localDay(event.at);
    grouped.set(day, [...(grouped.get(day) || []), event]);
  });
  return [...grouped].map(([day, dayEvents]) => ({ day, events: dayEvents, demo: false })).sort((a, b) => b.day.localeCompare(a.day));
}

export function demoShiftDays(technicianId, now = new Date(), plan = DEFAULT_SHIFT_PLAN) {
  const seed = Number(technicianId.split('-').pop()) || 1;
  const deviations = [[-2, 3, 1, 6], [4, -4, 2, -3], [-5, 5, -2, 4]];
  return [1, 2, 3].map((offset, index) => {
    const dayDate = new Date(now); dayDate.setHours(12, 0, 0, 0); dayDate.setDate(dayDate.getDate() - offset);
    const day = localDay(dayDate);
    const delta = deviations[index].map((value, i) => value + (i === 0 ? seed - 6 : ((seed * (i + 2) + index) % 9) - 4));
    const times = [plan.start, plan.lunchStart, plan.lunchEnd, plan.end].map((time, i) => {
      const at = new Date(dayDate); at.setHours(Number(time.slice(0, 2)), Number(time.slice(3, 5)) + delta[i], 0, 0); return at.toISOString();
    });
    return { day, demo: true, events: sequence.map((type, i) => ({ type, at: times[i], technicianId })) };
  });
}
