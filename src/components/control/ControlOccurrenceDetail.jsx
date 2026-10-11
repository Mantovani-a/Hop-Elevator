import ProfileAvatar from '../ProfileAvatar';
import StatusBadge from '../StatusBadge';
import Modal from '../Modal';
import { displayStatus, formatDateTime, formatElapsedMinutes } from '../../utils/presentation';
import { getSlaStatus } from '../../utils/slaCalculator';
import { OPERATION_STATUS } from '../../data/operationStore';
import { componentLabel, compatibleParts, componentRecurrences } from '../../data/technicalIntelligence';
import useOperationState from '../../hooks/useOperationState';
import { printOccurrenceReport } from '../../utils/controlReports';
import { getTechnicianById } from '../../data/mockData.js';
import { normalizeOccurrenceTeam, TEAM_MODE, teamRoleLabel } from '../../utils/occurrenceTeam.js';
import { useEffect, useState } from 'react';

export default function ControlOccurrenceDetail({
  occurrence,
  recommendedTechnician,
  onAssignRecommended,
  teamCandidates = [],
  suggestedTeam = [],
  onTeamAction,
  onApplySuggestedTeam,
  onClose,
  onReassign,
  onResumePart,
  onOpenPartRequest,
}) {
  const [newMemberId, setNewMemberId] = useState('');
  useEffect(() => setNewMemberId(''), [occurrence?.id]);
  const operationState = useOperationState();
  if (!occurrence) return null;
  const recurrences = componentRecurrences(operationState.occurrences, occurrence.elevatorId);
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
  const team = normalizeOccurrenceTeam(occurrence);

  return (
    <Modal isOpen={Boolean(occurrence)} onClose={onClose} title="Detalhe da ocorrência" titleId="control-occurrence-title" showHeader={false} className="control-detail-panel" layerClassName="control-modal-layer control-detail-layer">
        <header className="control-occurrence-head"><div><p className="eyebrow eyebrow--dark">{occurrence.protocol}</p><h2 id="control-occurrence-title">Detalhe da ocorrência</h2></div><div className="control-occurrence-head__badges"><span className="control-priority-unit"><StatusBadge value={occurrence.priority?.classification || 'baixa'} type="severity" /><strong>{occurrence.priority?.score ?? 0}/100</strong></span><StatusBadge value={occurrence.operationalStatus} />{sla && occurrence.serviceType !== 'preventive' && <span className={`hop-badge ${sla.isBreached ? 'hop-badge--critica' : sla.isNearBreach ? 'hop-badge--atencao' : 'hop-badge--baixa'}`} title={sla.detail}>{sla.shortStatus}</span>}</div><button type="button" onClick={onClose} aria-label="Fechar">×</button></header>
        <div className="control-detail-panel__body">
        <div className="control-report-print-action"><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => printOccurrenceReport(occurrence)}>Imprimir relatório da ocorrência</button></div>
        {recurrences.length > 0 && <section className="hop-component-alert"><h3>Reincidência por componente</h3>{recurrences.map((item) => <p key={item.componentId}><strong>{item.label}</strong> · {item.count} registros nos últimos 30 dias. Verifique causa raiz e histórico técnico.</p>)}</section>}
        <section className="control-occurrence-summary">
          <h3>Resumo da ocorrência</h3>
          <dl>
            <div>
              <dt>Problema</dt>
              <dd>{occurrence.description || 'Intercorrência reportada'}</dd>
            </div>
            {occurrence.metadata?.reportedProblems?.length > 0 && (
              <div>
                <dt>Sintomas informados</dt>
                <dd>{occurrence.metadata.reportedProblems.join(' · ')}</dd>
              </div>
            )}
            <div>
              <dt>Horário</dt>
              <dd>{formatDateTime(occurrence.time)}</dd>
            </div>
            <div>
              <dt>Tempo aberto</dt>
              <dd>{formatElapsedMinutes(occurrence.priority?.elapsedMinutes ?? 0)}</dd>
            </div>
            <div>
              <dt>Pessoas presas</dt>
              <dd>{occurrence.trappedPeople || 'Nenhuma informada'}</dd>
            </div>
            <div>
              <dt>Risco informado</dt>
              <dd>
                {occurrence.metadata?.riskUnknown
                  ? 'Não sei / a verificar'
                  : occurrence.metadata?.riskToLife
                    ? 'Sim'
                    : 'Não'}
              </dd>
            </div>
            {sla && (
              <div>
                <dt>Meta de SLA</dt>
                <dd>{sla.label} · {sla.detail}</dd>
              </div>
            )}
          </dl>
          {occurrence.metadata?.emergencyDispatchSimulation && (
            <p className="control-confirm-copy">
              Emergência crítica confirmada · acionamento demonstrativo dos Bombeiros.
            </p>
          )}
        </section>
        <section className="control-occurrence-factors">
          <h3>Fatores críticos</h3>
          <ul className="control-reasons">
            {(occurrence.priority?.reasons || []).map((reason) => (
              <li key={reason}>
                <span aria-hidden="true">•</span>
                {reason}
              </li>
            ))}
          </ul>
          {!occurrence.priority?.reasons?.length && <p className="control-empty-note m-0">Sem fatores adicionais registrados.</p>}
        </section>

        <section className="control-occurrence-location">
          <h3>Local e elevador</h3>
          <dl>
            <div>
              <dt>Estabelecimento</dt>
              <dd>{occurrence.client?.name || 'Cliente'}</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{occurrence.client?.type || 'Estabelecimento'}</dd>
            </div>
            <div>
              <dt>Endereço</dt>
              <dd>{occurrence.address || 'Endereço não informado'}</dd>
            </div>
            <div>
              <dt>Elevador</dt>
              <dd>{occurrence.elevator?.identification || 'Elevador'}</dd>
            </div>
            <div>
              <dt>Modelo</dt>
              <dd>{occurrence.elevator?.model || 'Não informado'}</dd>
            </div>
          </dl>
        </section>

        {occurrence.partRequest && (
          <section className="control-part-detail">
            <h3>Necessidade de peça</h3>
            {occurrence.partRequest.componentId && <p>Componente: <strong>{componentLabel(occurrence.partRequest.componentId)}</strong></p>}
            {occurrence.partRequest.partId && <p>Referência compatível selecionada: <strong>{occurrence.partRequest.partId}</strong></p>}
            <div className="hop-technical-parts"><strong>Outras referências para {occurrence.elevator?.model}</strong><div>{compatibleParts(occurrence.elevator?.model, occurrence.partRequest.componentId).map((part) => <span key={part.id}>{part.name} <small>{part.id}</small></span>)}</div></div>
            <dl>
              <div>
                <dt>Peça</dt>
                <dd>{occurrence.partRequest.part}</dd>
              </div>
              <div>
                <dt>Quantidade</dt>
                <dd>{occurrence.partRequest.quantity}</dd>
              </div>
              <div>
                <dt>Urgência</dt>
                <dd>{occurrence.partRequest.urgency}</dd>
              </div>
              <div>
                <dt>Situação</dt>
                <dd>{occurrence.partRequest.state}</dd>
              </div>
              <div>
                <dt>Diagnóstico inicial</dt>
                <dd>{occurrence.partRequest.diagnosedBy?.name}</dd>
              </div>
              <div>
                <dt>Solicitada em</dt>
                <dd>{formatDateTime(occurrence.partRequest.requestedAt)}</dd>
              </div>
              {occurrence.partRequest.pickupLocation && (
                <div>
                  <dt>Retirada</dt>
                  <dd>{occurrence.partRequest.pickupLocation}</dd>
                </div>
              )}
              {occurrence.partRequest.resumedBy && (
                <div>
                  <dt>Retomada atribuída a</dt>
                  <dd>{occurrence.partRequest.resumedBy.name}</dd>
                </div>
              )}
            </dl>
            <p><strong>Motivo:</strong> {occurrence.partRequest.diagnosis}</p>
            {occurrence.partRequest.observation && (
              <p><strong>Observação:</strong> {occurrence.partRequest.observation}</p>
            )}
            <button className="btn btn-outline-primary w-100" type="button" onClick={() => onOpenPartRequest(occurrence)}>Ver solicitação de peça</button>
            {occurrence.workflowStatus === OPERATION_STATUS.WAITING_PART && (
              <button
                className="btn btn-primary w-100"
                type="button"
                onClick={() => onResumePart(occurrence)}
              >
                PEÇA DISPONÍVEL — RETOMAR ATENDIMENTO
              </button>
            )}
          </section>
        )}

        {occurrence.supportRequest && (
          <section>
            <h3>Suporte da central</h3>
            <p>
              <strong>Solicitado por {occurrence.supportRequest.requestedBy?.name}:</strong>{' '}
              {occurrence.supportRequest.reason}
            </p>
            {occurrence.supportRequest.observation && (
              <p>{occurrence.supportRequest.observation}</p>
            )}
            <StatusBadge value={occurrence.supportRequest.state} />
          </section>
        )}

        {occurrence.workflowStatus === OPERATION_STATUS.RESOLVED && occurrence.finalDiagnosis && (
          <section>
            <h3>Encerramento técnico</h3>
            <dl>
              <div>
                <dt>Resultado</dt>
                <dd>{occurrence.finalDiagnosis}</dd>
              </div>
              <div>
                <dt>Ação realizada</dt>
                <dd>{occurrence.solution}</dd>
              </div>
              <div>
                <dt>Condição final</dt>
                <dd>{occurrence.finalCondition}</dd>
              </div>
              <div>
                <dt>Conclusão</dt>
                <dd>{formatDateTime(occurrence.completedAt)}</dd>
              </div>
            </dl>
          </section>
        )}
        <section className="control-occurrence-assignment">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2"><h3 className="mb-0">Equipe em campo</h3><select className="form-select form-select-sm" style={{ width: 'auto' }} aria-label="Tipo de atendimento" value={team.mode} onChange={(event) => onTeamAction?.('mode', null, event.target.value)}><option value={TEAM_MODE.INDIVIDUAL}>Individual</option><option value={TEAM_MODE.RECOMMENDED}>Equipe recomendada</option><option value={TEAM_MODE.REQUIRED}>Equipe obrigatória</option></select></div>
          {team.mode !== TEAM_MODE.INDIVIDUAL && team.members.length < team.requiredCount && <p className="control-confirm-copy mt-2">{team.mode === TEAM_MODE.REQUIRED ? 'Equipe necessária' : 'Equipe recomendada'} · {team.members.length}/{team.requiredCount} técnicos atribuídos</p>}
          {team.members.length > 0 && <div className="d-grid gap-2 mt-3">{team.members.map((member) => { const technician = getTechnicianById(member.technicianId); return <div key={member.technicianId} className="d-flex align-items-center justify-content-between flex-wrap gap-2 border-bottom pb-2"><div><strong>{technician?.name || member.technicianId}</strong><small className="d-block text-secondary">{teamRoleLabel(occurrence, member.technicianId)} · {technician?.specialty || 'Especialidade não informada'} · {member.status}</small></div>{member.role === 'support' && <div className="d-flex gap-2"><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => onTeamAction?.('leader', member.technicianId)}>Transferir liderança</button><button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => onTeamAction?.('remove', member.technicianId)}>Remover</button></div>}</div>; })}</div>}
          {teamCandidates.length > 0 && <div className="d-flex gap-2 mt-3"><select className="form-select" aria-label="Selecionar técnico de apoio" value={newMemberId} onChange={(event) => setNewMemberId(event.target.value)}><option value="">Selecionar técnico disponível</option>{teamCandidates.map((technician) => <option key={technician.id} value={technician.id}>{technician.name} · {technician.specialty}</option>)}</select><button className="btn btn-outline-primary" type="button" disabled={!newMemberId} onClick={() => { onTeamAction?.('add', newMemberId); setNewMemberId(''); }}>Adicionar técnico</button></div>}
          {team.mode !== TEAM_MODE.INDIVIDUAL && suggestedTeam.length > 0 && <div className="control-dispatch-recommendation mt-3"><p className="eyebrow eyebrow--dark">Equipe sugerida</p><ul className="mb-2">{suggestedTeam.map(({ technician, distanceKm, reasons }) => <li key={technician.id}><strong>{technician.name}</strong> · {technician.specialty} · {Number(distanceKm).toFixed(1).replace('.', ',')} km <small className="d-block">{reasons?.slice(1, 3).join(' · ')}</small></li>)}</ul><button className="btn btn-sm btn-primary" type="button" onClick={onApplySuggestedTeam}>Aplicar equipe sugerida</button></div>}
          <h3 className="mt-3">Técnico e atendimento</h3>
          {occurrence.metadata?.requiresReassignment && <p className="control-confirm-copy">Técnico atribuído está indisponível. A ocorrência permanece aberta e exige reatribuição.</p>}
          {occurrence.technician ? (
            <div className={`control-assignment-card${automaticAssignment ? ' is-automatic' : ''}`}>
              {automaticAssignment && <span className="control-assignment-card__label">Técnico atribuído automaticamente</span>}
              <div className="control-assignee">
                <ProfileAvatar name={occurrence.technician.name} src={occurrence.technician.avatar} size="md" decorative />
                <div>
                  <strong>{occurrence.technician.name}</strong>
                  <small>{displayStatus(occurrence.operationalStatus)} · {Number(occurrence.metadata?.distanceKm ?? 0).toFixed(1).replace('.', ',')} km · ETA demonstrativo {occurrence.metadata?.etaMinutes ?? 10} min</small>
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
        {occurrence.teamNotes?.length > 0 && <section className="control-occurrence-timeline"><h3>Diagnósticos e observações da equipe</h3><div className="d-grid gap-2">{occurrence.teamNotes.map((note, index) => <p className="mb-0" key={`${note.at}-${index}`}><strong>{note.technicianName || getTechnicianById(note.technicianId)?.name || note.technicianId}</strong> · {formatDateTime(note.at)}<br />{note.text}</p>)}</div></section>}
        <section className="control-occurrence-timeline">
          <h3>Histórico operacional</h3>
          {timeline.length > 0 ? (
            <ol className="control-event-timeline">
              {timeline.map((event, index) => (
                <li key={`${event.at}-${index}`}>
                  <time>{formatDateTime(event.at)}</time>
                  <span>{event.label}{event.technicianName && <small className="d-block text-secondary">Por {event.technicianName}</small>}{!event.technicianName && event.author && <small className="d-block text-secondary">Por {event.author}</small>}</span>
                  {index < timeline.length - 1 && <i aria-hidden="true" />}
                </li>
              ))}
            </ol>
          ) : (
            <p className="control-empty-note m-0">Nenhum evento com data e hora registrado.</p>
          )}
        </section>
        </div>
    </Modal>
  );
}
