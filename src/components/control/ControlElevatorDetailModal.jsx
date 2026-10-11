import { useState, useMemo, useEffect } from 'react';
import Modal from '../Modal';
import StatusBadge from '../StatusBadge';
import { ModuleIcon } from '../ModuleSidebar';
import { getLocationIconName } from '../../utils/locationIcon';
import { displayStatus, formatDate, formatDateTime, statusToneClass } from '../../utils/presentation';
import { OPERATION_STATUS } from '../../data/operationStatus';
import { ElevatorModelScope, useElevatorModel } from '../../context/ElevatorModelContext';
import ElevatorModelViewer from '../operator/ElevatorModelViewer';
import { compatibleParts, componentRecurrences } from '../../data/technicalIntelligence';
import useOperationState from '../../hooks/useOperationState';
import { preventiveStatus } from '../../utils/preventivePlanning';
import { printElevatorReport } from '../../utils/controlReports';

const getDiagnosis = (occurrence) =>
  occurrence.finalDiagnosis ||
  occurrence.partRequest?.diagnosis ||
  occurrence.metadata?.diagnosis?.summary ||
  occurrence.metadata?.diagnosis?.probableOrigin;

const getParts = (occurrence) => {
  if (!occurrence.partRequest?.part) return null;
  const quantity = occurrence.partRequest.quantity ? ` ×${occurrence.partRequest.quantity}` : '';
  return `${occurrence.partRequest.part}${quantity}`;
};

function SectionHeading({ icon, title, subtitle }) {
  return (
    <div className="control-elevator-detail__section-heading">
      <span className="control-elevator-detail__section-icon" aria-hidden="true"><ModuleIcon name={icon} size={21} /></span>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function DetailField({ icon, label, children, wide = false }) {
  return (
    <div className={`control-elevator-detail__field${wide ? ' control-elevator-detail__field--wide' : ''}`}>
      <span className="control-elevator-detail__field-icon" aria-hidden="true"><ModuleIcon name={icon} size={17} /></span>
      <div><dt>{label}</dt><dd>{children}</dd></div>
    </div>
  );
}

function SummaryTabIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h2m4 0h10M4 12h2m4 0h10M4 18h2m4 0h10" />
    </svg>
  );
}

function ModelLinkStatus() {
  const { modelUrl, restoredFromDB } = useElevatorModel();
  return <p className="control-model-link-status">{!restoredFromDB ? 'Verificando associação do modelo…' : modelUrl ? 'Modelo 3D vinculado a este elevador' : 'Nenhum modelo 3D vinculado'}</p>;
}

export default function ControlElevatorDetailModal({
  elevator,
  elevatorType,
  initialTab = 'resumo',
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const operationState = useOperationState();
  const [expandedOccurrences, setExpandedOccurrences] = useState({});
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySort, setHistorySort] = useState('recent');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, elevator?.id]);

  useEffect(() => {
    if (!elevator) return undefined;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [elevator]);

  const history = useMemo(() => {
    return [...(elevator?.maintenanceHistory || [])].sort(
      (a, b) => new Date(b.time || 0) - new Date(a.time || 0)
    );
  }, [elevator]);
  const isCompleted = (item) => item.operationalStatus === OPERATION_STATUS.RESOLVED || item.workflowStatus === OPERATION_STATUS.RESOLVED;
  const historyCounts = {
    completed: history.filter(isCompleted).length,
    ongoing: history.filter((item) => !isCompleted(item)).length,
    withParts: history.filter((item) => Boolean(item.partRequest?.part)).length,
  };
  const visibleHistory = history.filter((item) => historyFilter === 'all'
    || (historyFilter === 'completed' && isCompleted(item))
    || (historyFilter === 'ongoing' && !isCompleted(item))
    || (historyFilter === 'parts' && Boolean(item.partRequest?.part)))
    .sort((a, b) => historySort === 'recent' ? new Date(b.time) - new Date(a.time) : new Date(a.time) - new Date(b.time));
  const recurrences = elevator ? componentRecurrences(operationState.occurrences, elevator.id) : [];
  const plans = elevator ? (operationState.preventives || []).filter((plan) => plan.elevatorId === elevator.id).sort((a, b) => a.date.localeCompare(b.date)) : [];

  const toggleExpand = (id) => {
    setExpandedOccurrences((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleTabKeyDown = (event) => {
    const tabs = ['resumo', 'historico', '3d'];
    const current = tabs.indexOf(activeTab);
    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    setActiveTab(tabs[next]);
    document.getElementById(`elevator-tab-${tabs[next]}`)?.focus();
  };

  if (!elevator) return null;

  const locationIcon = getLocationIconName(elevator.client);
  const toneClass = statusToneClass(elevator.status);

  return (
    <ElevatorModelScope key={elevator.id} elevatorId={elevator.id}><Modal
      isOpen={Boolean(elevator)}
      onClose={onClose}
      className={`control-elevator-detail ${toneClass}`}
      layerClassName="control-modal-layer control-elevator-detail-layer"
      titleId="elevator-detail-title"
      showHeader={false}
    >
      <header className="control-elevator-detail__header">
        <div className="control-elevator-detail__title-wrap">
          <div className="control-elevator-detail__photo" aria-hidden="true" />
          <div>
            <p className="eyebrow eyebrow--dark mb-1 control-elevator-detail__client"><ModuleIcon name={locationIcon} size={16} />{elevator.client?.name || 'Cliente Corporativo'}</p>
            <h2 id="elevator-detail-title" className="control-elevator-detail__title">
              {elevator.identification || 'Elevador'}
            </h2>
            <div className="control-elevator-detail__title-status"><StatusBadge value={elevator.status || 'operando'} />{elevator.activeOccurrence && <span className="control-elevator-detail__active">Ocorrência ativa · {elevator.activeOccurrence.protocol}</span>}</div>
          </div>
        </div>
        <dl className="control-elevator-detail__header-meta"><div><dt>Modelo</dt><dd>{elevator.model || 'Não informado'}</dd></div><div><dt>Código</dt><dd>{elevator.id}</dd></div><div><dt>Tipo</dt><dd>{elevatorType || 'Elevador'}</dd></div><div><dt>Última manutenção</dt><dd>{elevator.lastMaintenance ? formatDate(elevator.lastMaintenance) : 'Não informada'}</dd></div></dl>
        <div className="control-elevator-detail__header-actions">
          <button type="button" className="btn btn-sm btn-outline-primary control-elevator-print" onClick={() => printElevatorReport(elevator, elevatorType, operationState.preventives || [], operationState.occurrences || [])}>Imprimir histórico do elevador</button>
          <button
            type="button"
            className="control-modal-close-btn"
            onClick={onClose}
            aria-label="Fechar ficha do elevador"
          >
            ×
          </button>
        </div>
      </header>

      {/* Tabs navigation */}
      <nav className="control-elevator-detail__tabs" role="tablist" aria-label="Navegação da ficha do elevador" onKeyDown={handleTabKeyDown}>
        <button
          type="button"
          role="tab"
          id="elevator-tab-resumo"
          aria-controls="elevator-panel-resumo"
          tabIndex={activeTab === 'resumo' ? 0 : -1}
          className={`control-elevator-detail__tab${activeTab === 'resumo' ? ' is-active' : ''}`}
          aria-selected={activeTab === 'resumo'}
          onClick={() => setActiveTab('resumo')}
        >
          <SummaryTabIcon /> Resumo
        </button>
        <button
          type="button"
          role="tab"
          id="elevator-tab-historico"
          aria-controls="elevator-panel-historico"
          tabIndex={activeTab === 'historico' ? 0 : -1}
          className={`control-elevator-detail__tab${activeTab === 'historico' ? ' is-active' : ''}`}
          aria-selected={activeTab === 'historico'}
          onClick={() => setActiveTab('historico')}
        >
          <ModuleIcon name="history" size={17} /> Histórico
        </button>
        <button
          type="button"
          role="tab"
          id="elevator-tab-3d"
          aria-controls="elevator-panel-3d"
          tabIndex={activeTab === '3d' ? 0 : -1}
          className={`control-elevator-detail__tab${activeTab === '3d' ? ' is-active' : ''}`}
          aria-selected={activeTab === '3d'}
          onClick={() => setActiveTab('3d')}
        >
          <ModuleIcon name="building" size={17} /> Modelo 3D
        </button>
      </nav>

      {/* Tab 1: Resumo */}
      {activeTab === 'resumo' && (
        <div className="control-elevator-detail__body" role="tabpanel" id="elevator-panel-resumo" aria-labelledby="elevator-tab-resumo">
          <section className="control-elevator-detail__metrics" aria-label="Indicadores do elevador">
            <div className="control-metric-tile control-metric-tile--status"><span className="control-metric-tile__icon" aria-hidden="true"><ModuleIcon name="tool" size={22} /></span><div><span className="control-metric-tile__label">Estado atual</span><strong className="control-metric-tile__value">{displayStatus(elevator.status || 'operando')}</strong></div></div>
            <div className="control-metric-tile"><span className="control-metric-tile__icon" aria-hidden="true"><ModuleIcon name="document" size={22} /></span><div><span className="control-metric-tile__label">Ocorrências registradas</span><strong className="control-metric-tile__value">{history.length}</strong></div></div>
            <div className="control-metric-tile control-metric-tile--recurrence"><span className="control-metric-tile__icon" aria-hidden="true"><ModuleIcon name="alert" size={22} /></span><div><span className="control-metric-tile__label">Reincidência</span><strong className="control-metric-tile__value">{elevator.recurrent ? 'Sim' : 'Não'}</strong></div></div>
            <div className="control-metric-tile"><span className="control-metric-tile__icon" aria-hidden="true"><ModuleIcon name="history" size={22} /></span><div><span className="control-metric-tile__label">Última manutenção</span><strong className="control-metric-tile__value">{elevator.lastMaintenance ? formatDate(elevator.lastMaintenance) : 'Não informada'}</strong></div></div>
          </section>
          <div className="control-elevator-detail__groups">
            <section className="control-elevator-detail__group control-elevator-detail__group--identity">
              <SectionHeading icon="location" title="Informações gerais" subtitle="Equipamento e local atendido." />
              <dl className="control-detail-list control-detail-list--identity">
                <DetailField icon="info" label="Código do ativo">{elevator.id}</DetailField>
                <DetailField icon="elevator" label="Elevador">{elevator.identification || 'Elevador'}</DetailField>
                <DetailField icon="building" label="Tipo">{elevatorType || 'Não informado'}</DetailField>
                <DetailField icon={locationIcon} label="Tipo de local">{elevator.client?.type || 'Não informado'}</DetailField>
                <DetailField icon="users" label="Cliente" wide>{elevator.client?.name || 'Cliente não informado'}</DetailField>
                <DetailField icon="location" label="Endereço" wide>{elevator.address || elevator.client?.address || 'Não informado'}</DetailField>
              </dl>
            </section>
            <section className="control-elevator-detail__group control-elevator-detail__group--operation">
              <SectionHeading icon="chart" title="Status e operação" subtitle="Situação do equipamento neste momento." />
              <div className="control-elevator-detail__operation">
                <span className="control-elevator-detail__operation-icon" aria-hidden="true"><ModuleIcon name={elevator.activeOccurrence ? 'tool' : 'check'} size={19} /></span>
                <div><strong>{elevator.activeOccurrence ? displayStatus(elevator.activeOccurrence.operationalStatus || 'Em andamento') : 'Sem ocorrência ativa'}</strong><span>{elevator.activeOccurrence ? `Ocorrência ${elevator.activeOccurrence.protocol || 'em aberto'}` : elevator.lastOccurrence ? `Último chamado: ${elevator.lastOccurrence.protocol} · ${formatDateTime(elevator.lastOccurrence.time)}` : 'Nenhum chamado registrado'}</span></div>
              </div>
              {elevator.lastOccurrence?.description && <p className="control-elevator-detail__report"><span>Relato mais recente</span>{elevator.lastOccurrence.description}</p>}
              {elevator.activeOccurrence && <dl className="control-elevator-detail__operation-facts"><div><dt>Chamado</dt><dd>{elevator.activeOccurrence.protocol}</dd></div><div><dt>Técnico</dt><dd>{elevator.activeOccurrence.technician?.name || 'Não atribuído'}</dd></div></dl>}
              <div className="control-elevator-detail__recent"><h4>Últimos atendimentos</h4>{history.length ? <ul>{history.slice(0, 3).map((item) => <li key={item.id}><time dateTime={item.time}>{formatDateTime(item.time)}</time><span>{item.description || item.protocol}</span></li>)}</ul> : <p>Sem atendimentos registrados.</p>}</div>
            </section>
            <section className="control-elevator-detail__group control-elevator-detail__group--technical">
              <SectionHeading icon="tool" title="Dados técnicos" subtitle="Especificações disponíveis para este equipamento." />
              <dl className="control-detail-list control-detail-list--technical">
                <DetailField icon="building" label="Modelo técnico">{elevator.model || 'Não informado'}</DetailField>
                {elevator.nextMaintenance && <DetailField icon="clock" label="Próxima manutenção prevista">{formatDate(elevator.nextMaintenance)}</DetailField>}
                {elevator.capacity && <DetailField icon="users" label="Capacidade nominal">{elevator.capacity}</DetailField>}
                {elevator.speed && <DetailField icon="chart" label="Velocidade nominal">{elevator.speed}</DetailField>}
                {elevator.floors && <DetailField icon="elevator" label="Paradas / andares">{elevator.floors}</DetailField>}
              </dl>
              <ModelLinkStatus />
              <details className="control-elevator-detail__parts"><summary>Peças compatíveis com {elevator.model || 'este elevador'}</summary><div>{compatibleParts(elevator.model).map((part) => <span key={part.id}>{part.name} <small>{part.id}</small></span>)}</div></details>
            </section>
          </div>
          {(recurrences.length > 0 || plans.length > 0) && <section className="control-elevator-detail__followup"><SectionHeading icon="history" title="Acompanhamento técnico" subtitle="Agenda e sinais deste equipamento." />
            <div>{plans.slice(0, 2).map((plan) => <p key={plan.id}><strong>{preventiveStatus(plan, operationState.occurrences)}</strong> · {formatDate(plan.date)} · {plan.window}<br /><small>{plan.note}</small></p>)}
              {recurrences.map((item) => <p className="hop-component-alert" key={item.componentId}><strong>{item.label} · {item.count} registros em 30 dias</strong><br /><small>Revisar o histórico e confirmar a causa no próximo atendimento.</small></p>)}</div>
          </section>}
        </div>
      )}
      {/* Tab 2: Histórico */}
      {activeTab === 'historico' && (
        <div className="control-elevator-detail__body" role="tabpanel" id="elevator-panel-historico" aria-labelledby="elevator-tab-historico">
          <div className="control-elevator-history__summary">
            <SectionHeading icon="history" title="Histórico de atendimentos" subtitle="Chamados, diagnósticos e intervenções neste equipamento." />
          </div>
          <div className="control-history-metrics" aria-label="Resumo do histórico"><div><strong>{history.length}</strong><span>Registros</span></div><div><strong>{historyCounts.completed}</strong><span>Concluídos</span></div><div><strong>{historyCounts.ongoing}</strong><span>Em andamento</span></div><div><strong>{historyCounts.withParts}</strong><span>Com peça</span></div></div>
          <div className="control-history-toolbar"><div role="group" aria-label="Filtrar histórico">{[['all', 'Todos'], ['ongoing', 'Em andamento'], ['completed', 'Concluídos'], ['parts', 'Com peças']].map(([value, label]) => <button type="button" key={value} className={historyFilter === value ? 'is-active' : ''} aria-pressed={historyFilter === value} onClick={() => setHistoryFilter(value)}>{label}</button>)}</div><label>Ordem<select value={historySort} onChange={(event) => setHistorySort(event.target.value)}><option value="recent">Mais recentes</option><option value="oldest">Mais antigos</option></select></label></div>

          {visibleHistory.length > 0 ? (
            <ol className="control-timeline">
              {visibleHistory.map((occurrence) => {
                const diagnosis = getDiagnosis(occurrence);
                const parts = getParts(occurrence);
                const isResolved = isCompleted(occurrence);
                const isExpanded = Boolean(expandedOccurrences[occurrence.id]);

                return (
                  <li key={occurrence.id} className={`control-timeline__item ${isResolved ? 'is-resolved' : 'is-active'}`}>
                    <article className="control-timeline__card">
                      <header className="control-timeline__header">
                        <div>
                          <time className="control-timeline__time" dateTime={occurrence.time}>
                            {formatDateTime(occurrence.time)}
                          </time>
                          <strong className="control-timeline__protocol">{occurrence.protocol}</strong>
                        </div>
                        <StatusBadge value={occurrence.operationalStatus || occurrence.status || (isResolved ? 'concluída' : 'aberto')} />
                      </header>

                      <div className="control-timeline__problem">
                        <p className="control-timeline__desc">{occurrence.description}</p>
                        <span className="control-timeline__meta">{occurrence.technician?.name || 'Técnico não atribuído'}{occurrence.duration ? ` · ${occurrence.duration}` : ''}</span>
                        {occurrence.metadata?.reportedProblems?.length > 0 && (
                          <small className="control-timeline__tags">
                            {occurrence.metadata.reportedProblems.join(' · ')}
                          </small>
                        )}
                      </div>

                      <div className="control-timeline__actions">
                        <button
                          type="button"
                          className="control-timeline__toggle-btn"
                          aria-expanded={isExpanded}
                          onClick={() => toggleExpand(occurrence.id)}
                        >
                          {isExpanded ? 'Recolher detalhes ▲' : 'Ver detalhes completos ▼'}
                        </button>
                      </div>

                      {isExpanded && (
                        <dl className="control-timeline__details">
                          {occurrence.technician?.name && (
                            <div>
                              <dt>Técnico Responsável</dt>
                              <dd>{occurrence.technician.name}</dd>
                            </div>
                          )}
                          {diagnosis && (
                            <div>
                              <dt>Diagnóstico Técnico</dt>
                              <dd>{diagnosis}</dd>
                            </div>
                          )}
                          {occurrence.solution && (
                            <div>
                              <dt>Ação Realizada</dt>
                              <dd>{occurrence.solution}</dd>
                            </div>
                          )}
                          {parts && (
                            <div>
                              <dt>Peças / Suprimentos</dt>
                              <dd>
                                {parts}
                                {occurrence.partRequest?.state ? ` (${occurrence.partRequest.state})` : ''}
                              </dd>
                            </div>
                          )}
                          {occurrence.partRequest?.diagnosedBy?.name && (
                            <div>
                              <dt>Primeira Visita</dt>
                              <dd>{occurrence.partRequest.diagnosedBy.name}</dd>
                            </div>
                          )}
                          {occurrence.partRequest?.pickupLocation && (
                            <div>
                              <dt>Retirada de Peça</dt>
                              <dd>{occurrence.partRequest.pickupLocation}</dd>
                            </div>
                          )}
                          {occurrence.finalCondition && (
                            <div>
                              <dt>Condição de Liberação</dt>
                              <dd>{occurrence.finalCondition}</dd>
                            </div>
                          )}
                          {occurrence.duration && (
                            <div>
                              <dt>Tempo Total de Atendimento</dt>
                              <dd>{occurrence.duration}</dd>
                            </div>
                          )}
                          {occurrence.completedAt && (
                            <div>
                              <dt>Conclusão</dt>
                              <dd>{formatDateTime(occurrence.completedAt)}</dd>
                            </div>
                          )}
                        </dl>
                      )}
                    </article>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="control-elevator-history__empty">
              {history.length ? 'Nenhum registro corresponde ao filtro selecionado.' : 'Nenhuma ocorrência ou manutenção registrada para este equipamento.'}
            </p>
          )}
        </div>
      )}

      {/* Tab 3: Modelo 3D */}
      {activeTab === '3d' && (
        <div className="control-elevator-detail__body control-elevator-detail__body--3d" role="tabpanel" id="elevator-panel-3d" aria-labelledby="elevator-tab-3d">
            <ElevatorModelViewer
              canManage
              diagnosis={elevator.activeOccurrence?.metadata?.diagnosis || elevator.lastOccurrence?.metadata?.diagnosis}
              severity={elevator.activeOccurrence?.priority?.classification || 'baixa'}
            />
        </div>
      )}
    </Modal></ElevatorModelScope>
  );
}
