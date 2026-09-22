import { useRef } from 'react';
import ProfileAvatar from '../ProfileAvatar';
import StatusBadge from '../StatusBadge';
import { formatDateTime, formatElapsedMinutes } from '../../utils/presentation';
import { getSlaStatus } from '../../utils/slaCalculator';
import useDialogFocus from '../../hooks/useDialogFocus';
import { OPERATION_STATUS } from '../../data/operationStore';

export default function ControlOccurrenceDetail({
  occurrence,
  recommendedTechnician,
  onAssignRecommended,
  onClose,
  onReassign,
  onResumePart,
}) {
  const panelRef = useRef(null);
  useDialogFocus(Boolean(occurrence), panelRef, onClose);
  if (!occurrence) return null;
  const recordedTimeline = (occurrence.workflowHistory || []).filter((item) => Boolean(item.at));
  const timeline = recordedTimeline.length > 0
    ? recordedTimeline
    : [
        occurrence.time && { label: 'Chamado aberto', at: occurrence.time },
        occurrence.assignedAt && {
          label: occurrence.technician ? `${occurrence.technician.name} atribuído` : 'Técnico atribuído',
          at: occurrence.assignedAt,
        },
        occurrence.completedAt && { label: 'Atendimento concluído', at: occurrence.completedAt },
      ].filter(Boolean);
  const automaticAssignment = occurrence.metadata?.automaticAssignment?.mode === 'automatic'
    ? occurrence.metadata.automaticAssignment
    : null;
  const sla = getSlaStatus(occurrence);

  return (
    <div className="control-panel-layer" role="dialog" aria-modal="true" aria-labelledby="control-occurrence-title">
      <button className="control-panel-backdrop" type="button" aria-label="Fechar detalhe" onClick={onClose} />
      <aside ref={panelRef} className="control-detail-panel" tabIndex="-1">
        <header><div><p className="eyebrow eyebrow--dark">{occurrence.protocol}</p><h2 id="control-occurrence-title">Detalhe da ocorrência</h2></div><button type="button" onClick={onClose} aria-label="Fechar">×</button></header>
        <div className="control-detail-panel__badges">
          <StatusBadge value={occurrence.priority?.classification || 'baixa'} type="severity" />
          <strong>{occurrence.priority?.score ?? 0}/100</strong>
          <StatusBadge value={occurrence.operationalStatus} />
          {sla && (
            <span
              className={`hop-badge ${sla.isBreached ? 'hop-badge--critica' : sla.isNearBreach ? 'hop-badge--atencao' : 'hop-badge--baixa'}`}
              title={sla.detail}
            >
              ⏱️ {sla.shortStatus}
            </span>
          )}
        </div>
        <section><h3>Ocorrência</h3><dl><div><dt>Problema</dt><dd>{occurrence.description || 'Intercorrência reportada'}</dd></div>{occurrence.metadata?.reportedProblems?.length > 0 && <div><dt>Sintomas informados</dt><dd>{occurrence.metadata.reportedProblems.join(' · ')}</dd></div>}<div><dt>Horário</dt><dd>{formatDateTime(occurrence.time)}</dd></div><div><dt>Tempo aberto</dt><dd>{formatElapsedMinutes(occurrence.priority?.elapsedMinutes ?? 0)}</dd></div><div><dt>Pessoas presas</dt><dd>{occurrence.trappedPeople || 'Nenhuma informada'}</dd></div><div><dt>Risco informado</dt><dd>{occurrence.metadata?.riskUnknown ? 'Não sei / a verificar' : occurrence.metadata?.riskToLife ? 'Sim' : 'Não'}</dd></div>{sla && <div><dt>Meta de SLA</dt><dd>{sla.label} · {sla.detail}</dd></div>}</dl>{occurrence.metadata?.emergencyDispatchSimulation && <p className="control-confirm-copy">Emergência crítica confirmada · acionamento demonstrativo dos Bombeiros.</p>}<ul className="control-reasons">{(occurrence.priority?.reasons || ['Avaliação operacional padrão']).map((reason) => <li key={reason}><span aria-hidden="true">✓</span>{reason}</li>)}</ul></section>
        <section><h3>Local e elevador</h3><dl><div><dt>Estabelecimento</dt><dd>{occurrence.client?.name || 'Cliente'}</dd></div><div><dt>Tipo</dt><dd>{occurrence.client?.type || 'Estabelecimento'}</dd></div><div><dt>Endereço</dt><dd>{occurrence.address || 'Endereço não informado'}</dd></div><div><dt>Elevador</dt><dd>{occurrence.elevator?.identification || 'Elevador'}</dd></div><div><dt>Modelo</dt><dd>{occurrence.elevator?.model || 'Modelo padrão'}</dd></div></dl></section>
        {occurrence.partRequest && <section className="control-part-detail"><h3>Necessidade de peça</h3><dl><div><dt>Peça</dt><dd>{occurrence.partRequest.part}</dd></div><div><dt>Quantidade</dt><dd>{occurrence.partRequest.quantity}</dd></div><div><dt>Urgência</dt><dd>{occurrence.partRequest.urgency}</dd></div><div><dt>Situação</dt><dd>{occurrence.partRequest.state}</dd></div><div><dt>Diagnóstico inicial</dt><dd>{occurrence.partRequest.diagnosedBy?.name}</dd></div><div><dt>Solicitada em</dt><dd>{formatDateTime(occurrence.partRequest.requestedAt)}</dd></div>{occurrence.partRequest.pickupLocation && <div><dt>Retirada</dt><dd>{occurrence.partRequest.pickupLocation}</dd></div>}{occurrence.partRequest.resumedBy && <div><dt>Retomada atribuída a</dt><dd>{occurrence.partRequest.resumedBy.name}</dd></div>}</dl><p><strong>Motivo:</strong> {occurrence.partRequest.diagnosis}</p>{occurrence.partRequest.observation && <p><strong>Observação:</strong> {occurrence.partRequest.observation}</p>}{occurrence.workflowStatus === OPERATION_STATUS.WAITING_PART && <button className="btn btn-primary w-100" type="button" onClick={() => onResumePart(occurrence)}>PEÇA DISPONÍVEL — RETOMAR ATENDIMENTO</button>}</section>}
        {occurrence.supportRequest && <section><h3>Suporte da central</h3><p><strong>Solicitado por {occurrence.supportRequest.requestedBy?.name}:</strong> {occurrence.supportRequest.reason}</p>{occurrence.supportRequest.observation && <p>{occurrence.supportRequest.observation}</p>}<StatusBadge value={occurrence.supportRequest.state} /></section>}
        {occurrence.workflowStatus === OPERATION_STATUS.RESOLVED && occurrence.finalDiagnosis && <section><h3>Encerramento técnico</h3><dl><div><dt>Resultado</dt><dd>{occurrence.finalDiagnosis}</dd></div><div><dt>Ação realizada</dt><dd>{occurrence.solution}</dd></div><div><dt>Condição final</dt><dd>{occurrence.finalCondition}</dd></div><div><dt>Conclusão</dt><dd>{formatDateTime(occurrence.completedAt)}</dd></div></dl></section>}
        <section>
          <h3>Técnico</h3>
          {occurrence.metadata?.requiresReassignment && <p className="control-confirm-copy">Técnico atribuído está indisponível. A ocorrência permanece aberta e exige reatribuição.</p>}
          {occurrence.technician ? (
            <div className={`control-assignment-card${automaticAssignment ? ' is-automatic' : ''}`}>
              {automaticAssignment && <span className="control-assignment-card__label">Técnico atribuído automaticamente</span>}
              <div className="control-assignee">
                <ProfileAvatar name={occurrence.technician.name} src={occurrence.technician.avatar} size="md" decorative />
                <div>
                  <strong>{occurrence.technician.name}</strong>
                  <small>{occurrence.operationalStatus} · {Number(occurrence.metadata?.distanceKm ?? 0).toFixed(1).replace('.', ',')} km · ETA demonstrativo {occurrence.metadata?.etaMinutes ?? 10} min</small>
                </div>
              </div>
              {automaticAssignment?.reasons?.length > 0 && (
                <ul className="control-assignment-reasons" aria-label="Motivos da atribuição automática">
                  {automaticAssignment.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              )}
            </div>
          ) : recommendedTechnician ? (
            <div className="control-dispatch-recommendation">
              <p className="eyebrow eyebrow--dark">Técnico recomendado</p>
              <div className="control-assignee">
                <ProfileAvatar name={recommendedTechnician.name} src={recommendedTechnician.avatar} size="md" decorative />
                <div>
                  <strong>{recommendedTechnician.name}</strong>
                  <small>Disponível · {Number(recommendedTechnician.distanceKm ?? 0).toFixed(1).replace('.', ',')} km · {recommendedTechnician.specialty}</small>
                </div>
              </div>
              <button className="btn btn-primary w-100" type="button" onClick={onAssignRecommended}>
                ATRIBUIR {recommendedTechnician.name}
              </button>
            </div>
          ) : (
            <p className="control-empty-note m-0">{occurrence.metadata?.automaticDispatch?.status === 'no-technician' ? 'Despacho automático concluído sem técnico disponível.' : 'Nenhum técnico atribuído.'}</p>
          )}
          {![OPERATION_STATUS.WAITING_PART, OPERATION_STATUS.WAITING_SUPPORT].includes(occurrence.workflowStatus) && (
            <button className="btn btn-outline-primary w-100 mt-2" type="button" onClick={() => onReassign(occurrence)}>
              {occurrence.technician ? 'Reatribuir' : 'Escolher outro técnico'}
            </button>
          )}
        </section>
        <section>
          <h3>Histórico operacional</h3>
          {timeline.length > 0 ? (
            <ol className="control-event-timeline">
              {timeline.map((event, index) => (
                <li key={`${event.at}-${index}`}>
                  <time>{formatDateTime(event.at)}</time>
                  <span>{event.label}</span>
                  {index < timeline.length - 1 && <i aria-hidden="true" />}
                </li>
              ))}
            </ol>
          ) : (
            <p className="control-empty-note m-0">Nenhum evento com data e hora registrado.</p>
          )}
        </section>
      </aside>
    </div>
  );
}
