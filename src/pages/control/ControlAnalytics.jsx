import { useState } from 'react';
import { OPERATION_STATUS } from '../../data/operationStore';
import { componentLabel } from '../../data/technicalIntelligence';
import { getSlaStatus } from '../../utils/slaCalculator';

function BarList({ items, empty = 'Sem registros no período.' }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return items.some((item) => item.value) ? <div className="analytics-bars">{items.map((item) => <div className="analytics-bar" key={item.label}><span>{item.label}</span><i><b style={{ width: `${(item.value / max) * 100}%` }} /></i><strong>{item.value}</strong></div>)}</div> : <p className="analytics-empty">{empty}</p>;
}
const formatMinutes = (value) => value == null ? 'Sem dados' : value >= 60 ? `${Math.floor(value / 60)}h ${String(value % 60).padStart(2, '0')}min` : `${value} min`;
const validTime = (value) => { const time = new Date(value).getTime(); return Number.isFinite(time) ? time : null; };
const tally = (records, keyOf) => Object.values(records.reduce((acc, item) => { const label = keyOf(item); if (label) { acc[label] ||= { label, value: 0 }; acc[label].value += 1; } return acc; }, {})).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

export default function ControlAnalytics({ occurrences }) {
  const [period, setPeriod] = useState('30');
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (Number(period) - 1)).getTime();
  const inPeriod = (value) => { const time = validTime(value); return time !== null && time >= cutoff && time <= now.getTime(); };
  const opened = occurrences.filter((item) => inPeriod(item.time));
  const concluded = occurrences.filter((item) => item.operationalStatus === OPERATION_STATUS.RESOLVED && inPeriod(item.completedAt));
  const active = opened.filter((item) => item.operationalStatus !== OPERATION_STATUS.RESOLVED);
  const durations = concluded.map((item) => { const start = validTime(item.assignedAt || item.time); const end = validTime(item.completedAt); return start !== null && end !== null && end >= start ? Math.round((end - start) / 60000) : null; }).filter((value) => value !== null);
  const mttr = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null;
  const recurrent = opened.filter((item) => occurrences.some((other) => other.id !== item.id && other.elevatorId === item.elevatorId && validTime(other.time) !== null && validTime(other.time) < validTime(item.time) && validTime(item.time) - validTime(other.time) <= 7 * 86400000));
  const pendingParts = active.filter((item) => item.partRequest && [OPERATION_STATUS.WAITING_PART, OPERATION_STATUS.PART_AVAILABLE, OPERATION_STATUS.TRAVELING_TO_PICKUP].includes(item.operationalStatus));
  const slaRisk = active.filter((item) => { const sla = getSlaStatus(item, now); return sla?.isBreached || sla?.isNearBreach; });
  const priorityLabels = ['crítica', 'alta', 'atenção', 'baixa'];
  const severity = priorityLabels.map((label) => ({ label, value: opened.filter((item) => item.priority?.classification === label).length }));
  const stages = tally(opened, (item) => item.operationalStatus);
  const failures = tally(opened, (item) => item.componentId ? componentLabel(item.componentId) : 'Não classificado');
  const places = tally(opened, (item) => item.client?.name || 'Local não informado').slice(0, 5);
  const days = Array.from({ length: Number(period) }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (Number(period) - index - 1));
    return { key: date.toDateString(), label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: opened.filter((item) => new Date(item.time).toDateString() === date.toDateString()).length };
  });
  const maxDay = Math.max(1, ...days.map((day) => day.value));
  return <div className="analytics-page"><header className="page-header"><div><p className="page-header__subtitle">Indicadores operacionais e desempenho da assistência técnica</p><h1 className="page-header__title">Análises</h1></div><label className="analytics-period"><span>Período</span><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select></label></header>
    <section className="analytics-kpis" aria-label="Indicadores do período">{[
      ['Ocorrências ativas', active.length, 'Abertas no período'],
      ['Concluídas', concluded.length, 'Finalizadas no período'],
      ['Tempo médio (MTTR)', formatMinutes(mttr), `${durations.length} conclusão(ões) com duração`],
      ['Reincidências', recurrent.length, 'Mesmo equipamento em até 7 dias'],
      ['Peças pendentes', pendingParts.length, 'Solicitações ainda em fluxo'],
      ['SLA em risco', slaRisk.length, 'Próximo do limite ou excedido'],
    ].map(([label, value, detail]) => <article className="app-card" key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</section>
    <div className="analytics-grid"><section className="app-card analytics-card"><h2>Prioridade das ocorrências</h2><p>Distribuição dos {opened.length} chamados abertos</p><div className="analytics-priority">{severity.map((item) => <div key={item.label}><strong>{item.value}</strong><i style={{ height: `${Math.max(item.value ? 10 : 2, item.value / Math.max(1, ...severity.map((entry) => entry.value)) * 100)}%` }} /><span>{item.label}</span></div>)}</div></section><section className="app-card analytics-card"><h2>Etapas dos atendimentos</h2><p>Status atual dos chamados abertos no período</p><BarList items={stages} /></section><section className="app-card analytics-card"><h2>Tipos de falha</h2><p>Componente informado no diagnóstico</p><BarList items={failures} /></section><section className="app-card analytics-card analytics-mttr"><h2>Tempo médio de atendimento (MTTR)</h2><p>Entre abertura/atribuição e conclusão</p><strong>{formatMinutes(mttr)}</strong><small>Calculado sobre {durations.length} atendimento(s) concluído(s) com datas válidas</small></section><section className="app-card analytics-card"><h2>Locais com mais ocorrências</h2><p>Top 5 no período</p><BarList items={places} /></section><section className="app-card analytics-card"><h2>Evolução de chamados</h2><p>Aberturas por dia · últimos {period} dias</p><div className="analytics-days" role="img" aria-label="Gráfico de chamados abertos por dia">{days.map((day) => <div key={day.key} title={`${day.label}: ${day.value} chamado(s)`}><b>{day.value || ''}</b><i style={{ height: `${Math.max(day.value ? 8 : 2, day.value / maxDay * 100)}%` }} /><small>{day.label}</small></div>)}</div></section></div>
  </div>;
}
