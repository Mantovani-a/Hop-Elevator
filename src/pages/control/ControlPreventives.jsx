import { useState } from 'react';
import { addPreventive, reschedulePreventive, startPreventive } from '../../data/operationStore';
import { elevators, getClientById, getElevatorById } from '../../data/mockData';
import { preventiveStatus } from '../../utils/preventivePlanning';
import HopFilterBar from '../../components/HopFilterBar';
import { printPreventivesReport } from '../../utils/controlReports';

const statusClass = { Atrasada: 'is-late', Próxima: 'is-soon', 'Em andamento': 'is-progress', Concluída: 'is-done' };

export default function ControlPreventives({ plans, occurrences }) {
  const [form, setForm] = useState({ elevatorId: '', date: '', window: '09:00–11:00', note: '' });
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const rows = [...plans].sort((a, b) => a.date.localeCompare(b.date));
  const filteredRows = rows.filter((plan) => statusFilter === 'all' || (statusFilter === 'scheduled' ? ['Agendada', 'Próxima'].includes(preventiveStatus(plan, occurrences)) : preventiveStatus(plan, occurrences) === statusFilter));
  const counts = rows.reduce((result, plan) => {
    const status = preventiveStatus(plan, occurrences);
    result[status] = (result[status] || 0) + 1;
    return result;
  }, {});
  const submit = (event) => {
    event.preventDefault();
    if (!form.elevatorId || !form.date) return;
    addPreventive(form);
    setForm({ elevatorId: '', date: '', window: '09:00–11:00', note: '' });
  };
  return <div className="hop-preventives">
    <header className="page-header mb-4"><div><p className="page-header__subtitle">Cuidado programado dos equipamentos</p><h1 className="page-header__title">Manutenção preventiva</h1><p className="text-secondary mb-0">Planeje visitas por elevador e acompanhe a execução em campo.</p></div><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => printPreventivesReport(plans, occurrences)}>Imprimir preventivas agendadas</button></header>
    <div className="hop-preventive-stats" aria-label="Resumo da agenda">
      {[['scheduled', 'Agendadas'], ['Atrasada', 'Atrasadas'], ['Em andamento', 'Em campo'], ['Concluída', 'Concluídas']].map(([key, label]) => <div className="app-card hop-preventive-stat" key={key}><span>{label}</span><strong>{key === 'scheduled' ? (counts.Agendada || 0) + (counts.Próxima || 0) : counts[key] || 0}</strong></div>)}
    </div>
    <HopFilterBar label="Filtrar visitas preventivas" quick={[["all", "Todas"], ["scheduled", "Agendadas"], ["Atrasada", "Atrasadas"], ["Em andamento", "Em campo"], ["Concluída", "Concluídas"]]} active={statusFilter} onQuickChange={setStatusFilter} count={filteredRows.length} total={rows.length} hasFilters={statusFilter !== 'all'} onClear={() => setStatusFilter('all')} />
    <div className="hop-preventive-layout">
      <section className="app-card hop-preventive-agenda" aria-labelledby="preventive-agenda-title"><div className="hop-section-head"><div><p className="page-header__subtitle">Agenda técnica</p><h2 id="preventive-agenda-title">Visitas planejadas</h2></div><span>{filteredRows.length} visitas</span></div>
        <div className="hop-preventive-list">{filteredRows.length === 0 && <p className="control-empty-note">Nenhuma visita corresponde ao filtro selecionado.</p>}{filteredRows.map((plan) => {
          const elevator = getElevatorById(plan.elevatorId);
          const status = preventiveStatus(plan, occurrences);
          return <article className="hop-preventive-row" key={plan.id}>
            <div className="hop-preventive-date"><strong>{new Date(`${plan.date}T12:00:00`).getDate()}</strong><span>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${plan.date}T12:00:00`))}</span></div>
            <div className="hop-preventive-info"><div className="hop-preventive-top"><strong>{elevator?.identification || plan.elevatorId}</strong><span className={`hop-preventive-status ${statusClass[status] || ''}`}>{status}</span></div><span>{getClientById(elevator?.clientId)?.name} · {plan.window}</span><p>{plan.note}</p>
              {editingId === plan.id && <form className="d-flex gap-2 mt-2" onSubmit={(event) => { event.preventDefault(); reschedulePreventive(plan.id, event.currentTarget.elements.date.value); setEditingId(null); }}><input className="form-control form-control-sm" name="date" type="date" defaultValue={plan.date} required /><button className="btn btn-primary btn-sm" type="submit">Salvar</button></form>}
              {!plan.occurrenceId && <div className="hop-preventive-actions"><button type="button" onClick={() => setEditingId(editingId === plan.id ? null : plan.id)}>Reagendar</button><button type="button" onClick={() => startPreventive(plan.id)}>Enviar ao Operator ↗</button></div>}
              {plan.occurrenceId && <small>Atendimento {occurrences.find((item) => item.id === plan.occurrenceId)?.protocol || plan.occurrenceId}</small>}
            </div>
          </article>;
        })}</div>
      </section>
      <section className="app-card hop-preventive-new" aria-labelledby="preventive-new-title"><p className="page-header__subtitle">Nova visita</p><h2 id="preventive-new-title">Programar preventiva</h2><p className="text-secondary">Uma visita, um equipamento e uma janela clara para o cliente.</p>
        <form onSubmit={submit} className="d-grid gap-3"><div><label className="form-label" htmlFor="prev-elevator">Elevador</label><select className="form-select" id="prev-elevator" required value={form.elevatorId} onChange={(event) => setForm({ ...form, elevatorId: event.target.value })}><option value="">Selecione o equipamento</option>{elevators.map((item) => <option value={item.id} key={item.id}>{getClientById(item.clientId)?.name} · {item.identification}</option>)}</select></div><div><label className="form-label" htmlFor="prev-date">Data</label><input className="form-control" id="prev-date" type="date" required min={new Date().toISOString().slice(0, 10)} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div><div><label className="form-label" htmlFor="prev-window">Janela</label><select className="form-select" id="prev-window" value={form.window} onChange={(event) => setForm({ ...form, window: event.target.value })}><option>09:00–11:00</option><option>11:00–13:00</option><option>13:00–15:00</option><option>15:00–17:00</option></select></div><div><label className="form-label" htmlFor="prev-note">Foco da visita</label><input className="form-control" id="prev-note" maxLength="120" placeholder="Ex.: portas e nivelamento" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></div><button className="btn btn-primary" type="submit">Agendar visita</button></form>
      </section>
    </div>
  </div>;
}
