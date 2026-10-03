import { useState, useMemo, useEffect } from 'react';
import Modal from '../Modal';
import StatusBadge from '../StatusBadge';
import { ModuleIcon } from '../ModuleSidebar';
import { getLocationIconName } from '../../utils/locationIcon';
import { formatDateTime, statusToneClass } from '../../utils/presentation';
import { OPERATION_STATUS } from '../../data/operationStatus';
import { ElevatorModelScope } from '../../context/ElevatorModelContext';
import ElevatorModelViewer from '../operator/ElevatorModelViewer';

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

export default function ControlElevatorDetailModal({
  elevator,
  initialTab = 'resumo',
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [expandedOccurrences, setExpandedOccurrences] = useState({});

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, elevator?.id]);

  const history = useMemo(() => {
    return [...(elevator?.maintenanceHistory || [])].sort(
      (a, b) => new Date(b.time || 0) - new Date(a.time || 0)
    );
  }, [elevator]);

  const toggleExpand = (id) => {
    setExpandedOccurrences((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!elevator) return null;

  const locationIcon = getLocationIconName(elevator.client);
  const toneClass = statusToneClass(elevator.status);

  return (
    <Modal
      isOpen={Boolean(elevator)}
      onClose={onClose}
      className={`control-elevator-detail ${toneClass}`}
      titleId="elevator-detail-title"
      showHeader={false}
    >
      <header className="control-elevator-detail__header">
        <div className="control-elevator-detail__title-wrap">
          <div className="control-elevator-detail__avatar" aria-hidden="true">
            <ModuleIcon name={locationIcon} size={28} />
          </div>
          <div>
            <p className="eyebrow eyebrow--dark mb-1">{elevator.client?.name || 'Cliente Corporativo'}</p>
            <h2 id="elevator-detail-title" className="control-elevator-detail__title">
              {elevator.identification || 'Elevador'}
            </h2>
            <span className="control-elevator-detail__meta">
              Código {elevator.id} · {elevator.model || 'Modelo Padrão'}
            </span>
          </div>
        </div>
        <div className="control-elevator-detail__header-actions">
          <StatusBadge value={elevator.status || 'operando'} />
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
      <nav className="control-elevator-detail__tabs" role="tablist" aria-label="Navegação da ficha do elevador">
        <button
          type="button"
          role="tab"
          className={`control-elevator-detail__tab${activeTab === 'resumo' ? ' is-active' : ''}`}
          aria-selected={activeTab === 'resumo'}
          onClick={() => setActiveTab('resumo')}
        >
          Resumo do Equipamento
        </button>
        <button
          type="button"
          role="tab"
          className={`control-elevator-detail__tab${activeTab === 'historico' ? ' is-active' : ''}`}
          aria-selected={activeTab === 'historico'}
          onClick={() => setActiveTab('historico')}
        >
          Histórico ({history.length})
        </button>
        <button
          type="button"
          role="tab"
          className={`control-elevator-detail__tab${activeTab === '3d' ? ' is-active' : ''}`}
          aria-selected={activeTab === '3d'}
          onClick={() => setActiveTab('3d')}
        >
          Modelo 3D & Componentes
        </button>
      </nav>

      {/* Tab 1: Resumo */}
      {activeTab === 'resumo' && (
        <div className="control-elevator-detail__body" role="tabpanel">
          {/* Key Metrics */}
          <section className="control-elevator-detail__metrics">
            <div className="control-metric-tile">
              <span className="control-metric-tile__label">Estado Atual</span>
              <strong className="control-metric-tile__value text-capitalize">
                {elevator.status || 'Operando'}
              </strong>
            </div>
            <div className="control-metric-tile">
              <span className="control-metric-tile__label">Histórico Recente</span>
              <strong className="control-metric-tile__value">
                {elevator.recentOccurrenceCount ?? 0} chamados
              </strong>
            </div>
            <div className="control-metric-tile">
              <span className="control-metric-tile__label">Reincidência</span>
              <strong className="control-metric-tile__value">
                {elevator.recurrent ? 'Atenção (Reincidente)' : 'Sem reincidência'}
              </strong>
            </div>
            <div className="control-metric-tile">
              <span className="control-metric-tile__label">Último Chamado</span>
              <strong className="control-metric-tile__value" style={{ fontSize: '0.85rem' }}>
                {elevator.lastOccurrence ? formatDateTime(elevator.lastOccurrence.time) : 'Nenhum recente'}
              </strong>
            </div>
          </section>

          {/* Details 2-column Grid */}
          <div className="control-elevator-detail__groups">
            <section className="control-elevator-detail__group">
              <h3 className="control-elevator-detail__group-title">Identificação & Localização</h3>
              <dl className="control-detail-list">
                <div>
                  <dt>Identificação</dt>
                  <dd>{elevator.identification || 'Elevador'}</dd>
                </div>
                <div>
                  <dt>Código de Ativo</dt>
                  <dd>{elevator.id}</dd>
                </div>
                <div>
                  <dt>Cliente</dt>
                  <dd>{elevator.client?.name || 'Cliente Corporativo'}</dd>
                </div>
                <div>
                  <dt>Tipo de Local</dt>
                  <dd className="text-capitalize">{locationIcon}</dd>
                </div>
                <div>
                  <dt>Endereço</dt>
                  <dd>{elevator.address || elevator.client?.address || 'Edifício Corporativo Principal'}</dd>
                </div>
              </dl>
            </section>

            <section className="control-elevator-detail__group">
              <h3 className="control-elevator-detail__group-title">Operação & Atendimento</h3>
              <dl className="control-detail-list">
                <div>
                  <dt>Status Operacional</dt>
                  <dd><StatusBadge value={elevator.status || 'operando'} /></dd>
                </div>
                <div>
                  <dt>Chamado Ativo</dt>
                  <dd>
                    {elevator.activeOccurrence ? (
                      <span className="text-warning fw-bold">
                        {elevator.activeOccurrence.protocol} — {elevator.activeOccurrence.description}
                      </span>
                    ) : (
                      'Nenhum chamado pendente'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Última Manutenção Preventiva</dt>
                  <dd>{elevator.lastMaintenance ? formatDateTime(elevator.lastMaintenance) : '15 dias atrás'}</dd>
                </div>
                <div>
                  <dt>Próxima Manutenção Prevista</dt>
                  <dd>Em 15 dias (Ciclo Mensal)</dd>
                </div>
              </dl>
            </section>

            <section className="control-elevator-detail__group" style={{ gridColumn: '1 / -1' }}>
              <h3 className="control-elevator-detail__group-title">Especificações Técnicas</h3>
              <dl className="control-detail-list" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div>
                  <dt>Modelo</dt>
                  <dd>{elevator.model || 'Otis Gen2 Life'}</dd>
                </div>
                <div>
                  <dt>Capacidade Nominal</dt>
                  <dd>{elevator.capacity || '8 passageiros / 600 kg'}</dd>
                </div>
                <div>
                  <dt>Velocidade Nominal</dt>
                  <dd>{elevator.speed || '1.75 m/s'}</dd>
                </div>
                <div>
                  <dt>Paradas / Andares</dt>
                  <dd>{elevator.floors || '14 paradas (Subsolo ao 12º)'}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      )}

      {/* Tab 2: Histórico */}
      {activeTab === 'historico' && (
        <div className="control-elevator-detail__body" role="tabpanel">
          <div className="control-elevator-history__summary">
            <strong>{history.length} {history.length === 1 ? 'registro' : 'registros'} neste equipamento</strong>
            <span>Consulte o histórico detalhado, ordens de serviço, peças aplicadas e diagnósticos técnicos.</span>
          </div>

          {history.length > 0 ? (
            <ol className="control-timeline">
              {history.map((occurrence) => {
                const diagnosis = getDiagnosis(occurrence);
                const parts = getParts(occurrence);
                const isResolved = occurrence.operationalStatus === OPERATION_STATUS.RESOLVED || occurrence.status === 'resolvido' || occurrence.status === 'concluída';
                const isExpanded = Boolean(expandedOccurrences[occurrence.id]);

                return (
                  <li key={occurrence.id} className="control-timeline__item">
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
                        <span className="control-timeline__label">Problema / Sintomas</span>
                        <p className="control-timeline__desc">{occurrence.description}</p>
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
              Nenhuma ocorrência ou manutenção registrada para este equipamento.
            </p>
          )}
        </div>
      )}

      {/* Tab 3: Modelo 3D */}
      {activeTab === '3d' && (
        <div className="control-elevator-detail__body control-elevator-detail__body--3d" role="tabpanel">
          <ElevatorModelScope elevatorId={elevator.id}>
            <ElevatorModelViewer
              diagnosis={elevator.activeOccurrence?.metadata?.diagnosis || elevator.lastOccurrence?.metadata?.diagnosis}
              severity={elevator.activeOccurrence?.priority?.classification || 'baixa'}
            />
          </ElevatorModelScope>
        </div>
      )}
    </Modal>
  );
}
