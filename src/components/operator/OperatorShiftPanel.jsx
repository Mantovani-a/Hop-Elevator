import { useEffect, useState } from 'react';
import {
  DEFAULT_SHIFT_PLAN,
  deriveShift,
  formatClock,
  formatMinutes,
  SHIFT_LABELS,
  SHIFT_STATUS,
  validShiftPlan,
} from '../../utils/shiftSchedule.js';

const SHIFT_FIELDS = [
  ['start', 'Início previsto'],
  ['lunchStart', 'Saída prevista para almoço'],
  ['lunchEnd', 'Retorno previsto do almoço'],
  ['end', 'Fim previsto'],
];

const ACTION_LABELS = {
  start: 'Iniciar turno',
  'lunch-start': 'Registrar saída para almoço',
  'lunch-end': 'Registrar retorno do almoço',
  end: 'Encerrar turno',
};

export default function OperatorShiftPanel({
  events = [],
  plan = DEFAULT_SHIFT_PLAN,
  onAction,
  onSavePlan,
  busy = false,
  showAction = true,
}) {
  const [now, setNow] = useState(() => new Date());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(plan);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setDraft(plan);
  }, [plan]);

  const shift = deriveShift(events, now);

  const nextPlanned =
    shift.nextAction === 'lunch-start'
      ? `Almoço às ${plan.lunchStart}`
      : shift.nextAction === 'lunch-end'
      ? `Retorno às ${plan.lunchEnd}`
      : shift.nextAction === 'end'
      ? `Fim às ${plan.end}`
      : `Início às ${plan.start}`;

  const handleSave = () => {
    if (!validShiftPlan(draft)) return;
    if (onSavePlan) {
      onSavePlan(draft);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(plan);
    setEditing(false);
  };

  return (
    <section className="operator-shift-panel" aria-label="Programação do Turno">
      {/* Cabeçalho do Painel */}
      <header className="operator-shift-panel__head">
        <div>
          <span className="operator-shift-panel__eyebrow">Escala Operacional</span>
          <h2 className="operator-shift-panel__title">Meu Turno</h2>
        </div>
        <div
          className={`operator-shift-panel__status is-${shift.status}`}
          role="status"
        >
          <span className="operator-shift-panel__status-dot" aria-hidden="true" />
          <span>{SHIFT_STATUS[shift.status]}</span>
        </div>
      </header>

      {/* Seção: Horário Previsto (Visualização ou Edição) */}
      <div className="operator-shift-panel__section">
        <div className="operator-shift-panel__section-head">
          <h3>Horário Previsto</h3>
          <button
            type="button"
            className="operator-shift-panel__edit-btn"
            onClick={() => (editing ? handleCancel() : setEditing(true))}
          >
            {editing ? 'Cancelar' : 'Ajustar horários da escala'}
          </button>
        </div>

        {editing ? (
          <div className="operator-shift-panel__editor">
            <div className="operator-shift-panel__fields">
              {SHIFT_FIELDS.map(([key, label]) => (
                <label key={key} className="operator-shift-panel__field">
                  <span className="operator-shift-panel__label">{label}</span>
                  <input
                    type="time"
                    className="operator-shift-panel__input"
                    value={draft[key] || ''}
                    onInput={(event) => {
                      const value = event.currentTarget.value;
                      setDraft((current) => ({ ...current, [key]: value }));
                    }}
                  />
                </label>
              ))}
            </div>
            <p className="operator-shift-panel__help-text">
              Defina os horários em ordem cronológica (entrada, início do almoço, fim do almoço e término).
            </p>
            <div className="operator-shift-panel__editor-actions">
              <button
                type="button"
                className="btn btn-sm btn-primary operator-shift-panel__save-btn"
                disabled={!validShiftPlan(draft)}
                onClick={handleSave}
              >
                Salvar escala
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={handleCancel}
              >
                Descartar
              </button>
            </div>
          </div>
        ) : (
          <dl className="operator-shift-panel__schedule">
            {SHIFT_FIELDS.map(([key, label]) => (
              <div key={key} className="operator-shift-panel__schedule-item">
                <dt className="operator-shift-panel__schedule-label">{label}</dt>
                <dd className="operator-shift-panel__schedule-value">{plan[key]}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Seção: Horário Registrado no Ponto */}
      <div className="operator-shift-panel__section">
        <div className="operator-shift-panel__section-head">
          <h3>Registros Efetivos</h3>
        </div>
        <div className="operator-shift-panel__records">
          {SHIFT_FIELDS.map(([key], index) => {
            const type = ['start', 'lunch-start', 'lunch-end', 'end'][index];
            const hasRecord = Boolean(shift.records[key]);
            return (
              <div key={type} className={`operator-shift-panel__record-item${hasRecord ? ' has-record' : ''}`}>
                <span className="operator-shift-panel__record-label">{SHIFT_LABELS[type]}</span>
                <time className="operator-shift-panel__record-time">{formatClock(shift.records[key])}</time>
              </div>
            );
          })}
        </div>
      </div>

      {/* Métricas e Próximo Marco */}
      <div className="operator-shift-panel__metrics">
        <div className="operator-shift-panel__metric-card">
          <span className="operator-shift-panel__metric-label">Tempo em atividade</span>
          <strong className="operator-shift-panel__metric-val">{formatMinutes(shift.activeMinutes)}</strong>
        </div>
        <div className="operator-shift-panel__metric-card">
          <span className="operator-shift-panel__metric-label">Intervalo de almoço</span>
          <strong className="operator-shift-panel__metric-val">
            {shift.records.lunchStart ? formatMinutes(shift.breakMinutes) : 'Não registrado'}
          </strong>
        </div>
      </div>

      <div className="operator-shift-panel__next-step">
        <span>Próximo marco operacional:</span>
        <strong>{nextPlanned}</strong>
      </div>

      {/* Ação Primária de Ponto (quando exibido em modal durante jornada) */}
      {showAction && onAction && (
        <button
          className="operator-shift-panel__action"
          type="button"
          disabled={busy}
          onClick={() => onAction(shift.nextAction)}
        >
          {busy ? 'Registrando…' : ACTION_LABELS[shift.nextAction] || 'Registrar'}
        </button>
      )}
    </section>
  );
}

