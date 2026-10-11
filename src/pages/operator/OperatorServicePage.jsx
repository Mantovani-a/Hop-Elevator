import { useState } from 'react';
import OperatorStateMessage from '../../components/operator/OperatorStateMessage';
import OperatorCompletionForm from '../../components/operator/OperatorCompletionForm';
import ElevatorModelViewer from '../../components/operator/ElevatorModelViewer';
import PriorityIndicator from '../../components/operator/PriorityIndicator';
import RouteMap from '../../components/operator/RouteMap';
import TechnicalInfoPanel from '../../components/operator/TechnicalInfoPanel';
import StatusBadge from '../../components/StatusBadge';
import { getWorkflowStep } from '../../utils/operatorWorkflow';
import { OPERATION_STATUS } from '../../data/operationStatus';
import { ElevatorModelScope, useElevatorModel } from '../../context/ElevatorModelContext';
import { componentRecurrences } from '../../data/technicalIntelligence';
import useOperationState from '../../hooks/useOperationState';
import OperatorTeamPanel from '../../components/operator/OperatorTeamPanel.jsx';
import { operatorTechnician } from '../../data/operatorData.js';
import { canResolveOccurrence, normalizeOccurrenceTeam, teamMember, TEAM_STATUS } from '../../utils/occurrenceTeam.js';

export default function OperatorServicePage(props) {
  const elevatorId = props.occurrence?.elevatorId || props.occurrence?.elevator?.id;
  return (
    <ElevatorModelScope key={elevatorId} elevatorId={elevatorId}>
      <OperatorServiceContent {...props} />
    </ElevatorModelScope>
  );
}

function OperatorServiceContent({ occurrence, workflowStatus, onAdvance, onComplete, onMemberAction }) {
  const operationState = useOperationState();
  const [completionOpen, setCompletionOpen] = useState(false);
  const [teamNote, setTeamNote] = useState('');
  const { dynamicRegions = [] } = useElevatorModel() || {};
  if (!occurrence) {
    return <OperatorStateMessage type="error" title="Não foi possível abrir o atendimento">Volte para a fila e selecione novamente a ocorrência atribuída.</OperatorStateMessage>;
  }

  const workflowStep = getWorkflowStep(workflowStatus);
  const isMaintenance = [OPERATION_STATUS.ON_SITE, OPERATION_STATUS.MAINTENANCE, OPERATION_STATUS.RESOLVED].includes(workflowStatus);
  const diagnosis = occurrence.metadata?.diagnosis || {};
  const affectedComponents = (diagnosis.suspectedRegions || [])
    .map((regionId) => (dynamicRegions || []).find((region) => region?.id === regionId)?.label)
    .filter(Boolean);
  const signals = [
    diagnosis.source || 'Triagem da ocorrência',
    occurrence.metadata?.elevatorStopped ? 'Triagem informa equipamento indisponível' : 'Triagem informa funcionamento parcial ou intermitente',
    occurrence.metadata?.recurrence ? 'Histórico demonstrativo indica possível reincidência' : 'Sem indicação de reincidência na triagem',
  ].filter(Boolean);
  const recurrences = componentRecurrences(operationState.occurrences, occurrence.elevatorId);
  const isLeader = normalizeOccurrenceTeam(occurrence).responsibleId === operatorTechnician.id;
  const ownStatus = teamMember(occurrence, operatorTechnician.id)?.status;

  return (
    <>
      <a className="d-inline-flex align-items-center fw-bold text-decoration-none mb-3" href={`#/operator/occurrence/${occurrence.id}`} style={{ minHeight: '44px' }}><span className="me-2" aria-hidden="true">←</span> Ver ocorrência</a>
      <header className="page-header">
        <div>
          <p className="page-header__subtitle">Atendimento #{occurrence.protocol || occurrence.metadata?.serviceNumber || 'HOP-1040'}</p>
          <h1 className="page-header__title">
            {occurrence.client?.name || 'Cliente'} <span className="text-secondary fw-normal fs-5">· {occurrence.elevator?.identification || 'Elevador'}</span>
          </h1>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-3">
          <PriorityIndicator priority={occurrence.priority} />
          <StatusBadge value={workflowStatus} />
        </div>
      </header>
      <OperatorTeamPanel occurrence={occurrence} technicianId={operatorTechnician.id} />
      {!isLeader && ownStatus === TEAM_STATUS.ON_SITE && <section className="app-card p-3 p-sm-4 mb-4"><h2 className="fs-5">Sua participação</h2><label className="form-label" htmlFor="team-note">Diagnóstico / observação</label><textarea id="team-note" className="form-control mb-2" rows="3" maxLength="500" value={teamNote} onChange={(event) => setTeamNote(event.target.value)} /><div className="d-flex flex-wrap gap-2"><button className="btn btn-outline-primary" type="button" disabled={!teamNote.trim()} onClick={() => { onMemberAction?.(occurrence.id, null, teamNote.trim()); setTeamNote(''); }}>Adicionar registro</button><button className="btn btn-outline-secondary" type="button" onClick={() => onMemberAction?.(occurrence.id, TEAM_STATUS.FINISHED)}>Concluir minha participação</button></div></section>}
      {occurrence.teamNotes?.length > 0 && <section className="app-card p-3 mb-4"><h2 className="fs-5">Registros da equipe</h2>{occurrence.teamNotes.map((item, index) => <p key={`${item.at}-${index}`} className="mb-2"><strong>{item.technicianName}</strong> · {item.text}</p>)}</section>}

      {occurrence.partRequest && (
        <section className="app-card operator-resume-brief mb-4" aria-labelledby="resume-brief-title">
          <div><p className="page-header__subtitle mb-1">Retomada de atendimento</p><h2 className="fs-5 mb-0" id="resume-brief-title">Retirada de peça e retorno ao cliente</h2></div>
          <dl><div><dt>Peça</dt><dd>{occurrence.partRequest.part} ×{occurrence.partRequest.quantity}</dd></div><div><dt>Retirada</dt><dd>{occurrence.partRequest.pickupLocation || 'A definir pela Central'}</dd></div><div><dt>Diagnóstico inicial</dt><dd>{occurrence.partRequest.diagnosis}</dd></div><div><dt>Diagnosticado por</dt><dd>{occurrence.partRequest.diagnosedBy?.name || 'Técnico da primeira visita'}</dd></div></dl>
          {occurrence.partRequest.observation && <p className="mb-0 text-secondary"><strong>Observação:</strong> {occurrence.partRequest.observation}</p>}
        </section>
      )}
      {occurrence.serviceType === 'preventive' && <section className="app-card hop-operator-insight mb-4"><span>Visita programada</span><strong>Manutenção preventiva</strong><p>Verifique o equipamento, registre o componente inspecionado e conclua a visita no fluxo abaixo.</p></section>}
      {recurrences.length > 0 && <section className="app-card hop-operator-insight mb-4"><span>Histórico deste equipamento · últimos 30 dias</span><strong>{recurrences[0].label}: {recurrences[0].count} registros</strong><p>Confira o componente durante a visita e registre o resultado técnico antes de encerrar.</p></section>}

      {!completionOpen && <div className={`row g-4 mb-4${isMaintenance ? ' operator-service--on-site' : ''}`}>
        {!isMaintenance && <div className="col-12 col-lg-7"><RouteMap occurrence={occurrence} /></div>}
        <div className={isMaintenance ? 'col-12' : 'col-12 col-lg-5'}>
          <ElevatorModelViewer diagnosis={diagnosis} severity={occurrence.priority?.classification || 'baixa'} />
        </div>
      </div>}
      {completionOpen ? <section className="app-card operator-completion-stage" aria-labelledby="completion-stage-title">
        <div className="operator-completion-stage__heading"><p className="page-header__subtitle mb-1">Encerramento da visita</p><h2 id="completion-stage-title">Registrar resultado do atendimento</h2><p>{occurrence.protocol} · {occurrence.elevator?.identification || 'Elevador'}</p></div>
        {!canResolveOccurrence(occurrence, operatorTechnician.id) && isLeader && <p className="text-warning fw-bold">Equipe obrigatória incompleta. Solicite técnicos de apoio à Central antes de concluir.</p>}
        <OperatorCompletionForm occurrence={occurrence} supportOnly={!isLeader} canResolve={canResolveOccurrence(occurrence, operatorTechnician.id)} onCancel={() => setCompletionOpen(false)} onComplete={(details) => onComplete(occurrence.id, details)} />
      </section> : <div className="row g-4">
        <div className="col-12 col-lg-7">
          <TechnicalInfoPanel occurrence={occurrence} />
        </div>
        <aside className="col-12 col-lg-5" aria-labelledby="preliminary-diagnosis-title">
          <div className="app-card operator-hypothesis h-100">
          <p className="page-header__subtitle mb-1">Contexto da ocorrência</p>
          <h2 id="preliminary-diagnosis-title">{isMaintenance ? 'Apoio à verificação técnica' : 'Hipótese inicial'}</h2>
          <div className="operator-hypothesis__problem"><span>Problema relatado</span><strong>{occurrence.description}</strong></div>
          <dl className="operator-hypothesis__facts">
            <div><dt>Sistema relacionado</dt><dd>{diagnosis.system || 'Não identificado'}</dd></div>
            <div><dt>Região suspeita</dt><dd>{diagnosis.probableOrigin || 'A verificar no local'}</dd></div>
          </dl>
          {diagnosis.summary && <div className="operator-hypothesis__recommendation"><strong>Indicação da triagem</strong><p>{diagnosis.summary}</p><small>Confirmar durante a inspeção técnica.</small></div>}
          {occurrence.metadata?.reportedProblems?.length > 0 && <p className="operator-hypothesis__notes"><strong>Sintomas informados:</strong> {occurrence.metadata.reportedProblems.join(' · ')}</p>}
          {isMaintenance && (
            <div className="operator-hypothesis__notes">
              <strong>Sinais da triagem</strong><ul>{signals.map((signal) => <li key={signal}>{signal}</li>)}</ul>
              {affectedComponents.length > 0 && <><strong>Componentes relacionados</strong><p>{affectedComponents.join(' · ')}</p></>}
            </div>
          )}
          {(isLeader ? workflowStep.action : ownStatus !== TEAM_STATUS.FINISHED) && !completionOpen && (
            <button className="btn btn-primary btn-lg w-100 mt-auto" type="button" onClick={() => {
              if (!isLeader) {
                if (ownStatus === TEAM_STATUS.ON_SITE) setCompletionOpen(true);
                else onAdvance(occurrence.id);
              } else if (workflowStep.nextStatus === OPERATION_STATUS.RESOLVED) setCompletionOpen(true);
              else onAdvance(occurrence.id);
            }}>{isLeader ? workflowStep.action : ownStatus === TEAM_STATUS.ON_SITE ? 'Registrar apoio / solicitar peça' : ownStatus === TEAM_STATUS.TRAVELING ? 'Registrar chegada' : 'Iniciar deslocamento'}</button>
          )}
          </div>
        </aside>
      </div>}
    </>
  );
}
