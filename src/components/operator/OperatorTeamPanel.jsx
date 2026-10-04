import { getTechnicianById } from '../../data/mockData.js';
import { normalizeOccurrenceTeam, teamRoleLabel } from '../../utils/occurrenceTeam.js';

export default function OperatorTeamPanel({ occurrence, technicianId }) {
  const team = normalizeOccurrenceTeam(occurrence);
  return <section className="app-card p-3 p-sm-4 mb-4" aria-label="Equipe em campo">
    <h2 className="fs-5 mb-2">Equipe em campo</h2>
    <p className="text-secondary mb-3">Seu papel: <strong>{teamRoleLabel(occurrence, technicianId) === 'Responsável' ? 'Responsável pelo atendimento' : 'Apoio à equipe'}</strong></p>
    <div className="d-grid gap-2">{team.members.map((member) => <div className="d-flex justify-content-between flex-wrap gap-2 border-bottom pb-2" key={member.technicianId}><strong>{getTechnicianById(member.technicianId)?.name || member.technicianId}</strong><span>{teamRoleLabel(occurrence, member.technicianId)} · {member.status}</span></div>)}</div>
  </section>;
}
