import { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../../components/StatusBadge';
import ControlElevatorHistoryModal from '../../components/control/ControlElevatorHistoryModal';
import { formatDateTime } from '../../utils/presentation';

const normalizeText = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const getElevatorType = (elevator) => {
  const source = normalizeText(`${elevator.identification} ${elevator.model}`);
  if (source.includes('hospital')) return 'Hospitalar';
  if (source.includes('servico') || source.includes('carga')) return 'Serviço';
  if (source.includes('panoram')) return 'Panorâmico';
  if (source.includes('social') || source.includes('residencial')) return 'Social';
  return 'Passageiros';
};

const initialFilters = { search: '', status: 'todos', client: 'todos', type: 'todos', occurrence: 'todos', attentionOnly: false };

export default function ControlElevators({ elevators, historyElevatorId = null }) {
  const [filters, setFilters] = useState(initialFilters);
  const [historyElevator, setHistoryElevator] = useState(null);
  useEffect(() => {
    if (!historyElevatorId) return;
    const requestedElevator = elevators.find((elevator) => elevator.id === historyElevatorId);
    if (requestedElevator) setHistoryElevator(requestedElevator);
  }, [elevators, historyElevatorId]);
  const clients = useMemo(
    () => [...new Map(elevators.map((item) => [item.client?.id || item.client?.name, item.client])).values()].filter(Boolean).sort((a, b) => a.name.localeCompare(b.name)),
    [elevators],
  );
  const types = useMemo(() => [...new Set(elevators.map(getElevatorType))].sort((a, b) => a.localeCompare(b)), [elevators]);
  const filteredElevators = useMemo(() => elevators.filter((elevator) => {
    const searchSource = normalizeText(`${elevator.client?.name} ${elevator.identification} ${elevator.id} ${elevator.model} ${elevator.address}`);
    const matchesSearch = !filters.search || searchSource.includes(normalizeText(filters.search));
    const matchesStatus = filters.status === 'todos' || normalizeText(elevator.status) === filters.status;
    const matchesClient = filters.client === 'todos' || (elevator.client?.id || elevator.client?.name) === filters.client;
    const matchesType = filters.type === 'todos' || getElevatorType(elevator) === filters.type;
    const hasActiveOccurrence = Boolean(elevator.activeOccurrence);
    const matchesOccurrence = filters.occurrence === 'todos'
      || (filters.occurrence === 'ativa' && hasActiveOccurrence)
      || (filters.occurrence === 'sem-ativa' && !hasActiveOccurrence)
      || (filters.occurrence === 'recentes' && (elevator.recentOccurrenceCount ?? 0) > 0);
    const matchesAttention = !filters.attentionOnly || ['atenção', 'em atendimento', 'parado'].includes(elevator.status);
    return matchesSearch && matchesStatus && matchesClient && matchesType && matchesOccurrence && matchesAttention;
  }), [elevators, filters]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(initialFilters);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="page-header__subtitle">Parque monitorado</p>
          <h1 className="page-header__title">Elevadores</h1>
        </div>
        <span className="hop-badge px-3 py-2">{elevators.filter((item) => item.status === 'operando').length} operando</span>
      </header>

      <section className="control-elevator-filters" aria-label="Filtros de elevadores">
        <label className="control-elevator-search"><span>Buscar</span><input type="search" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Cliente, elevador, código ou modelo" /></label>
        <label><span>Status</span><select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}><option value="todos">Todos</option><option value="operando">Operando</option><option value="atencao">Atenção</option><option value="em atendimento">Em atendimento</option><option value="parado">Parado</option></select></label>
        <label><span>Local / cliente</span><select value={filters.client} onChange={(event) => updateFilter('client', event.target.value)}><option value="todos">Todos</option>{clients.map((client) => <option value={client.id || client.name} key={client.id || client.name}>{client.name}</option>)}</select></label>
        <label><span>Tipo</span><select value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}><option value="todos">Todos</option>{types.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
        <label><span>Ocorrência</span><select value={filters.occurrence} onChange={(event) => updateFilter('occurrence', event.target.value)}><option value="todos">Todos</option><option value="ativa">Com ocorrência ativa</option><option value="sem-ativa">Sem ocorrência ativa</option><option value="recentes">Com ocorrências recentes</option></select></label>
        <div className="control-elevator-filter-actions">
          <button type="button" className={filters.attentionOnly ? 'is-active' : ''} aria-pressed={filters.attentionOnly} onClick={() => updateFilter('attentionOnly', !filters.attentionOnly)}>Somente atenção / críticos</button>
          <button type="button" disabled={!hasFilters} onClick={() => setFilters(initialFilters)}>Limpar filtros</button>
        </div>
        <p aria-live="polite"><strong>{filteredElevators.length}</strong> de {elevators.length} elevadores exibidos</p>
      </section>

      {filteredElevators.length > 0 ? (
        <section className="row g-4 mt-2">
          {filteredElevators.map((elevator) => (
            <div className="col-12 col-sm-6 col-lg-4 col-xl-3" key={elevator.id}>
              <article className="app-card h-100 p-3 d-flex flex-column" style={{ minHeight: '245px', borderLeft: elevator.recurrent ? '4px solid var(--color-severity-high)' : '1px solid var(--color-border)' }}>
                <header className="d-flex flex-nowrap align-items-start justify-content-between gap-2 mb-3">
                  <p className="text-primary fw-bold text-uppercase text-truncate mb-0" style={{ maxWidth: 'calc(100% - 90px)', fontSize: '0.72rem', letterSpacing: '0.04em', lineHeight: 1.45 }}>{elevator.client?.name || 'Cliente Corporativo'}</p>
                  <StatusBadge value={elevator.status || 'operando'} />
                </header>
                <div className="mb-3 flex-grow-1">
                  <h2 className="fs-5 mb-1" style={{ color: 'var(--color-text)', fontWeight: 750, lineHeight: 1.35 }}>{elevator.identification || 'Elevador'}</h2>
                  <p className="text-secondary mb-1 fw-medium" style={{ fontSize: '0.86rem', lineHeight: 1.45 }}>{elevator.model || 'Passageiros'}</p>
                  <span className="control-elevator-type">{getElevatorType(elevator)} · {elevator.id}</span>
                </div>
                <dl className="d-grid gap-3 pt-3 border-top m-0" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div><dt className="detail-item-label">Último chamado</dt><dd className="detail-item-value" style={{ fontSize: '0.84rem' }}>{elevator.lastOccurrence ? formatDateTime(elevator.lastOccurrence.time) : 'Sem registro recente'}</dd></div>
                  <div><dt className="detail-item-label">Ocorrências recentes</dt><dd className="detail-item-value" style={{ fontSize: '0.84rem' }}>{elevator.recentOccurrenceCount ?? 0}</dd></div>
                </dl>
                <button className="btn btn-outline-primary w-100 mt-3" type="button" onClick={() => setHistoryElevator(elevator)}>Ver histórico</button>
              </article>
            </div>
          ))}
        </section>
      ) : <div className="control-empty-note"><strong>Nenhum elevador encontrado.</strong><span>Ajuste ou limpe os filtros para visualizar outros equipamentos.</span></div>}
      <ControlElevatorHistoryModal elevator={historyElevator} onClose={() => {
        setHistoryElevator(null);
        if (historyElevatorId) window.location.hash = '#/control/elevators';
      }} />
    </>
  );
}
