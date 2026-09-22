import ClientCallCard from '../../components/client/ClientCallCard';

export default function ClientCalls({ activeCalls, resolvedCalls }) {
  return (
    <>
      <header className="page-header mb-4">
        <div>
          <p className="page-header__subtitle">Acompanhamento de solicitações</p>
          <h1 className="page-header__title">Chamados</h1>
        </div>
      </header>

      <section className="mb-5">
        <h2 className="fs-5 mb-3 pb-2 border-bottom">Em andamento</h2>
        {activeCalls.length > 0 ? (
          <div className="row row-cols-1 row-cols-md-2 g-4">
            {activeCalls.map((call) => (
              <div className="col" key={call.id}>
                <ClientCallCard call={call} />
              </div>
            ))}
          </div>
        ) : (
          <div className="app-card p-4 text-secondary">
            <p className="mb-0">Nenhum chamado em andamento no momento.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="fs-5 mb-3 pb-2 border-bottom">Concluídos</h2>
        {resolvedCalls.length > 0 ? (
          <div className="row row-cols-1 row-cols-md-2 g-4">
            {resolvedCalls.map((call) => (
              <div className="col" key={call.id}>
                <ClientCallCard call={call} />
              </div>
            ))}
          </div>
        ) : (
          <div className="app-card p-4 text-secondary">
            <p className="mb-0">Nenhum chamado concluído registrado ainda.</p>
          </div>
        )}
      </section>
    </>
  );
}
