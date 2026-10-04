import { useState } from 'react';
import OperatorStateMessage from '../../components/operator/OperatorStateMessage';
import StatusBadge from '../../components/StatusBadge';
import { OPERATION_STATUS } from '../../data/operationStatus.js';
import { formatDateTime } from '../../utils/presentation';
import HopFilterBar from '../../components/HopFilterBar';
import { getTechnicianById } from '../../data/mockData.js';
import { normalizeOccurrenceTeam, teamRoleLabel } from '../../utils/occurrenceTeam.js';

const filters = [
  { id: 'today', label: 'Hoje', days: 0 },
  { id: 'week', label: 'Últimos 7 dias', days: 7 },
  { id: 'all', label: 'Todos', days: null },
];

export default function OperatorHistory({ historyItems }) {
  const [activeFilter, setActiveFilter] = useState('today');
  const selectedFilter = filters.find((filter) => filter.id === activeFilter);
  const now = new Date();
  const filteredItems = historyItems.filter((item) => {
    if (selectedFilter.days === null) return true;
    const completed = new Date(item.completedAt);
    if (selectedFilter.days === 0) return completed.toDateString() === now.toDateString();
    return now.getTime() - completed.getTime() <= selectedFilter.days * 86400000;
  });

  return (
    <>
      <header className="page-header">
        <div>
          <p className="page-header__subtitle">Atendimentos de João Carlos</p>
          <h1 className="page-header__title">Histórico</h1>
        </div>
      </header>
      <HopFilterBar label="Filtrar histórico" quick={filters.map((filter) => [filter.id, filter.label])} active={activeFilter} onQuickChange={setActiveFilter} count={filteredItems.length} total={historyItems.length} hasFilters={activeFilter !== 'today'} onClear={() => setActiveFilter('today')} />
      {filteredItems.length ? (
        <div className="d-grid gap-3">
          {filteredItems.map((item) => (
            <article className="app-card p-3" style={{ borderLeft: '3px solid var(--color-severity-low)' }} key={item.id}>
              <div>
                <StatusBadge value={item.occurrence?.workflowStatus === OPERATION_STATUS.RESOLVED ? 'Resolvido' : 'Participação concluída'} />
                <span className="ms-2 text-secondary fw-bold text-uppercase" style={{ fontSize: '0.72rem' }}>{item.occurrence?.protocol || 'HOP-1040'}</span>
                <h2 className="fs-5 mt-2 mb-1" style={{ color: 'var(--color-text)' }}>{item.occurrence?.client?.name || 'Cliente'}</h2>
                <p className="mb-0 text-secondary" style={{ fontSize: '0.88rem' }}>{item.occurrence?.elevator?.identification || 'Elevador'} · {item.occurrence?.description || 'Atendimento concluído'}</p>
              </div>
              <dl className="row g-3 mb-0 mt-2 pt-2 border-top">
                <div className="col-12 col-md-4"><dt className="text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>Concluído</dt><dd className="fw-bold mb-0" style={{ color: 'var(--color-text)' }}>{formatDateTime(item.completedAt)}</dd></div>
                <div className="col-12 col-md-4"><dt className="text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>Duração</dt><dd className="fw-bold mb-0" style={{ color: 'var(--color-text)' }}>{item.duration}</dd></div>
                <div className="col-12 col-md-4"><dt className="text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.72rem' }}>Equipe</dt><dd className="fw-bold mb-0" style={{ color: 'var(--color-text)' }}>{normalizeOccurrenceTeam(item.occurrence).members.map((member) => `${getTechnicianById(member.technicianId)?.name || member.technicianId} (${teamRoleLabel(item.occurrence, member.technicianId)})`).join(' · ')}</dd></div>
              </dl>
              {item.occurrence?.finalDiagnosis && (
                <div className="mt-3 pt-3 border-top">
                  <p className="mb-1"><strong>Resultado:</strong> {item.occurrence.finalDiagnosis}</p>
                  <p className="mb-1"><strong>Ação realizada:</strong> {item.occurrence.solution}</p>
                  <p className="mb-0"><strong>Condição final:</strong> {item.occurrence.finalCondition}</p>
                </div>
              )}
              {item.occurrence?.workflowHistory?.length > 0 && <div className="mt-3 pt-3 border-top"><p className="fw-bold mb-2">Etapas do atendimento</p><ol className="mb-0 ps-3 text-secondary">{item.occurrence.workflowHistory.map((event, index) => <li className="mb-1" key={`${event.at}-${index}`}>{event.label} · {formatDateTime(event.at)}{event.technicianName ? ` · ${event.technicianName}` : ''}</li>)}</ol></div>}
            </article>
          ))}
        </div>
      ) : (
        <OperatorStateMessage type="empty" title="Nenhum atendimento neste período">Altere o filtro para consultar outros chamados concluídos por João Carlos.</OperatorStateMessage>
      )}
    </>
  );
}
