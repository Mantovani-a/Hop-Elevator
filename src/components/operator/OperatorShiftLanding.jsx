import { useState } from 'react';
import HopLogo from '../HopLogo';
import ProfileAvatar from '../ProfileAvatar';
import Modal from '../Modal';
import OperatorShiftPanel from './OperatorShiftPanel';
import { deriveShift, SHIFT_STATUS } from '../../utils/shiftSchedule.js';

const actionLabels = { start: 'Iniciar turno', 'lunch-start': 'Registrar saída para almoço', 'lunch-end': 'Registrar retorno do almoço', end: 'Encerrar turno' };

export default function OperatorShiftLanding({ technician, shiftEvents = [], shiftPlan, onShiftAction, onSaveShiftPlan, isStarting = false }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const shift = deriveShift(shiftEvents);
  const confirming = isStarting && shift.status === 'active';
  const statusLabel = confirming ? 'Turno iniciado' : SHIFT_STATUS[shift.status];

  return <section className={`operator-shift-stage is-${shift.status}${confirming ? ' is-confirming' : ''}`} aria-labelledby="operator-shift-stage-title">
    <div className="operator-shift-stage__ambient" aria-hidden="true" />
    <div className="operator-shift-stage__layout">
      <div className="operator-shift-stage__brand"><HopLogo variant="operatorShift" size="shift" /></div>
      <div className="operator-shift-stage__controls">
        <div className="operator-shift-stage__identity"><ProfileAvatar name={technician?.name || 'Técnico de campo'} src={technician?.avatar} size="lg" decorative /><div><span>Operação em campo</span><h1 id="operator-shift-stage-title">{technician?.name || 'Técnico de campo'}</h1><p>{technician?.employeeId || technician?.id}</p></div></div>
        <div className="operator-shift-stage__status" role="status" key={statusLabel}><span aria-hidden="true" />{statusLabel}</div>
        <div className="operator-shift-stage__actions"><button className="operator-shift-stage__primary" type="button" disabled={isStarting} onClick={() => onShiftAction(shift.nextAction)}><span aria-hidden="true">{confirming ? '✓' : '→'}</span>{confirming ? 'Turno iniciado' : isStarting ? 'Registrando turno…' : actionLabels[shift.nextAction]}</button><button className="operator-shift-stage__secondary" type="button" onClick={() => setDetailsOpen(true)}>Consultar horários</button></div>
      </div>
    </div>
    <Modal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} title="Horários do turno" titleId="operator-shift-details-title" className="operator-shift-modal" layerClassName="operator-end-shift-layer" showHeader={false}>
      <button type="button" className="operator-shift-modal__close" aria-label="Fechar horários" onClick={() => setDetailsOpen(false)}>×</button>
      <OperatorShiftPanel events={shiftEvents} plan={shiftPlan} onSavePlan={onSaveShiftPlan} showAction={false} />
    </Modal>
  </section>;
}
