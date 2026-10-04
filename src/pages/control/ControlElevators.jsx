import { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../../components/StatusBadge';
import ControlElevatorDetailModal from '../../components/control/ControlElevatorDetailModal';
import { ModuleIcon } from '../../components/ModuleSidebar';
import { getLocationIconName } from '../../utils/locationIcon';
import { displayStatus, statusToneClass } from '../../utils/presentation';
import { navigateTo } from '../../utils/navigation';
import HopFilterBar from '../../components/HopFilterBar';

const normalizeText = (value = '') =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const getElevatorType = (elevator) => {
  const source = normalizeText(`${elevator.identification} ${elevator.model}`);
  if (source.includes('hospital')) return 'Hospitalar';
  if (source.includes('servico') || source.includes('carga')) return 'Serviço';
  if (source.includes('panoram')) return 'Panorâmico';
  if (source.includes('social') || source.includes('residencial')) return 'Social';
  return 'Passageiros';
};

const initialFilters = {
  search: '',
  status: 'todos',
  client: 'todos',
  type: 'todos',
  occurrence: 'todos',
  attentionOnly: false,
};

export default function ControlElevators({ elevators, historyElevatorId = null }) {
  const [filters, setFilters] = useState(initialFilters);
  const [selectedElevator, setSelectedElevator] = useState(null);
  const [detailTab, setDetailTab] = useState('resumo');

  useEffect(() => {
    if (!historyElevatorId) return;
    const requested = elevators.find((e) => e.id === historyElevatorId);
    if (requested) {
      setSelectedElevator(requested);
      setDetailTab('historico');
    }
  }, [elevators, historyElevatorId]);

  const clients = useMemo(
    () =>
      [...new Map(elevators.map((item) => [item.client?.id || item.client?.name, item.client])).values()]
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [elevators]
  );

  const types = useMemo(
    () => [...new Set(elevators.map(getElevatorType))].sort((a, b) => a.localeCompare(b)),
    [elevators]
  );

  const filteredElevators = useMemo(() => {
    return elevators.filter((elevator) => {
      const searchSource = normalizeText(
        `${elevator.client?.name} ${elevator.identification} ${elevator.id} ${elevator.model} ${elevator.address}`
      );
      const matchesSearch = !filters.search || searchSource.includes(normalizeText(filters.search));
      const matchesStatus = filters.status === 'todos' || normalizeText(elevator.status) === filters.status;
      const matchesClient =
        filters.client === 'todos' || (elevator.client?.id || elevator.client?.name) === filters.client;
      const matchesType = filters.type === 'todos' || getElevatorType(elevator) === filters.type;
      const hasActiveOccurrence = Boolean(elevator.activeOccurrence);
      const matchesOccurrence =
        filters.occurrence === 'todos' ||
        (filters.occurrence === 'ativa' && hasActiveOccurrence) ||
        (filters.occurrence === 'sem-ativa' && !hasActiveOccurrence) ||
        (filters.occurrence === 'recentes' && (elevator.recentOccurrenceCount ?? 0) > 0);
      const matchesAttention =
        !filters.attentionOnly || ['atenção', 'em atendimento', 'parado'].includes(elevator.status);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesClient &&
        matchesType &&
        matchesOccurrence &&
        matchesAttention
      );
    });
  }, [elevators, filters]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(initialFilters);

  const handleSelectElevator = (elevator, tab = 'resumo') => {
    setSelectedElevator(elevator);
    setDetailTab(tab);
  };

  const handleCloseDetail = () => {
    setSelectedElevator(null);
    setDetailTab('resumo');
    if (historyElevatorId) {
      navigateTo('/control/elevators');
    }
  };

  return (
    <>
      <header className="page-header control-elevators-header">
        <div>
          <p className="page-header__subtitle">Parque monitorado</p>
          <h1 className="page-header__title">Elevadores</h1>
        </div>
        <span className="hop-badge px-3 py-2">
          {elevators.filter((item) => item.status === 'operando').length} Operando
        </span>
      </header>

      <HopFilterBar
        label="Filtros de elevadores"
        search={<label><span>Buscar</span><input type="search" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Cliente, elevador, código ou modelo" /></label>}
        quick={[["todos", "Todos"], ["operando", "Operando"], ["atencao", "Atenção"], ["em atendimento", "Em atendimento"], ["parado", "Parado"]]}
        active={filters.status}
        advancedActive={filters.client !== 'todos' || filters.type !== 'todos' || filters.occurrence !== 'todos' || filters.attentionOnly}
        onQuickChange={(value) => updateFilter('status', value)}
        count={filteredElevators.length}
        total={elevators.length}
        hasFilters={hasFilters}
        onClear={() => setFilters(initialFilters)}
        advanced={<div className="hop-filter-bar__fields">
          <label><span>Local / cliente</span><select value={filters.client} onChange={(event) => updateFilter('client', event.target.value)}><option value="todos">Todos</option>{clients.map((client) => <option value={client.id || client.name} key={client.id || client.name}>{client.name}</option>)}</select></label>
          <label><span>Tipo</span><select value={filters.type} onChange={(event) => updateFilter('type', event.target.value)}><option value="todos">Todos</option>{types.map((type) => <option value={type} key={type}>{type}</option>)}</select></label>
          <label><span>Ocorrência</span><select value={filters.occurrence} onChange={(event) => updateFilter('occurrence', event.target.value)}><option value="todos">Todos</option><option value="ativa">Com ocorrência ativa</option><option value="sem-ativa">Sem ocorrência ativa</option><option value="recentes">Com ocorrências recentes</option></select></label>
          <button type="button" role="switch" className={`control-switch-btn${filters.attentionOnly ? ' is-active' : ''}`} aria-checked={filters.attentionOnly} onClick={() => updateFilter('attentionOnly', !filters.attentionOnly)}><span className="control-switch-track" aria-hidden="true"><span className="control-switch-thumb" /></span><span>Somente atenção / críticos</span></button>
        </div>}
      />

      {filteredElevators.length > 0 ? (
        <section className="control-elevator-grid" aria-label="Lista de elevadores monitorados">
          {filteredElevators.map((elevator) => {
            const locationIcon = getLocationIconName(elevator.client);
            const toneClass = statusToneClass(elevator.status);
            const hasActiveOccurrence = Boolean(elevator.activeOccurrence);

            return (
              <button
                key={elevator.id}
                type="button"
                className={`control-elevator-card ${toneClass}`}
                onClick={() => handleSelectElevator(elevator, 'resumo')}
                aria-label={`Abrir ficha de ${elevator.identification}, ${elevator.client?.name || ''}, status ${displayStatus(elevator.status || 'operando')}`}
              >
                <div className="control-elevator-card__header">
                  <span className="control-elevator-card__header-left">
                    <span className="control-elevator-card__icon" aria-hidden="true">
                      <ModuleIcon name={locationIcon} size={22} />
                    </span>
                    <StatusBadge value={elevator.status || 'operando'} />
                  </span>
                  <span className="control-elevator-card__menu" aria-hidden="true">
                    <svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor"><circle cx="8" cy="4" r="1.5" /><circle cx="8" cy="10" r="1.5" /><circle cx="8" cy="16" r="1.5" /></svg>
                  </span>
                </div>

                <div className="control-elevator-card__main">
                  <p className="control-elevator-card__client" title={elevator.client?.name}>
                    {elevator.client?.name || 'Cliente Corporativo'}
                  </p>
                  <h2 className="control-elevator-card__title">
                    {elevator.identification || 'Elevador'}
                  </h2>
                </div>

                <div className="control-elevator-card__footer">
                  <span className="control-elevator-card__code">
                    <ModuleIcon name="elevator" size={15} /> {elevator.id}
                  </span>
                  {hasActiveOccurrence && (
                    <span className="control-elevator-card__alert">
                      <span className="control-elevator-card__alert-dot" aria-hidden="true" />
                      Ocorrência ativa
                    </span>
                  )}
                  <span className="control-elevator-card__action">Ver ficha →</span>
                </div>
              </button>
            );
          })}
        </section>
      ) : (
        <div className="control-empty-note">
          <strong>Nenhum elevador encontrado.</strong>
          <span>Ajuste ou limpe os filtros para visualizar outros equipamentos.</span>
        </div>
      )}

      <ControlElevatorDetailModal
        elevator={selectedElevator}
        elevatorType={selectedElevator ? getElevatorType(selectedElevator) : undefined}
        initialTab={detailTab}
        onClose={handleCloseDetail}
      />
    </>
  );
}
