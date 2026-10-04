import { useEffect, useState } from 'react';
import { DEFAULT_SHIFT_PLAN, deriveShift, formatClock, formatMinutes, SHIFT_LABELS, SHIFT_STATUS, validShiftPlan } from '../../utils/shiftSchedule.js';

const fields = [['start', 'Início previsto'], ['lunchStart', 'Saída prevista para almoço'], ['lunchEnd', 'Retorno previsto do almoço'], ['end', 'Fim previsto']];
const actionLabels = { start: 'Iniciar turno', 'lunch-start': 'Registrar saída para almoço', 'lunch-end': 'Registrar retorno do almoço', end: 'Encerrar turno' };

export default function OperatorShiftPanel({ events = [], plan = DEFAULT_SHIFT_PLAN, onAction, onSavePlan, busy = false, showAction = true }) {
  const [now, setNow] = useState(() => new Date());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(plan);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60000); return () => window.clearInterval(timer); }, []);
  useEffect(() => setDraft(plan), [plan]);
  const shift = deriveShift(events, now);
  const nextPlanned = shift.nextAction === 'lunch-start' ? `Almoço às ${plan.lunchStart}` : shift.nextAction === 'lunch-end' ? `Retorno às ${plan.lunchEnd}` : shift.nextAction === 'end' ? `Fim às ${plan.end}` : `Início às ${plan.start}`;
  const save = () => { if (!validShiftPlan(draft)) return; onSavePlan(draft); setEditing(false); };
  return <section className="operator-shift-panel" aria-label="Meu turno">
    <div className="operator-shift-panel__head"><div><span className="operator-shift-panel__eyebrow">Ponto demonstrativo</span><h2>Meu turno</h2></div><span className={`operator-shift-panel__status is-${shift.status}`}>{SHIFT_STATUS[shift.status]}</span></div>
    <div className="operator-shift-panel__section-head"><h3>Horário previsto</h3><button type="button" onClick={() => setEditing(!editing)}>{editing ? 'Cancelar' : 'Ajustar horário do turno'}</button></div>
    {editing ? <div className="operator-shift-panel__editor"><div className="operator-shift-panel__fields">{fields.map(([key, label]) => <label key={key}>{label}<input type="time" value={draft[key]} onInput={(event) => { const value = event.currentTarget.value; setDraft((current) => ({ ...current, [key]: value })); }} /></label>)}</div><p>Use horários na ordem início, almoço e fim.</p><button type="button" className="btn btn-primary btn-sm" disabled={!validShiftPlan(draft)} onClick={save}>Salvar horários</button></div> : <dl className="operator-shift-panel__schedule">{fields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{plan[key]}</dd></div>)}</dl>}
    <div className="operator-shift-panel__section-head"><h3>Horário registrado</h3></div>
    <div className="operator-shift-panel__records">{fields.map(([key], index) => { const type = ['start', 'lunch-start', 'lunch-end', 'end'][index]; return <div key={type}><time>{formatClock(shift.records[key])}</time><span>{SHIFT_LABELS[type]}</span></div>; })}</div>
    <div className="operator-shift-panel__totals"><div><span>Tempo ativo</span><strong>{formatMinutes(shift.activeMinutes)}</strong></div><div><span>Intervalo realizado</span><strong>{shift.records.lunchStart ? formatMinutes(shift.breakMinutes) : 'Pendente'}</strong></div></div>
    <p className="operator-shift-panel__next">Próximo marco previsto: <strong>{nextPlanned}</strong></p>
    {showAction && <button className="operator-shift-panel__action" type="button" disabled={busy} onClick={() => onAction(shift.nextAction)}>{busy ? 'Registrando…' : actionLabels[shift.nextAction]}</button>}
  </section>;
}
