import MetricCard from '../../components/MetricCard';
import ClientElevatorCard from '../../components/client/ClientElevatorCard';
import ClientCallCard from '../../components/client/ClientCallCard';
import { clientEstablishment, clientUser, getDisplayElevator } from '../../data/clientData';
import { navigateTo } from '../../utils/navigation';

export default function ClientOverview({ displayedElevators, activeCalls, latestActiveCall, statusFor }) {
  const operatingCount = displayedElevators.filter((e) => e.clientStatus === 'Operação normal').length;
  const attentionCount = displayedElevators.filter((e) => e.clientStatus !== 'Operação normal').length;

  return (
    <>
      <section className="client-welcome mb-4">
        <div>
          <p className="client-kicker">Gestão de Elevadores</p>
          <h1>Olá, {clientUser.firstName}</h1>
          <p>Acompanhe em tempo real e gerencie os elevadores do {clientEstablishment.name}.</p>
        </div>
        <span className="client-establishment-type">{clientEstablishment.type}</span>
      </section>

      <section className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 mb-4" aria-label="Resumo dos equipamentos">
        <div className="col"><MetricCard icon="elevator" label="Total cadastrado" value={displayedElevators.length} detail="elevadores monitorados" /></div>
        <div className="col"><MetricCard icon="check" label="Operando normal" value={operatingCount} detail="sem intercorrências" tone="success" /></div>
        <div className="col"><MetricCard tone="violet" label="Em atendimento" value={attentionCount} detail="equipe técnica alocada" /></div>
        <div className="col"><MetricCard label="Chamados ativos" value={activeCalls.length} detail="na Central HOP" /></div>
      </section>

      {/* Seção Nobre e Dedicada de Registro de Ocorrência */}
      <section className="app-card client-register-card p-3 p-sm-4 mb-4" aria-labelledby="register-title">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4">
          <div className="client-register-card__content">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span className="client-register-badge">ABERTURA DE CHAMADO</span>
              <span className="text-secondary small">· Registro pelo Cliente</span>
            </div>
            <h2 className="fs-3 fw-bold mb-2" id="register-title">
              Registrar Nova Ocorrência
            </h2>
            <p className="text-secondary mb-3" style={{ maxWidth: '640px' }}>
              Notou alguma intercorrência, pessoas presas ou parada de equipamento? Registre o chamado diretamente para que o sistema HOP priorize o atendimento imediato na Central de Operações.
            </p>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="text-secondary small fw-semibold">Reportar direto em:</span>
              {displayedElevators.map((elv) => (
                <button
                  key={elv.id}
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill fw-semibold"
                  onClick={() => navigateTo(`/client/support/${elv.id}`)}
                >
                  {elv.displayName}
                </button>
              ))}
            </div>
          </div>

          <div className="d-flex flex-column align-items-stretch align-items-lg-end gap-2 flex-shrink-0">
            <button
              className="btn btn-primary btn-lg px-4"
              type="button"
              onClick={() => navigateTo('/client/support')}
            >
              <span>✚</span>
              <span>Registrar ocorrência</span>
            </button>
            <small className="text-secondary text-center text-lg-end">
              Priorização assistida com cálculo de gravidade
            </small>
          </div>
        </div>

        {latestActiveCall && (
          <div className="client-register-ongoing-note mt-4 pt-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary-subtle text-primary fw-bold">Em andamento</span>
              <span className="small">
                Chamado <strong>{latestActiveCall.protocol}</strong> ({getDisplayElevator(latestActiveCall.elevatorId, displayedElevators)?.displayName || latestActiveCall.elevatorId}) — {statusFor(latestActiveCall)}
              </span>
            </div>
            <a
              href={`#/client/call/${latestActiveCall.id}`}
              className="btn btn-sm btn-outline-primary fw-bold"
            >
              Acompanhar chamado →
            </a>
          </div>
        )}
      </section>

      <section className="client-section mb-5">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
          <div>
            <p className="page-header__subtitle mb-0">Equipamentos</p>
            <h2 className="fs-5 mb-0">Seus elevadores</h2>
          </div>
          <a href="#/client/elevators" className="fw-bold text-decoration-none" style={{ fontSize: '0.86rem' }}>
            Ver todos ({displayedElevators.length})
          </a>
        </div>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {displayedElevators.map((elevator) => (
            <div className="col" key={elevator.id}>
              <ClientElevatorCard
                elevator={elevator}
                activeCall={elevator.activeCall}
                onSupport={(id) => navigateTo(`/client/support/${id}`)}
                onViewCall={(callId) => navigateTo(`/client/call/${callId}`)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="client-section">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
          <div>
            <p className="page-header__subtitle mb-0">Acompanhamento</p>
            <h2 className="fs-5 mb-0">Chamados recentes</h2>
          </div>
          <a href="#/client/calls" className="fw-bold text-decoration-none" style={{ fontSize: '0.86rem' }}>
            Ver todos os chamados
          </a>
        </div>
        {activeCalls.length > 0 ? (
          <div className="row row-cols-1 row-cols-md-2 g-4">
            {activeCalls.slice(0, 2).map((call) => (
              <div className="col" key={call.id}>
                <ClientCallCard call={call} />
              </div>
            ))}
          </div>
        ) : (
          <div className="app-card p-4 text-center text-secondary">
            <p className="mb-0">Nenhum chamado pendente no momento. Todos os elevadores operam normalmente.</p>
          </div>
        )}
      </section>
    </>
  );
}
