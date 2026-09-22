import { quickHistoryByElevator } from '../../data/operatorData';
import { formatDate, formatDateTime } from '../../utils/presentation';
import StatusBadge from '../StatusBadge';

export default function TechnicalInfoPanel({ occurrence }) {
  const history = quickHistoryByElevator[occurrence.elevatorId] || ['Sem registros relacionados recentes.'];

  return (
    <section className="app-card p-3 p-sm-4 h-100" aria-labelledby="technical-panel-title" style={{ gridArea: 'technical', minWidth: 0, overflowWrap: 'normal', wordBreak: 'normal' }}>
      <div className="d-flex align-items-center justify-content-between mb-4"><div><p className="text-primary fw-bold text-uppercase mb-1" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>Consulta rápida</p><h2 className="fs-5 mb-0" id="technical-panel-title">Informações técnicas</h2></div></div>
      <div className="d-grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))' }}>
        <article className="p-3 border rounded" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
          <h3 className="fs-6 mb-4">Elevador</h3>
          <dl className="d-grid gap-3 mb-0">
            <div><dt className="detail-item-label">Identificação</dt><dd className="detail-item-value">{occurrence.elevator?.identification || 'Elevador'}</dd></div>
            <div><dt className="detail-item-label">Modelo demonstrativo</dt><dd className="detail-item-value">{occurrence.elevator?.model || 'Modelo padrão'}</dd></div>
            <div><dt className="detail-item-label">Estabelecimento</dt><dd className="detail-item-value">{occurrence.client?.name || 'Cliente'}</dd></div>
            <div><dt className="detail-item-label">Última manutenção</dt><dd className="detail-item-value">{occurrence.elevator?.lastMaintenance ? formatDate(occurrence.elevator.lastMaintenance) : 'Recente'}</dd></div>
            <div><dt className="detail-item-label">Status registrado</dt><dd className="detail-item-value"><StatusBadge value={occurrence.elevator?.status || 'operando'} /></dd></div>
          </dl>
        </article>
        <article className="p-3 border rounded" style={{ backgroundColor: 'var(--color-surface-hover)' }}>
          <h3 className="fs-6 mb-4">Contexto da ocorrência</h3>
          <dl className="d-grid gap-3 mb-0">
            <div><dt className="detail-item-label">Código demonstrativo</dt><dd className="detail-item-value">{occurrence.metadata?.diagnosis?.demoCode || 'MVP-DEMO'}</dd></div>
            <div><dt className="detail-item-label">Sistema relacionado</dt><dd className="detail-item-value">{occurrence.metadata?.diagnosis?.system || 'Geral'}</dd></div>
            <div><dt className="detail-item-label">Registro</dt><dd className="detail-item-value">{formatDateTime(occurrence.time)}</dd></div>
            <div><dt className="detail-item-label">Origem dos dados</dt><dd className="detail-item-value">{occurrence.metadata?.diagnosis?.source || 'Telemetria'}</dd></div>
            <div><dt className="detail-item-label">Descrição do cliente</dt><dd className="detail-item-value">{occurrence.metadata?.clientNotes || occurrence.description || 'Sem observações'}</dd></div>
          </dl>
        </article>
        <article className="p-3 border rounded" style={{ backgroundColor: 'var(--color-surface-hover)', gridColumn: '1 / -1' }}>
          <h3 className="fs-6 mb-4">Histórico relacionado</h3>
          <ul className="list-unstyled m-0 d-grid gap-2">{history.slice(0, 4).map((item) => <li className="pb-2 border-bottom" style={{ fontSize: '0.86rem' }} key={item}>{item}</li>)}</ul>
        </article>
      </div>
    </section>
  );
}
