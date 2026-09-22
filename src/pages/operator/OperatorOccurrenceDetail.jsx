import FeedbackMessage from '../../components/FeedbackMessage';
import ProfileAvatar from '../../components/ProfileAvatar';
import OperatorStateMessage from '../../components/operator/OperatorStateMessage';
import PriorityIndicator from '../../components/operator/PriorityIndicator';
import StatusBadge from '../../components/StatusBadge';
import { operatorTechnician, quickHistoryByElevator } from '../../data/operatorData';
import { getWorkflowStep } from '../../utils/operatorWorkflow';
import { formatDate, formatDateTime } from '../../utils/presentation';
import { getSlaStatus } from '../../utils/slaCalculator';
import { OPERATION_STATUS } from '../../data/operationStore';

export default function OperatorOccurrenceDetail({ occurrence, workflowStatus, onAdvance }) {
  if (!occurrence) {
    return <OperatorStateMessage type="error" title="Não foi possível carregar a ocorrência">Verifique se o chamado ainda está atribuído a João Carlos e tente novamente.</OperatorStateMessage>;
  }

  const workflowStep = getWorkflowStep(workflowStatus);
  const isResolved = workflowStatus === OPERATION_STATUS.RESOLVED;
  const sla = getSlaStatus(occurrence);

  return (
    <>
      <a className="d-inline-flex align-items-center gap-2 mb-4 text-decoration-none fw-bold" style={{ minHeight: '44px' }} href="#/operator/occurrences"><span aria-hidden="true">&larr;</span> Voltar para ocorrências</a>
      <header className="page-header">
        <div>
          <p className="page-header__subtitle">{occurrence.protocol || occurrence.metadata?.serviceNumber || 'HOP-1040'}</p>
          <h1 className="page-header__title">{occurrence.client?.name || 'Cliente'}</h1>
          <p className="mb-0 text-secondary mt-1">{occurrence.description || 'Intercorrência reportada'}</p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-3">
          <PriorityIndicator priority={occurrence.priority} />
          <StatusBadge value={workflowStatus} />
          {sla && (
            <span
              className={`hop-badge ${sla.isBreached ? 'hop-badge--critica' : sla.isNearBreach ? 'hop-badge--atencao' : 'hop-badge--baixa'}`}
              title={sla.detail}
            >
              ⏱️ {sla.shortStatus}
            </span>
          )}
        </div>
      </header>

      {isResolved && <FeedbackMessage tone="success" title="Ocorrência resolvida">Este atendimento foi finalizado por João Carlos e já consta no histórico.</FeedbackMessage>}

      <div className="d-flex flex-column flex-xl-row gap-4 align-items-start mt-4">
        <div className="d-flex flex-column gap-4 flex-grow-1 w-100" style={{ minWidth: 0 }}>
          <section className="app-card p-3 p-sm-4" aria-labelledby="local-title">
            <h2 className="fs-5 mb-4" id="local-title">Local</h2>
            <dl className="detail-grid">
              <div><dt className="detail-item-label">Estabelecimento</dt><dd className="detail-item-value">{occurrence.client?.name || 'Cliente'}</dd></div>
              <div><dt className="detail-item-label">Tipo</dt><dd className="detail-item-value">{occurrence.client?.type || 'Estabelecimento'}</dd></div>
              <div style={{ gridColumn: '1 / -1' }}><dt className="detail-item-label">Endereço</dt><dd className="detail-item-value">{occurrence.address || 'Endereço não informado'}</dd></div>
              <div><dt className="detail-item-label">Distância</dt><dd className="detail-item-value">{Number(occurrence.metadata?.distanceKm ?? 0).toFixed(1).replace('.', ',')} km</dd></div>
            </dl>
          </section>

          <section className="app-card p-3 p-sm-4" aria-labelledby="elevator-title">
            <h2 className="fs-5 mb-4" id="elevator-title">Elevador</h2>
            <dl className="detail-grid">
              <div><dt className="detail-item-label">Identificação</dt><dd className="detail-item-value">{occurrence.elevator?.identification || 'Elevador'}</dd></div>
              <div><dt className="detail-item-label">Modelo cadastrado</dt><dd className="detail-item-value">{occurrence.elevator?.model || 'Modelo padrão'}</dd></div>
              <div><dt className="detail-item-label">Status</dt><dd className="detail-item-value"><StatusBadge value={occurrence.elevator?.status || 'operando'} /></dd></div>
              <div><dt className="detail-item-label">Última manutenção</dt><dd className="detail-item-value">{occurrence.elevator?.lastMaintenance ? formatDate(occurrence.elevator.lastMaintenance) : 'Recente'}</dd></div>
            </dl>
          </section>

          <section className="app-card p-3 p-sm-4" aria-labelledby="occurrence-title">
            <h2 className="fs-5 mb-4" id="occurrence-title">Ocorrência</h2>
            <dl className="detail-grid">
              <div style={{ gridColumn: '1 / -1' }}><dt className="detail-item-label">Problema relatado</dt><dd className="detail-item-value">{occurrence.description || 'Intercorrência reportada'}</dd></div>
              <div style={{ gridColumn: '1 / -1' }}><dt className="detail-item-label">Descrição do local</dt><dd className="detail-item-value">{occurrence.locationContext || 'Contexto operacional'}</dd></div>
              <div><dt className="detail-item-label">Horário</dt><dd className="detail-item-value">{formatDateTime(occurrence.time)}</dd></div>
              <div><dt className="detail-item-label">Pessoas presas</dt><dd className="detail-item-value">{occurrence.trappedPeople || 'Nenhuma informada'}</dd></div>
              <div><dt className="detail-item-label">Risco informado</dt><dd className="detail-item-value">{occurrence.metadata?.riskUnknown ? 'Não sei / a verificar' : occurrence.metadata?.riskToLife ? 'Sim — prioridade imediata' : 'Não'}</dd></div>
              <div style={{ gridColumn: '1 / -1' }}><dt className="detail-item-label">Informações do cliente</dt><dd className="detail-item-value">{occurrence.metadata?.clientNotes || 'Sem observações adicionais.'}</dd></div>
              {sla && <div style={{ gridColumn: '1 / -1' }}><dt className="detail-item-label">Meta Contratual de SLA</dt><dd className="detail-item-value">{sla.label} · {sla.detail}</dd></div>}
            </dl>
          </section>

          {occurrence.partRequest && <section className="app-card operator-resume-brief" aria-labelledby="part-mission-title"><p className="page-header__subtitle mb-1">Retomada de atendimento / retirada de peça</p><h2 className="fs-5 mb-3" id="part-mission-title">Relatório da primeira visita</h2><dl><div><dt>Peça a retirar</dt><dd>{occurrence.partRequest.part} ×{occurrence.partRequest.quantity}</dd></div><div><dt>Local da retirada</dt><dd>{occurrence.partRequest.pickupLocation || 'A definir'}</dd></div><div><dt>Diagnóstico inicial</dt><dd>{occurrence.partRequest.diagnosis}</dd></div><div><dt>Diagnosticado por</dt><dd>{occurrence.partRequest.diagnosedBy?.name || 'Técnico da primeira visita'}</dd></div></dl><p className="mb-0 text-secondary"><strong>Destino final:</strong> {occurrence.client?.name} · {occurrence.elevator?.identification}</p></section>}

          <section className="app-card p-3 p-sm-4" aria-labelledby="history-title">
            <h2 className="fs-5 mb-4" id="history-title">Histórico rápido</h2>
            <ul className="list-unstyled m-0 d-grid gap-2">{(quickHistoryByElevator[occurrence.elevatorId] || ['Sem registros recentes para este equipamento.']).map((item) => <li className="pb-2 border-bottom" style={{ fontSize: '0.86rem' }} key={item}>{item}</li>)}</ul>
          </section>
        </div>

        <aside className="app-card p-3 p-sm-4" style={{ width: 'min(100%, 380px)', flex: '0 0 auto', position: 'sticky', top: 'calc(var(--space-4) + 60px)' }} aria-labelledby="priority-title">
          <p className="text-primary fw-bold text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>HOP Priority Score</p>
          <h2 className="fs-4 mb-3" id="priority-title">Prioridade {occurrence.priority?.score ?? 0}/100</h2>
          <p className="text-secondary mb-2" style={{ fontSize: '0.86rem' }}>Motivos considerados no cálculo:</p>
          <ul className="list-unstyled d-grid gap-2 mb-4 pb-4 border-bottom">{(occurrence.priority?.reasons || ['Avaliação operacional padrão']).map((reason) => <li className="d-flex align-items-center gap-2" style={{ fontSize: '0.84rem', fontWeight: 650 }} key={reason}><span className="d-inline-flex align-items-center justify-content-center flex-shrink-0 rounded-circle text-primary bg-primary bg-opacity-10" style={{ width: '1.4rem', height: '1.4rem', fontSize: '0.66rem' }} aria-hidden="true">✓</span>{reason}</li>)}</ul>
          <div className="d-flex align-items-center gap-3 pb-4 mb-4 border-bottom"><ProfileAvatar name={operatorTechnician.name} src={operatorTechnician.avatar} size="md" decorative /><div><span className="d-block text-secondary" style={{ fontSize: '0.78rem' }}>Técnico responsável</span><strong className="d-block" style={{ color: 'var(--color-text)' }}>{operatorTechnician.name}</strong></div></div>
          {!isResolved && <button className="btn btn-primary btn-lg w-100 fw-bold" type="button" onClick={() => onAdvance(occurrence.id)}>{workflowStep.action}</button>}
          {workflowStatus === OPERATION_STATUS.TRAVELING && <a className="btn btn-outline-primary w-100 mt-3" href={`#/operator/service/${occurrence.id}`}>Ver rota</a>}
          {isResolved && <a className="btn btn-outline-primary w-100 fw-bold" href="#/operator/history">Ver no histórico</a>}
        </aside>
      </div>
    </>
  );
}
