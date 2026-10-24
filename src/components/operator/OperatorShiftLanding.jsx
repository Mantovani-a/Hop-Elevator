import { useState } from 'react';
import ProfileAvatar from '../ProfileAvatar';
import Modal from '../Modal';
import OperatorShiftPanel from './OperatorShiftPanel';
import { ModuleIcon } from '../ModuleSidebar';
import { DEFAULT_SHIFT_PLAN, deriveShift, formatClock, SHIFT_STATUS } from '../../utils/shiftSchedule.js';

const actionLabels = {
  start: 'Iniciar turno',
  'lunch-start': 'Registrar saída para almoço',
  'lunch-end': 'Registrar retorno do almoço',
  end: 'Encerrar turno',
};

const plannedHours = (plan) => {
  const minutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  const total = minutes(plan.end) - minutes(plan.start) - minutes(plan.lunchEnd) + minutes(plan.lunchStart);
  return `${Math.floor(total / 60)}h${total % 60 ? String(total % 60).padStart(2, '0') : ''} CLT`;
};

export default function OperatorShiftLanding({
  technician,
  shiftEvents = [],
  shiftPlan = DEFAULT_SHIFT_PLAN,
  onShiftAction,
  onSaveShiftPlan,
  isStarting = false,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const shift = deriveShift(shiftEvents);
  const confirming = isStarting && shift.status === 'active';
  const statusLabel = confirming ? 'Turno iniciado' : SHIFT_STATUS[shift.status];
  const plan = shiftPlan || DEFAULT_SHIFT_PLAN;

  return (
    <section
      className={`operator-shift-stage is-${shift.status}${confirming ? ' is-confirming' : ''}`}
      aria-labelledby="operator-shift-stage-title"
    >
      <div className="operator-shift-grid">
        {/* Painel Esquerdo: Identificação & Ponto Operacional */}
        <div className="operator-shift-panel operator-shift-panel--primary">
          <div className="operator-shift-panel__header">
            <span className="operator-shift-badge-terminal"><ModuleIcon name="location" size={17} />Terminal de Campo</span>
            <div
              className={`operator-shift-status-pill is-${shift.status}`}
              role="status"
            >
              <span className="operator-shift-status-pill__dot" aria-hidden="true" />
              <span>{statusLabel}</span>
            </div>
          </div>

          <div className="operator-shift-profile">
            <ProfileAvatar
              name={technician?.name || 'Técnico de campo'}
              src={technician?.avatar}
              size="lg"
              decorative
            />
            <div className="operator-shift-profile__details">
              <span className="operator-shift-profile__role">Técnico de Manutenção</span>
              <h1 id="operator-shift-stage-title" className="operator-shift-profile__name">
                {technician?.name || 'Técnico de campo'}
              </h1>
              <div className="operator-shift-profile__meta">
                <span className="operator-shift-profile__id">
                  Matrícula: {technician?.employeeId || technician?.id || 'OT-OPR-1042'}
                </span>
                {technician?.region && (
                  <span className="operator-shift-profile__region">
                    · {technician.region}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="operator-shift-actions">
            <button
              className="operator-shift-btn-primary operator-shift-stage__primary"
              type="button"
              disabled={isStarting}
              onClick={() => onShiftAction(shift.nextAction)}
            >
              {confirming ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : isStarting ? (
                <span className="operator-shift-spinner" aria-hidden="true" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              )}
              <span>
                {confirming
                  ? 'Turno iniciado'
                  : isStarting
                  ? 'Registrando turno…'
                  : actionLabels[shift.nextAction] || 'Iniciar turno'}
              </span>
            </button>
            <button
              className="operator-shift-btn-secondary operator-shift-stage__secondary"
              type="button"
              onClick={() => setDetailsOpen(true)}
            >
              Consultar escala
            </button>
          </div>

          <div className="operator-shift-notice">
            <ModuleIcon name="info" size={20} />
            <span className="operator-shift-notice__text">
              {shift.status === 'active'
                ? 'Turno ativo. Sua rota e chamados estão sincronizados com a central técnica.'
                : 'Ao registrar início de turno, sua disponibilidade em campo será sincronizada com a central de despacho operacional.'}
            </span>
          </div>
        </div>

        {/* Painel Direito: Escala Programada & Prontidão Técnica */}
        <div className="operator-shift-panel operator-shift-panel--schedule">
          <div className="operator-shift-panel__header">
            <span className="operator-shift-panel__title">Jornada Programada</span>
            <span className="operator-shift-panel__tag">{plannedHours(plan)}</span>
          </div>

          <div className="operator-shift-schedule-list">
            <div className="operator-shift-schedule-row">
              <span className="operator-shift-schedule-label">Entrada prevista</span>
              <span className="operator-shift-schedule-value">{plan.start}</span>
            </div>
            <div className="operator-shift-schedule-row">
              <span className="operator-shift-schedule-label">Pausa de almoço</span>
              <span className="operator-shift-schedule-value">{plan.lunchStart} – {plan.lunchEnd}</span>
            </div>
            <div className="operator-shift-schedule-row">
              <span className="operator-shift-schedule-label">Saída prevista</span>
              <span className="operator-shift-schedule-value">{plan.end}</span>
            </div>
            {shift.records?.start && (
              <div className="operator-shift-schedule-row is-registered">
                <span className="operator-shift-schedule-label">Início registrado</span>
                <span className="operator-shift-schedule-value">{formatClock(shift.records.start)}</span>
              </div>
            )}
          </div>

          <div className="operator-shift-readiness">
            <span className="operator-shift-readiness__title">Prontidão Técnica</span>
            <ul className="operator-shift-readiness__list">
              <li className="operator-shift-readiness__item">
                <span className="operator-shift-readiness__check" aria-hidden="true">✓</span>
                <span>Viatura #14 vinculada</span>
              </li>
              <li className="operator-shift-readiness__item">
                <span className="operator-shift-readiness__check" aria-hidden="true">✓</span>
                <span>Kit EPI e ferramental checados</span>
              </li>
              <li className="operator-shift-readiness__item">
                <span className="operator-shift-readiness__check" aria-hidden="true">✓</span>
                <span>Armazenamento offline operacional</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes e Ajuste de Horários */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Horários do turno"
        titleId="operator-shift-details-title"
        className="operator-shift-modal"
        layerClassName="operator-end-shift-layer"
        showHeader={false}
      >
        <button
          type="button"
          className="operator-shift-modal__close"
          aria-label="Fechar horários"
          onClick={() => setDetailsOpen(false)}
        >
          ×
        </button>
        <OperatorShiftPanel
          events={shiftEvents}
          plan={shiftPlan}
          onSavePlan={onSaveShiftPlan}
          showAction={false}
        />
      </Modal>
    </section>
  );
}

