import { ModuleIcon } from '../../components/ModuleSidebar';
import ClientStatusTimeline from '../../components/client/ClientStatusTimeline';
import ProfileAvatar from '../../components/ProfileAvatar';
import StatusBadge from '../../components/StatusBadge';
import { clientElevators, clientEstablishment } from '../../data/clientData';
import { getTechnicianById } from '../../data/mockData';
import { OPERATION_STATUS } from '../../data/operationStore';
import { formatDateTime } from '../../utils/presentation';

const getDisplayElevator = (elevatorId) => clientElevators.find((elevator) => elevator.id === elevatorId);

export default function ClientCallDetail({ call, newCallId, statusFor }) {
  const elevator = getDisplayElevator(call.elevatorId);
  const status = statusFor(call);
  const workflow = call.workflowStatus;
  const isResolved = status === OPERATION_STATUS.RESOLVED;
  const assignedTechnician = getTechnicianById(call.assignedTechnicianId || call.technicianId);

  return (
    <>
      <a className="client-back-link mb-3 text-decoration-none fw-bold d-inline-block" href="#/client/calls">
        ← Voltar para chamados
      </a>
      {newCallId === call.id && (
        <div className="client-success-banner mb-4" role="status">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Ocorrência registrada com sucesso</strong>
            <p>As informações foram enviadas para a Central de Operações e a prioridade foi calculada.</p>
          </div>
        </div>
      )}
      <section className="app-card client-call-detail p-4 p-md-5">
        <header className="d-flex flex-wrap align-items-start justify-content-between gap-3 pb-4 border-bottom">
          <div>
            <p className="page-header__subtitle mb-1">Chamado {call.protocol}</p>
            <h1 className="page-header__title mb-1">{elevator?.displayName || call.elevatorId}</h1>
            <p className="text-secondary mb-0">{call.detectedFailure || call.description}</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <StatusBadge value={call.priority?.classification || 'atenção'} type="severity" />
            <StatusBadge value={status} />
          </div>
        </header>

        <div className="client-confirmation-grid my-4">
          <div>
            <i><ModuleIcon name="document" /></i><div><span>Protocolo</span><strong>{call.protocol}</strong></div>
          </div>
          <div>
            <i><ModuleIcon name="clock" /></i><div><span>Horário</span><strong>{formatDateTime(call.time)}</strong></div>
          </div>
          <div>
            <i><ModuleIcon name="alert" /></i><div><span>Prioridade</span><strong>{call.priority?.classification || 'Normal'} ({call.priority?.score || 0} pts)</strong></div>
          </div>
          <div>
            <i><ModuleIcon name="check" /></i><div><span>Status atual</span><strong>{status}</strong></div>
          </div>
        </div>

        <div className="client-priority-copy mb-4 p-3 rounded">
          <strong>
            {call.priority?.classification === 'crítica'
              ? 'Atendimento classificado como crítico.'
              : `Sua solicitação recebeu prioridade ${call.priority?.classification || 'moderada'}.`}
          </strong>
          <p className="mb-0 mt-1">
            A prioridade considera as respostas enviadas ({call.trappedPeople > 0 ? `${call.trappedPeople} pessoa(s) presa(s)` : 'sem pessoas presas'}) e o contexto do estabelecimento ({clientEstablishment.type}).
          </p>
        </div>

        <div className="client-detail-columns row g-4 mt-2">
          <div className="col-12 col-lg-7">
            <h2 className="fs-5 mb-3">Acompanhamento do chamado</h2>
            <ClientStatusTimeline call={call} />
          </div>
          <div className="col-12 col-lg-5">
            <h2 className="fs-5 mb-3">Técnico responsável</h2>
            {assignedTechnician ? (
              <div className="client-technician-card p-3 d-flex align-items-center gap-3">
                <ProfileAvatar name={assignedTechnician.name} src={assignedTechnician.avatar} category="operators" size="lg" decorative />
                <div>
                  <p className="page-header__subtitle mb-1">
                    {workflow === OPERATION_STATUS.TRAVELING
                      ? 'Técnico a caminho'
                      : workflow === OPERATION_STATUS.ON_SITE
                        ? 'Técnico no local'
                        : workflow === OPERATION_STATUS.MAINTENANCE
                          ? 'Técnico realizando atendimento'
                          : isResolved
                            ? 'Atendimento concluído'
                            : 'Técnico atribuído'}
                  </p>
                  <h3 className="fs-5 mb-1">{assignedTechnician.name}</h3>
                  {workflow === OPERATION_STATUS.TRAVELING && (
                    <p className="text-secondary mb-0" style={{ fontSize: '0.84rem' }}>
                      Chegada estimada: {call.metadata?.etaMinutes || 7} min
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="client-waiting-card p-3 d-flex align-items-start gap-3">
                <span className="fs-4 text-primary" aria-hidden="true">◎</span>
                <div>
                  <strong>Aguardando atribuição</strong>
                  <p className="text-secondary mb-0" style={{ fontSize: '0.84rem' }}>
                    A Central de Operações está selecionando o técnico mais próximo e qualificado.
                  </p>
                </div>
              </div>
            )}
            {isResolved && call.completedAt && (
              <div className="client-completed-note mt-3 p-3 rounded" style={{ backgroundColor: 'var(--color-severity-low-soft)', color: 'var(--color-severity-low-text)' }}>
                <strong>Atendimento concluído em {formatDateTime(call.completedAt)}.</strong>
                {call.finalDiagnosis && <p className="mb-0 mt-1">Resultado: {call.finalDiagnosis}</p>}
                {call.solution && <p className="mb-0 mt-1">Solução: {call.solution}</p>}
                {call.finalCondition && <p className="mb-0 mt-1">Condição final: {call.finalCondition}</p>}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
