import { useState } from 'react';
import OperatorStateMessage from '../../components/operator/OperatorStateMessage';
import OperatorCompletionForm from '../../components/operator/OperatorCompletionForm';
import ElevatorModelViewer, { elevatorRegions } from '../../components/operator/ElevatorModelViewer';
import PriorityIndicator from '../../components/operator/PriorityIndicator';
import RouteMap from '../../components/operator/RouteMap';
import TechnicalInfoPanel from '../../components/operator/TechnicalInfoPanel';
import StatusBadge from '../../components/StatusBadge';
import { getWorkflowStep } from '../../utils/operatorWorkflow';
import { OPERATION_STATUS } from '../../data/operationStatus';

export default function OperatorServicePage({ occurrence, workflowStatus, onAdvance, onComplete }) {
  const [completionOpen, setCompletionOpen] = useState(false);
  if (!occurrence) {
    return <OperatorStateMessage type="error" title="Não foi possível abrir o atendimento">Volte para a fila e selecione novamente a ocorrência atribuída.</OperatorStateMessage>;
  }

  const workflowStep = getWorkflowStep(workflowStatus);
  const isMaintenance = [OPERATION_STATUS.ON_SITE, OPERATION_STATUS.MAINTENANCE, OPERATION_STATUS.RESOLVED].includes(workflowStatus);
  const diagnosis = occurrence.metadata?.diagnosis || {};
  const affectedComponents = (diagnosis.suspectedRegions || [])
    .map((regionId) => elevatorRegions.find((region) => region.id === regionId)?.label)
    .filter(Boolean);
  const signals = [
    diagnosis.source || 'Triagem da ocorrência',
    occurrence.metadata?.elevatorStopped ? 'Triagem informa equipamento indisponível' : 'Triagem informa funcionamento parcial ou intermitente',
    occurrence.metadata?.recurrence ? 'Histórico demonstrativo indica possível reincidência' : 'Sem indicação de reincidência na triagem',
  ].filter(Boolean);
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

      {occurrence.partRequest && (
        <section className="app-card operator-resume-brief mb-4" aria-labelledby="resume-brief-title">
          <div><p className="page-header__subtitle mb-1">Retomada de atendimento</p><h2 className="fs-5 mb-0" id="resume-brief-title">Retirada de peça e retorno ao cliente</h2></div>
          <dl><div><dt>Peça</dt><dd>{occurrence.partRequest.part} ×{occurrence.partRequest.quantity}</dd></div><div><dt>Retirada</dt><dd>{occurrence.partRequest.pickupLocation || 'A definir pela Central'}</dd></div><div><dt>Diagnóstico inicial</dt><dd>{occurrence.partRequest.diagnosis}</dd></div><div><dt>Diagnosticado por</dt><dd>{occurrence.partRequest.diagnosedBy?.name || 'Técnico da primeira visita'}</dd></div></dl>
          {occurrence.partRequest.observation && <p className="mb-0 text-secondary"><strong>Observação:</strong> {occurrence.partRequest.observation}</p>}
        </section>
      )}

      <div className="row g-4 mb-4">
        {!isMaintenance && <div className="col-12 col-xl-8"><RouteMap occurrence={occurrence} /></div>}
        <div className={isMaintenance ? 'col-12' : 'col-12 col-xl-4'}>
          <ElevatorModelViewer diagnosis={diagnosis} severity={occurrence.priority?.classification || 'baixa'} />
        </div>
      </div>
      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <TechnicalInfoPanel occurrence={occurrence} />
        </div>
        <aside className="col-12 col-xl-4" aria-labelledby="preliminary-diagnosis-title">
          <div className="app-card p-3 p-sm-4 h-100">
          <p className="text-primary fw-bold text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>Contexto da ocorrência</p>
          <h2 className="fs-5 mb-4" id="preliminary-diagnosis-title">{isMaintenance ? 'Apoio à verificação técnica' : 'Hipótese inicial'}</h2>
          <dl className="d-grid gap-3 mb-4">
            <div><dt className="text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>Problema relatado</dt><dd className="fw-bold mb-0">{occurrence.description}</dd></div>
            {occurrence.metadata?.reportedProblems?.length > 0 && <div><dt className="text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>Sintomas informados</dt><dd className="fw-bold mb-0">{occurrence.metadata.reportedProblems.join(' · ')}</dd></div>}
            <div><dt className="text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>Código demonstrativo</dt><dd className="fw-bold mb-0">{diagnosis.demoCode}</dd></div>
            <div><dt className="text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>Sistema relacionado</dt><dd className="fw-bold mb-0">{diagnosis.system}</dd></div>
            <div><dt className="text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>Região suspeita</dt><dd className="fw-bold mb-0">{diagnosis.probableOrigin}</dd></div>
          </dl>
          <p className="p-3 rounded mb-3 fw-bold" style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary-text)', fontSize: '0.88rem' }}>Indicação baseada na triagem. Necessita verificação técnica.</p>
          <p className="text-secondary mb-4" style={{ fontSize: '0.88rem' }}>{diagnosis.summary}</p>
          {isMaintenance && (
            <div className="d-grid gap-4 mt-4 pt-4 border-top">
              <section><h3 className="fs-6 mb-3">Sinais da triagem</h3><ul className="text-secondary m-0 ps-3" style={{ fontSize: '0.9rem' }}>{signals.map((signal) => <li className="mb-2" key={signal}>{signal}</li>)}</ul></section>
              <section><h3 className="fs-6 mb-3">Componentes relacionados</h3><ul className="text-secondary m-0 ps-3" style={{ fontSize: '0.9rem' }}>{affectedComponents.map((component) => <li className="mb-2" key={component}>{component}</li>)}</ul></section>
            </div>
          )}
          {workflowStep.action && !completionOpen && (
            <button className="btn btn-primary btn-lg w-100 mt-auto" type="button" onClick={() => {
              if (workflowStep.nextStatus === OPERATION_STATUS.RESOLVED) setCompletionOpen(true);
              else onAdvance(occurrence.id);
            }}>{workflowStep.action}</button>
          )}
          {completionOpen && <OperatorCompletionForm onCancel={() => setCompletionOpen(false)} onComplete={(details) => onComplete(occurrence.id, details)} />}
          </div>
        </aside>
      </div>
    </>
  );
}
