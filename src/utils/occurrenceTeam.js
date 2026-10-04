export const TEAM_MODE = Object.freeze({ INDIVIDUAL: 'individual', RECOMMENDED: 'recommended', REQUIRED: 'required' });
export const TEAM_STATUS = Object.freeze({ ASSIGNED: 'atribuído', TRAVELING: 'em deslocamento', ON_SITE: 'no local', FINISHED: 'participação concluída' });

const normalized = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const legacyMemberStatus = (occurrence) => {
  const value = normalized(occurrence?.workflowStatus || occurrence?.status);
  if (value.includes('resolvid') || value.includes('concluid')) return TEAM_STATUS.FINISHED;
  if (value.includes('deslocamento') || value.includes('retornando') || value.includes('retirada')) return TEAM_STATUS.TRAVELING;
  if (value.includes('local') || value.includes('manutencao')) return TEAM_STATUS.ON_SITE;
  return TEAM_STATUS.ASSIGNED;
};

export function inferTeamMode(occurrence) {
  if (Object.values(TEAM_MODE).includes(occurrence?.team?.mode)) return occurrence.team.mode;
  const text = normalized([occurrence?.description, occurrence?.detectedFailure, occurrence?.metadata?.diagnosis?.system, ...(occurrence?.metadata?.reportedProblems || [])].join(' '));
  const systems = ['porta', 'freio', 'contrapeso', 'eletric', 'comando', 'painel', 'tracao', 'nivelamento'].filter((word) => text.includes(word));
  if (Number(occurrence?.trappedPeople) > 0 || text.includes('resgate') || occurrence?.metadata?.riskToLife || systems.length >= 3) return TEAM_MODE.REQUIRED;
  if (systems.length >= 2 || (Array.isArray(occurrence?.metadata?.requiredSpecialties) && occurrence.metadata.requiredSpecialties.length > 1) || normalized(occurrence?.severity) === 'critica' || normalized(occurrence?.priority?.classification) === 'critica') return TEAM_MODE.RECOMMENDED;
  return TEAM_MODE.INDIVIDUAL;
}

export function normalizeOccurrenceTeam(occurrence) {
  const mode = inferTeamMode(occurrence);
  const responsibleId = occurrence?.technicianId || occurrence?.assignedTechnicianId || occurrence?.team?.responsibleId || null;
  const rawMembers = Array.isArray(occurrence?.team?.members) ? occurrence.team.members : [];
  const pastMembers = Array.isArray(occurrence?.team?.pastMembers) ? occurrence.team.pastMembers.filter((member) => member?.technicianId) : [];
  const members = [];
  for (const member of rawMembers) {
    if (!member?.technicianId || members.some((item) => item.technicianId === member.technicianId)) continue;
    members.push({ ...member, role: member.technicianId === responsibleId ? 'responsible' : 'support', status: Object.values(TEAM_STATUS).includes(member.status) ? member.status : TEAM_STATUS.ASSIGNED });
  }
  if (responsibleId && !members.some((member) => member.technicianId === responsibleId)) {
    members.unshift({ technicianId: responsibleId, role: 'responsible', status: legacyMemberStatus(occurrence), assignedAt: occurrence?.assignedAt || occurrence?.time || null });
  }
  const requiredCount = mode === TEAM_MODE.INDIVIDUAL ? 1 : Math.min(6, Math.max(2, Number(occurrence?.team?.requiredCount) || (mode === TEAM_MODE.REQUIRED && Number(occurrence?.trappedPeople) > 0 ? 3 : 2)));
  return { ...occurrence?.team, mode, requiredCount, responsibleId, members, pastMembers };
}

export const teamMember = (occurrence, technicianId) => normalizeOccurrenceTeam(occurrence).members.find((member) => member.technicianId === technicianId);
export const isTeamMember = (occurrence, technicianId) => Boolean(teamMember(occurrence, technicianId));
export const wasTeamMember = (occurrence, technicianId) => isTeamMember(occurrence, technicianId) || normalizeOccurrenceTeam(occurrence).pastMembers?.some((member) => member.technicianId === technicianId);
export const activeTeamMembers = (occurrence) => normalizeOccurrenceTeam(occurrence).members.filter((member) => member.status !== TEAM_STATUS.FINISHED);
export const canResolveOccurrence = (occurrence, technicianId) => { const team = normalizeOccurrenceTeam(occurrence); return team.responsibleId === technicianId && (team.mode !== TEAM_MODE.REQUIRED || team.members.length >= team.requiredCount); };
export const canRequestOccurrencePart = (occurrence) => !occurrence?.partRequest || ['Aplicada', 'Cancelada'].includes(occurrence.partRequest.state);
export const teamRoleLabel = (occurrence, technicianId) => (teamMember(occurrence, technicianId) || normalizeOccurrenceTeam(occurrence).pastMembers?.find((member) => member.technicianId === technicianId))?.role === 'responsible' ? 'Responsável' : 'Apoio';

export function teamCompactLabel(occurrence, getName) {
  const team = normalizeOccurrenceTeam(occurrence);
  const count = team.members.length;
  if (!count) return 'Sem técnico';
  const name = getName?.(team.responsibleId) || team.responsibleId;
  return count > 1 ? `${name} +${count - 1}` : name;
}

export function assignTeamMember(occurrence, technicianId, role = 'support', at = new Date().toISOString()) {
  const team = normalizeOccurrenceTeam(occurrence);
  if (!technicianId) return occurrence;
  const responsibleId = role === 'responsible' || !team.responsibleId ? technicianId : team.responsibleId;
  const members = team.members.some((member) => member.technicianId === technicianId)
    ? team.members.map((member) => member.technicianId === technicianId ? { ...member, status: TEAM_STATUS.ASSIGNED, completedAt: null } : member)
    : [...team.members, { technicianId, role: 'support', status: TEAM_STATUS.ASSIGNED, assignedAt: at }];
  return {
    team: { ...team, mode: members.length > 1 && team.mode === TEAM_MODE.INDIVIDUAL ? TEAM_MODE.RECOMMENDED : team.mode, requiredCount: members.length > 1 ? Math.max(2, team.requiredCount) : team.requiredCount, responsibleId, members: members.map((member) => ({ ...member, role: member.technicianId === responsibleId ? 'responsible' : 'support' })) },
    technicianId: responsibleId,
    assignedTechnicianId: responsibleId,
    assignedAt: occurrence.assignedAt || at,
  };
}

export function removeTeamMember(occurrence, technicianId) {
  const team = normalizeOccurrenceTeam(occurrence);
  if (team.responsibleId === technicianId) return null;
  return { team: { ...team, members: team.members.filter((member) => member.technicianId !== technicianId), pastMembers: [...(team.pastMembers || []), team.members.find((member) => member.technicianId === technicianId)].filter(Boolean) } };
}

export function setTeamMemberStatus(occurrence, technicianId, status, at = new Date().toISOString()) {
  const team = normalizeOccurrenceTeam(occurrence);
  if (!team.members.some((member) => member.technicianId === technicianId) || !Object.values(TEAM_STATUS).includes(status)) return null;
  return { team: { ...team, members: team.members.map((member) => member.technicianId === technicianId ? { ...member, status, ...(status === TEAM_STATUS.ON_SITE ? { arrivedAt: at } : {}), ...(status === TEAM_STATUS.FINISHED ? { completedAt: at } : {}) } : member) } };
}
