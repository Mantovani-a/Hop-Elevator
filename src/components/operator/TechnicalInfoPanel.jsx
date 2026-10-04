import { formatDate, formatDateTime } from '../../utils/presentation';
import useOperationState from '../../hooks/useOperationState';
import StatusBadge from '../StatusBadge';

function InfoRow({ label, children }) {
  return <div className="operator-technical-row"><dt>{label}</dt><dd>{children}</dd></div>;
}

export default function TechnicalInfoPanel({ occurrence }) {
  const { occurrences } = useOperationState();
  const history = occurrences
    .filter((item) => item.elevatorId === occurrence.elevatorId && item.id !== occurrence.id)
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 3);
  const diagnosis = occurrence.metadata?.diagnosis;

  return <section className="app-card operator-technical" aria-labelledby="technical-panel-title">
    <header className="operator-technical__heading"><p className="page-header__subtitle mb-1">Consulta rápida</p><h2 id="technical-panel-title">Informações técnicas</h2><p>Dados do equipamento, do atendimento e do histórico relacionado.</p></header>
    <div className="operator-technical__columns">
      <section aria-labelledby="operator-equipment-title"><h3 id="operator-equipment-title"><span aria-hidden="true">↕</span> Equipamento</h3><dl>
        <InfoRow label="Identificação">{occurrence.elevator?.identification || 'Elevador'}</InfoRow>
        <InfoRow label="Modelo">{occurrence.elevator?.model || 'Não informado'}</InfoRow>
        <InfoRow label="Estabelecimento">{occurrence.client?.name || 'Cliente'}</InfoRow>
        <InfoRow label="Última manutenção">{occurrence.elevator?.lastMaintenance ? formatDate(occurrence.elevator.lastMaintenance) : 'Não informada'}</InfoRow>
        <InfoRow label="Status"><StatusBadge value={occurrence.elevator?.status || 'operando'} /></InfoRow>
      </dl></section>
      <section aria-labelledby="operator-occurrence-title"><h3 id="operator-occurrence-title"><span aria-hidden="true">▤</span> Atendimento</h3><dl>
        <InfoRow label="Código">{occurrence.protocol || occurrence.id}</InfoRow>
        <InfoRow label="Sistema relacionado">{diagnosis?.system || 'Não identificado'}</InfoRow>
        <InfoRow label="Registro">{formatDateTime(occurrence.time)}</InfoRow>
        <InfoRow label="Origem dos dados">{diagnosis?.source || 'Registro operacional'}</InfoRow>
        <InfoRow label="Descrição do cliente">{occurrence.metadata?.clientNotes || occurrence.description || 'Sem observações'}</InfoRow>
      </dl></section>
    </div>
    <section className="operator-technical__history" aria-labelledby="operator-history-title"><h3 id="operator-history-title"><span aria-hidden="true">◷</span> Histórico relacionado</h3>
      {history.length ? <ul>{history.map((item) => <li key={item.id}><time>{formatDateTime(item.time)}</time><span>{item.description}</span><strong>{item.workflowStatus || item.status}</strong></li>)}</ul> : <p>Sem registros anteriores para este elevador.</p>}
    </section>
  </section>;
}
