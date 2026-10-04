import { useEffect, useState } from 'react';
import { DEFAULT_SHIFT_PLAN, demoShiftDays, deriveShift, formatClock, formatMinutes, getShiftDays, localDay, SHIFT_LABELS, SHIFT_STATUS } from '../../utils/shiftSchedule.js';

const eventTypes = ['start', 'lunch-start', 'lunch-end', 'end'];
const recordKeys = ['start', 'lunchStart', 'lunchEnd', 'end'];
const nextMilestones = { start: 'Início', 'lunch-start': 'Saída para almoço', 'lunch-end': 'Retorno do almoço', end: 'Fim' };
const plannedKeys = { start: 'start', 'lunch-start': 'lunchStart', 'lunch-end': 'lunchEnd', end: 'end' };
const dateLabel = (day) => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }).format(new Date(`${day}T12:00:00`));

function useTechnicianShift(technicianId, shiftEvents, shiftPlan) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60000); return () => window.clearInterval(timer); }, []);
  const plan = technicianId === 'TEC-010' ? shiftPlan || DEFAULT_SHIFT_PLAN : DEFAULT_SHIFT_PLAN;
  const realDays = getShiftDays(shiftEvents, technicianId, now);
  const today = localDay(now);
  const todayReal = realDays.find((day) => day.day === today);
  const todayShift = deriveShift(todayReal?.events || [], now);
  const demos = demoShiftDays(technicianId, now, plan).filter((day) => !realDays.some((actual) => actual.day === day.day));
  return { plan, now, today, todayShift, days: [...realDays, ...demos].sort((a, b) => b.day.localeCompare(a.day)) };
}

export default function ControlShiftRecords({ technicianId, shiftEvents = [], shiftPlan }) {
  const { plan, now, today, todayShift, days } = useTechnicianShift(technicianId, shiftEvents, shiftPlan);
  const live = todayShift.status === 'active' || todayShift.status === 'break';
  const milestone = todayShift.nextAction;
  return <div className="control-shifts">
    {live && <section className="control-shifts__current"><div className="control-shifts__heading"><h3>Turno atual</h3><span className={`control-shifts__status is-${todayShift.status}`}>{SHIFT_STATUS[todayShift.status]}</span></div><dl><div><dt>Início registrado</dt><dd>{formatClock(todayShift.records.start)}</dd></div><div><dt>Próximo marco previsto</dt><dd>{nextMilestones[milestone]} · {plan[plannedKeys[milestone]]}</dd></div><div><dt>Tempo ativo</dt><dd>{formatMinutes(todayShift.activeMinutes)}</dd></div><div><dt>Almoço</dt><dd>{todayShift.records.lunchEnd ? `${formatClock(todayShift.records.lunchStart)}–${formatClock(todayShift.records.lunchEnd)}` : todayShift.records.lunchStart ? `Em intervalo desde ${formatClock(todayShift.records.lunchStart)}` : 'Pendente'}</dd></div><div><dt>Fim previsto</dt><dd>{plan.end}</dd></div></dl></section>}
    <header className="control-shifts__intro"><h3>Registros por dia</h3><p>Histórico demonstrativo; registros do HOP Operator identificados como registrados.</p></header>
    {days.map((day) => { const dayPlan = day.day === today ? plan : day.events.find((event) => event.type === 'start')?.plan || plan; const shift = deriveShift(day.events, now); return <section className="control-shifts__day" key={day.day}><div className="control-shifts__heading"><div><h4>{dateLabel(day.day)}{day.day === today ? ' · Hoje' : ''}</h4><small>{day.demo ? 'Dados demonstrativos' : 'Registrado no HOP Operator'}</small></div><span className={`control-shifts__status is-${shift.status}`}>{SHIFT_STATUS[shift.status]}</span></div><div className="control-shifts__summary"><span>Previsto <strong>{dayPlan.start}–{dayPlan.end}</strong></span><span>Intervalo previsto <strong>{dayPlan.lunchStart}–{dayPlan.lunchEnd}</strong></span><span>Tempo ativo <strong>{formatMinutes(shift.activeMinutes)}</strong></span><span>Intervalo realizado <strong>{shift.records.lunchStart ? formatMinutes(shift.breakMinutes) : 'Pendente'}</strong></span></div><div className="control-shifts__timeline">{eventTypes.map((type, index) => <div key={type} className={shift.records[recordKeys[index]] ? 'is-recorded' : ''}><time>{formatClock(shift.records[recordKeys[index]])}</time><span>{SHIFT_LABELS[type]}</span></div>)}</div></section>; })}
  </div>;
}
