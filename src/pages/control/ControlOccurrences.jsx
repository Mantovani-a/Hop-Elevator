import { useState } from 'react';
import StatusBadge from '../../components/StatusBadge';
import { formatDateTime, formatElapsedMinutes } from '../../utils/presentation';
import { OPERATION_STATUS } from '../../data/operationStore';

const filters = [
  ['all', 'Todas'], ['active', 'Ativas'], ['attending', 'Em atendimento'], ['waiting-part', 'Aguardando peça'], ['completed', 'Concluídas'], ['parts', 'Peças'], ['support', 'Suporte'], ['critical', 'Críticas'], ['unassigned', 'Sem técnico'], ['traveling', 'Em deslocamento'],
];

function ControlPartPendingPanel({ partOccurrences, onSelectOccurrence }) {
  if (!partOccurrences.length) return null;

  return (
    <section className="control-part-panel mb-4" aria-labelledby="part-pending-title">
      <div className="control-part-panel__head">
        <div>
          <p className="page-header__subtitle mb-1">Pendências operacionais</p>
          <h2 className="fs-5 mb-0" id="part-pending-title">Peças e retomadas</h2>
        </div>
        <span className="hop-badge">{partOccurrences.length} ocorrência(s)</span>
      </div>
      <div className="control-part-grid">
        {partOccurrences.map((occurrence) => {
          const waitingMinutes = Math.max(
            0,
            Math.floor((Date.now() - new Date(occurrence.partRequest?.requestedAt || occurrence.time).getTime()) / 60000)
          );
          return (
            <button
              type="button"
              key={occurrence.id}
              onClick={() => onSelectOccurrence(occurrence.id)}
            >
              <header>
                <strong>{occurrence.protocol}</strong>
                <StatusBadge value={occurrence.operationalStatus} />
              </header>
              <h3>{occurrence.client?.name} · {occurrence.elevator?.identification}</h3>
              <p>
                <strong>{occurrence.partRequest.part} ×{occurrence.partRequest.quantity}</strong> · {occurrence.partRequest.state}
              </p>
              <footer>
                <span>Diagnóstico: {occurrence.partRequest.diagnosedBy?.name}</span>
                <span>{occurrence.priority?.classification} · {formatElapsedMinutes(waitingMinutes)}</span>
              </footer>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function ControlOccurrences({ occurrences, onSelectOccurrence, onViewReport }) {
  const [filter, setFilter] = useState('all');
  const active = occurrences.filter((occurrence) => occurrence.operationalStatus !== OPERATION_STATUS.RESOLVED);
  const partOccurrences = active.filter((occurrence) => occurrence.partRequest);
  const filtered = occurrences.filter((occurrence) => {
    const isActive = occurrence.operationalStatus !== OPERATION_STATUS.RESOLVED;
    if (filter === 'all') return true;
    if (filter === 'active') return isActive;
    if (filter === 'completed') return !isActive;
    if (filter === 'critical') return isActive && occurrence.priority?.classification === 'crítica';
    if (filter === 'parts') return isActive && Boolean(occurrence.partRequest);
    if (filter === 'waiting-part') return occurrence.operationalStatus === OPERATION_STATUS.WAITING_PART;
    if (filter === 'support') return occurrence.operationalStatus === OPERATION_STATUS.WAITING_SUPPORT;
    if (filter === 'unassigned') return isActive && !occurrence.technicianId;
    if (filter === 'traveling') return isActive && [OPERATION_STATUS.TRAVELING, OPERATION_STATUS.TRAVELING_TO_PICKUP, OPERATION_STATUS.RETURNING_TO_CLIENT].includes(occurrence.operationalStatus);
    if (filter === 'attending') return isActive && [OPERATION_STATUS.ON_SITE, OPERATION_STATUS.MAINTENANCE].includes(occurrence.operationalStatus);
    return false;
  }).sort((first, second) => filter === 'completed'
    ? new Date(second.completedAt || 0) - new Date(first.completedAt || 0)
    : 0);

  const openOccurrence = (occurrence) => {
    if (occurrence.operationalStatus === OPERATION_STATUS.RESOLVED) onViewReport(occurrence.id);
    else onSelectOccurrence(occurrence.id);
  };

  return (
    <>
      <header className="page-header">
        <div>
          <p className="page-header__subtitle">Fila operacional</p>
          <h1 className="page-header__title">Ocorrências</h1>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <span className="hop-badge px-3 py-2">{active.length} ativas</span>
        </div>
      </header>

      <div className="d-flex gap-2 my-3 pb-1 overflow-x-auto" role="group" aria-label="Filtrar ocorrências">
        {filters.map(([id, label]) => (
          <button
            key={id}
            className={`btn btn-sm rounded-pill text-nowrap flex-shrink-0 ${filter === id ? 'btn-primary' : 'btn-outline-secondary'}`}
            aria-pressed={filter === id}
            type="button"
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {filter !== 'completed' && (
        <ControlPartPendingPanel
          partOccurrences={partOccurrences}
          onSelectOccurrence={onSelectOccurrence}
        />
      )}

      <section className="app-card overflow-hidden" aria-label="Fila de ocorrências">
        <div className="w-100 overflow-x-auto">
          <table className="w-100 table table-hover mb-0" style={{ minWidth: '1120px', fontSize: '0.8rem' }}>
            <thead className="text-secondary text-uppercase" style={{ backgroundColor: 'var(--color-surface-hover)', fontSize: '0.68rem', letterSpacing: '0.04em' }}>
              <tr>
                <th className="p-3 fw-bold border-0">Protocolo</th>
                <th className="p-3 fw-bold border-0">Prioridade</th>
                <th className="p-3 fw-bold border-0">Estabelecimento</th>
                <th className="p-3 fw-bold border-0">Elevador / problema</th>
                <th className="p-3 fw-bold border-0">Técnico</th>
                <th className="p-3 fw-bold border-0">Status</th>
                <th className="p-3 fw-bold border-0">Tempo / conclusão</th>
                <th className="p-3 fw-bold border-0">Ação</th>
              </tr>
            </thead>
            <tbody className="border-top">
              {filtered.map((occurrence) => {
                const isCompleted = occurrence.operationalStatus === OPERATION_STATUS.RESOLVED;
                return (
                  <tr key={occurrence.id} onClick={() => openOccurrence(occurrence)} style={{ cursor: 'pointer' }}>
                    <td className="p-3 align-middle">
                      <button
                        className="btn btn-link p-0 text-primary fw-bold text-decoration-none"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openOccurrence(occurrence);
                        }}
                      >
                        {occurrence.protocol}
                      </button>
                    </td>
                    <td className="p-3 align-middle">
                      <div className="d-flex align-items-center">
                        <StatusBadge value={occurrence.priority?.classification || 'baixa'} type="severity" />
                        <strong className="ms-2 fs-6">{occurrence.priority?.score ?? 0}</strong>
                      </div>
                    </td>
                    <td className="p-3 align-middle">
                      <strong className="d-block" style={{ color: 'var(--color-text)' }}>
                        {occurrence.client?.name || 'Cliente'}
                      </strong>
                      <small className="d-block text-secondary mt-1 text-truncate" style={{ maxWidth: '270px' }}>
                        {occurrence.client?.type || 'Estabelecimento'}
                      </small>
                    </td>
                    <td className="p-3 align-middle">
                      <strong className="d-block" style={{ color: 'var(--color-text)' }}>
                        {occurrence.elevator?.identification || 'Elevador'}
                      </strong>
                      <small className="d-block text-secondary mt-1 text-truncate" style={{ maxWidth: '270px' }}>
                        {occurrence.partRequest
                          ? `${occurrence.partRequest.part} ×${occurrence.partRequest.quantity} · ${occurrence.partRequest.state}`
                          : occurrence.description || 'Intercorrência reportada'}
                      </small>
                    </td>
                    <td className="p-3 align-middle">
                      {occurrence.technician?.name || <span className="text-danger fw-bold">Sem técnico</span>}
                      {occurrence.metadata?.requiresReassignment && (
                        <small className="d-block text-danger fw-bold mt-1">Técnico indisponível · reatribuir</small>
                      )}
                    </td>
                    <td className="p-3 align-middle">
                      <StatusBadge value={isCompleted ? 'Concluída' : occurrence.operationalStatus} />
                    </td>
                    <td className="p-3 align-middle fw-bold">
                      {isCompleted ? (
                        <>
                          <span className="d-block">{formatDateTime(occurrence.completedAt)}</span>
                          {occurrence.duration && (
                            <small className="d-block text-secondary mt-1">Duração: {occurrence.duration}</small>
                          )}
                        </>
                      ) : (
                        formatElapsedMinutes(occurrence.priority?.elapsedMinutes ?? 0)
                      )}
                    </td>
                    <td className="p-3 align-middle">
                      {isCompleted ? (
                        <button
                          className="btn btn-sm btn-outline-primary text-nowrap"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onViewReport(occurrence.id);
                          }}
                        >
                          Ver relatório
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-link p-0 text-decoration-none text-nowrap"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectOccurrence(occurrence.id);
                          }}
                        >
                          Ver detalhes
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <p className="d-flex flex-column gap-1 m-5 p-4 rounded-3 text-muted bg-light text-center">
            Nenhuma ocorrência corresponde ao filtro selecionado.
          </p>
        )}
      </section>
    </>
  );
}
