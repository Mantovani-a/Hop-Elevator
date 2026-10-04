import { useEffect, useMemo, useState } from 'react';
import ProfileAvatar from '../ProfileAvatar';
import StatusBadge from '../StatusBadge';
import Modal from '../Modal';
import { OPERATION_STATUS } from '../../data/operationStore';
import { displayStatus, formatDateTime } from '../../utils/presentation';
import ControlShiftRecords from './ControlShiftRecords';
import { printTechnicianReport } from '../../utils/controlReports';
import { isTeamMember, teamRoleLabel, wasTeamMember } from '../../utils/occurrenceTeam.js';

const tabs = [['summary', 'Resumo'], ['history', 'Histórico'], ['shifts', 'Turnos e ponto'], ['performance', 'Desempenho']];
const minutesOf = (item) => {
  const start = new Date(item.assignedAt || item.time).getTime();
  const end = new Date(item.completedAt).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? Math.round((end - start) / 60000) : null;
};
const duration = (minutes) => minutes == null ? 'Sem dados' : minutes >= 60 ? `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}min` : `${minutes} min`;

export default function ControlTechnicianDetail({ technician, occurrences = [], shiftActive, shiftEvents = [], shiftPlan, onClose, onSelectOccurrence }) {
  const [tab, setTab] = useState('summary');
  const [expandedId, setExpandedId] = useState(null);
  useEffect(() => { setTab('summary'); setExpandedId(null); }, [technician?.id]);
  const records = useMemo(() => occurrences.filter((item) => wasTeamMember(item, technician?.id) || item.workflowHistory?.some((event) => event.technicianId === technician?.id)).sort((a, b) => new Date(b.completedAt || b.time || 0) - new Date(a.completedAt || a.time || 0)), [occurrences, technician?.id]);
  if (!technician) return null;
  const concluded = records.filter((item) => isTeamMember(item, technician.id) && item.operationalStatus === OPERATION_STATUS.RESOLVED);
  const inProgress = records.filter((item) => isTeamMember(item, technician.id) && item.operationalStatus !== OPERATION_STATUS.RESOLVED);
  const withParts = records.filter((item) => item.partRequest?.diagnosedBy?.id === technician.id).length;
  const secondVisits = records.filter((item) => item.partRequest?.resumedBy?.id === technician.id).length;
  const supportRequests = records.filter((item) => item.supportRequest?.requestedBy?.id === technician.id).length;
  const times = concluded.map(minutesOf).filter((value) => value !== null);
  const average = times.length ? Math.round(times.reduce((sum, value) => sum + value, 0) / times.length) : null;
  const lastConclusion = concluded.find((item) => item.completedAt)?.completedAt;
  const current = technician.currentOccurrence;
  const shiftKnown = technician.id === 'TEC-010';
  const ownShiftEvents = shiftEvents.filter((event) => event.technicianId === technician.id);
  const lastStart = shiftActive ? ownShiftEvents.find((event) => event.type === 'start')?.at : null;
  return <Modal isOpen onClose={onClose} title="Perfil do técnico" titleId="technician-detail-title" showHeader={false} className="control-detail-panel control-technician-detail" layerClassName="control-modal-layer control-detail-layer">
    <header className="tech-detail-header">
      <div className="tech-detail-identity">
        <ProfileAvatar name={technician.name} src={technician.avatar} size="lg" decorative />
        <div className="tech-detail-identity__text"><p className="eyebrow eyebrow--dark">Equipe de campo</p><h2 id="technician-detail-title">{technician.name}</h2><p>{technician.id} · {technician.specialty}</p></div>
      </div>
      <div className="tech-detail-headmeta">
        <StatusBadge value={technician.status} />
        <div className="tech-detail-headmeta__item"><span>Região base</span><strong>{technician.region || 'Não informada'}</strong></div>
        {shiftKnown && <div className="tech-detail-headmeta__item"><span>Turno</span><strong>{shiftActive ? 'Em turno' : 'Encerrado'}</strong></div>}
        {lastConclusion && <div className="tech-detail-headmeta__item"><span>Última conclusão</span><strong>{formatDateTime(lastConclusion)}</strong></div>}
      </div>
      <div className="tech-detail-actions">
        <button className="btn btn-sm btn-outline-primary tech-detail-print" type="button" onClick={() => printTechnicianReport(technician, occurrences, shiftEvents, shiftPlan)}>Imprimir relatório completo</button>
        <button className="tech-detail-close" type="button" onClick={onClose} aria-label="Fechar perfil">×</button>
      </div>
    </header>
    {current && <p className="px-4 pt-3 mb-0 text-secondary">Papel na ocorrência atual: <strong>{teamRoleLabel(current, technician.id)}</strong></p>}
    <nav className="tech-detail-tabs" aria-label="Seções do perfil">{tabs.map(([id, label]) => <button type="button" key={id} className={tab === id ? 'is-active' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>{label}</button>)}</nav>
    {tab === 'history' && records.some((item) => wasTeamMember(item, technician.id)) && <div className="px-4 pt-3"><h3 className="fs-6">Papel nas ocorrências</h3><div className="d-flex flex-wrap gap-2">{records.filter((item) => wasTeamMember(item, technician.id)).map((item) => <span className="badge text-bg-light border" key={item.id}>{item.protocol} · {teamRoleLabel(item, technician.id)}</span>)}</div></div>}
    <div className="tech-detail-content" key={tab}>
      {tab === 'summary' && <div className="tech-detail-grid"><section className="tech-card"><h3>Informações gerais</h3><dl><div><dt>Código</dt><dd>{technician.id}</dd></div><div><dt>Especialidade</dt><dd>{technician.specialty}</dd></div><div><dt>Região base</dt><dd>{technician.region || 'Não informada'}</dd></div><div><dt>Disponibilidade</dt><dd>{displayStatus(technician.status)}</dd></div></dl></section><section className="tech-card"><h3>Operação atual</h3>{current ? <><p><StatusBadge value={current.operationalStatus} /></p><dl><div><dt>Ocorrência</dt><dd>{current.protocol}</dd></div><div><dt>Local</dt><dd>{current.client?.name || 'Não informado'}</dd></div><div><dt>Equipamento</dt><dd>{current.elevator?.identification || 'Não informado'}</dd></div></dl><button className="btn btn-outline-primary btn-sm" type="button" onClick={() => onSelectOccurrence?.(current.id)}>Ver ocorrência →</button></> : <p>Sem atendimento ativo no momento.</p>}</section><section className="tech-card"><h3>Indicadores rápidos</h3><div className="tech-metrics"><div><strong>{concluded.length}</strong><span>Concluídos registrados</span></div><div><strong>{inProgress.length}</strong><span>Em andamento</span></div><div><strong>{duration(average)}</strong><span>Tempo médio</span></div><div><strong>{withParts}</strong><span>Solicitações com peça</span></div></div></section><section className="tech-card"><h3>Atendimentos recentes</h3>{records.length ? <ul className="tech-history-list">{records.slice(0, 4).map((item) => <li key={item.id}><strong>{item.protocol}</strong><span>{item.client?.name} · {item.elevator?.identification}</span><small>{formatDateTime(item.completedAt || item.time)}</small></li>)}</ul> : <p>Nenhum atendimento registrado para este técnico.</p>}</section><section className="tech-card tech-summary-shift"><h3>Turno e acompanhamento</h3><p>{shiftKnown ? `${shiftActive ? 'Em turno' : 'Fora de turno'}${lastStart ? ` · Início: ${formatDateTime(lastStart)}` : ' · Início não registrado'}` : 'Histórico demonstrativo disponível em Turnos e ponto.'}</p><div className="tech-summary-counts"><span>Segundas visitas: <strong>{secondVisits}</strong></span><span>Pedidos de suporte: <strong>{supportRequests}</strong></span></div></section></div>}
      {tab === 'history' && <section className="tech-card"><h3>Histórico de atendimentos</h3><p className="tech-card-subtitle">Registros vinculados ao técnico, incluindo diagnósticos e retomadas.</p>{records.length ? <div className="tech-history-list">{records.map((item) => <article key={item.id} className="tech-history-entry"><button type="button" aria-expanded={expandedId === item.id} onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}><strong>{item.protocol}</strong><span>{formatDateTime(item.completedAt || item.time)}</span><span>{item.client?.name} · {item.elevator?.identification}</span><StatusBadge value={item.operationalStatus} /><span aria-hidden="true">{expandedId === item.id ? '⌃' : '⌄'}</span></button>{expandedId === item.id && <div className="tech-history-entry__details"><p>{item.description}</p><p>Prioridade: {item.priority?.classification || 'Não informada'} · Duração: {duration(minutesOf(item))}</p>{(item.finalDiagnosis || item.partRequest?.diagnosis) && <p>Diagnóstico: {item.finalDiagnosis || item.partRequest?.diagnosis}</p>}{item.solution && <p>Ação realizada: {item.solution}</p>}{item.partRequest && <p>Peça: {item.partRequest.part} ×{item.partRequest.quantity} · {item.partRequest.state}</p>}{item.finalCondition && <p>Condição final: {item.finalCondition}</p>}{item.workflowHistory?.filter((event) => event.technicianId === technician.id).map((event, index) => <small key={`${event.at}-${index}`}>{formatDateTime(event.at)} · {event.label}</small>)}<button className="btn btn-outline-primary btn-sm" type="button" onClick={() => onSelectOccurrence?.(item.id)}>Ver detalhes</button></div>}</article>)}</div> : <p>Nenhum atendimento registrado para este técnico.</p>}</section>}
      {tab === 'shifts' && <ControlShiftRecords technicianId={technician.id} shiftEvents={shiftEvents} shiftPlan={shiftPlan} />}
      {tab === 'performance' && <div className="tech-detail-grid"><section className="tech-card"><h3>Indicadores de atendimento</h3><div className="tech-metrics"><div><strong>{records.length}</strong><span>Atendimentos vinculados</span></div><div><strong>{concluded.length}</strong><span>Concluídos</span></div><div><strong>{inProgress.length}</strong><span>Em andamento</span></div><div><strong>{duration(average)}</strong><span>Tempo médio de resolução</span></div></div></section><section className="tech-card"><h3>Acompanhamento técnico</h3><dl><div><dt>Ocorrências críticas concluídas</dt><dd>{concluded.filter((item) => item.priority?.classification === 'crítica').length}</dd></div><div><dt>Solicitações com peça</dt><dd>{withParts}</dd></div><div><dt>Retomadas atribuídas</dt><dd>{secondVisits}</dd></div><div><dt>Pedidos de suporte</dt><dd>{supportRequests}</dd></div><div><dt>Atendimentos com duração calculável</dt><dd>{times.length}</dd></div></dl><p className="tech-card-subtitle">Indicadores calculados apenas sobre os registros disponíveis.</p></section></div>}
    </div>
  </Modal>;
}
