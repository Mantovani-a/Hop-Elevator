import PriorityIndicator from './PriorityIndicator';
import StatusBadge from '../StatusBadge';
import { formatDateTime } from '../../utils/presentation';
import { OPERATION_STATUS } from '../../data/operationStore';
import { ModuleIcon } from '../ModuleSidebar';
import { normalizeOccurrenceTeam } from '../../utils/occurrenceTeam.js';

export default function OccurrenceQueueItem({ occurrence, workflowStatus }) {
  const resolved = workflowStatus === OPERATION_STATUS.RESOLVED;
  const distance = Number(occurrence.metadata?.distanceKm ?? 0).toFixed(1).replace('.', ',');

  const severity = occurrence.priority?.classification || 'baixa';
  const tone = severity === 'baixa' ? 'low' : severity === 'atenção' ? 'attention' : severity === 'alta' ? 'high' : 'critical';

  return (
    <a
      className={`d-block p-3 app-card text-decoration-none ${resolved ? 'opacity-75' : ''}`}
      style={{ borderLeft: `5px solid var(--color-severity-${tone})` }}
      href={`#/operator/occurrence/${occurrence.id}`}
      aria-label={`Abrir ocorrência ${occurrence.id} de ${occurrence.client?.name || 'Cliente'}`}
    >
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        {normalizeOccurrenceTeam(occurrence).members.length > 1 && <span className="hop-badge hop-badge--baixa">Equipe · {normalizeOccurrenceTeam(occurrence).members.length} técnicos</span>}
        {occurrence.serviceType === 'preventive' && <span className="hop-preventive-status">Preventiva</span>}
        <PriorityIndicator priority={occurrence.priority} compact />
        <StatusBadge value={workflowStatus} />
      </div>
      <div className="row g-3 align-items-end mt-0">
        <div className="col-12 col-lg-6">
          <h3 className="fs-5 mt-2 mb-1" style={{ color: 'var(--color-text)' }}>{occurrence.client?.name || 'Cliente'}</h3>
          <p className="mb-0 text-secondary text-truncate" style={{ fontSize: '0.88rem' }}>{occurrence.elevator?.identification || 'Elevador'} · {occurrence.description || 'Intercorrência reportada'}</p>
        </div>
        <div className="col-12 col-lg-6 d-flex flex-wrap align-items-center justify-content-lg-end gap-3 gap-xl-4">
          <span className="d-inline-flex align-items-center gap-2 fw-bold" style={{ color: 'var(--color-text)', fontSize: '0.84rem' }}><ModuleIcon name="location" size={18} />{distance} km</span>
          <span className="d-inline-flex align-items-center gap-2 fw-bold" style={{ color: 'var(--color-text)', fontSize: '0.84rem' }}><ModuleIcon name="clock" size={18} />{formatDateTime(occurrence.time)}</span>
          <span className="text-primary fw-bold" style={{ fontSize: '0.86rem' }}>Ver detalhes <span aria-hidden="true">→</span></span>
        </div>
      </div>
      {occurrence.partRequest && <p className="mt-3 mb-0 p-2 rounded fw-bold" style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary-text)', fontSize: '0.8rem' }}>Retomada · retirar {occurrence.partRequest.part} ×{occurrence.partRequest.quantity} em {occurrence.partRequest.pickupLocation || 'local definido pela Central'}</p>}
    </a>
  );
}
