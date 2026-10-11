import { OPERATION_STATUS } from '../data/operationStatus.js';
import { getClientById, getElevatorById, getTechnicianById } from '../data/mockData.js';
import { getSlaStatus } from './slaCalculator.js';
import { preventiveStatus } from './preventivePlanning.js';
import { DEFAULT_SHIFT_PLAN, deriveShift, formatMinutes, getShiftDays, SHIFT_STATUS } from './shiftSchedule.js';
import { displayStatus } from './presentation.js';
import { printReport, reportDate, reportDateTime, reportFacts, reportSection, reportTable } from './reportPrint.js';
import { getRequestedParts } from './partRequestReport.js';
import { isTeamMember, normalizeOccurrenceTeam, teamCompactLabel, teamRoleLabel, wasTeamMember } from './occurrenceTeam.js';

const list = (items) => Array.isArray(items) ? items.filter(Boolean).map((item) => typeof item === 'object' ? item.name || item.part || item.id || '' : item).filter(Boolean).join(' · ') : items || '';
const technicianName = (occurrence) => normalizeOccurrenceTeam(occurrence).members.length ? teamCompactLabel(occurrence, (id) => getTechnicianById(id)?.name) : [...(occurrence.workflowHistory || [])].reverse().find((event) => event.technicianName)?.technicianName || '';
const teamFacts = (occurrence) => { const team = normalizeOccurrenceTeam(occurrence); return reportFacts([['Tipo de atendimento', { individual: 'Individual', recommended: 'Equipe recomendada', required: 'Equipe obrigatória' }[team.mode]], ['Responsável', getTechnicianById(team.responsibleId)?.name], ['Apoio', team.members.filter((member) => member.role === 'support').map((member) => getTechnicianById(member.technicianId)?.name || member.technicianId).join(' · ')]]); };
const teamRecords = (occurrence) => reportTable(['Data/hora', 'Técnico', 'Registro'], (occurrence.teamNotes || []).map((item) => [reportDateTime(item.at), item.technicianName || getTechnicianById(item.technicianId)?.name, item.text]));
const partDescription = (request) => getRequestedParts(request).map((part) => `${part.name}${part.quantity ? ` ×${part.quantity}` : ''}${part.code ? ` (${part.code})` : ''}`).join('; ');
const occurrenceDate = (item) => reportDateTime(item.completedAt || item.time);
const occurrenceDetails = (occurrence) => reportFacts([
  ['Protocolo', occurrence.protocol], ['Situação', displayStatus(occurrence.operationalStatus)],
  ['Problema', occurrence.description], ['Diagnóstico', occurrence.finalDiagnosis || occurrence.technicalReport?.finalDiagnosis || occurrence.partRequest?.diagnosis || occurrence.metadata?.diagnosis?.summary],
  ['Ação realizada', occurrence.solution || occurrence.technicalReport?.maintenancePerformed], ['Condição final', occurrence.finalCondition],
  ['Peças', partDescription(occurrence.partRequest) || list(occurrence.technicalReport?.replacedParts || occurrence.replacedParts)],
  ['Estado da peça', occurrence.partRequest?.state], ['Suporte', occurrence.supportRequest?.reason],
]) + teamFacts(occurrence) + teamRecords(occurrence);

export function printTechnicianReport(technician, occurrences, shiftEvents = [], shiftPlan) {
  const records = occurrences.filter((item) => wasTeamMember(item, technician.id) || item.workflowHistory?.some((event) => event.technicianId === technician.id))
    .sort((a, b) => new Date(b.completedAt || b.time || 0) - new Date(a.completedAt || a.time || 0));
  const concluded = records.filter((item) => isTeamMember(item, technician.id) && item.operationalStatus === OPERATION_STATUS.RESOLVED);
  const inProgress = records.filter((item) => isTeamMember(item, technician.id) && item.operationalStatus !== OPERATION_STATUS.RESOLVED);
  const times = concluded.map((item) => (new Date(item.completedAt).getTime() - new Date(item.assignedAt || item.time).getTime()) / 60000).filter((value) => Number.isFinite(value) && value >= 0);
  const days = getShiftDays(shiftEvents, technician.id);
  const plan = technician.id === 'TEC-010' ? shiftPlan || DEFAULT_SHIFT_PLAN : null;
  const title = `Relatório completo do técnico · ${technician.name}`;
  const content = [
    reportSection('Informações gerais', reportFacts([['Técnico', technician.name], ['Código', technician.id], ['Status atual', displayStatus(technician.status)], ['Especialidade', technician.specialty], ['Região base', technician.region], ['Ocorrência atual', technician.currentOccurrence?.protocol]])),
    plan && reportSection('Horários previstos', reportFacts([['Início', plan.start], ['Saída para almoço', plan.lunchStart], ['Retorno do almoço', plan.lunchEnd], ['Fim', plan.end]])),
    reportSection('Indicadores de desempenho', reportFacts([['Atendimentos vinculados', records.length], ['Ocorrências concluídas', concluded.length], ['Em andamento', inProgress.length], ['Tempo médio de resolução', times.length ? formatMinutes(Math.round(times.reduce((sum, value) => sum + value, 0) / times.length)) : ''], ['Solicitações com peça', records.filter((item) => item.partRequest?.diagnosedBy?.id === technician.id).length], ['Segundas visitas', records.filter((item) => item.partRequest?.resumedBy?.id === technician.id).length], ['Pedidos de suporte', records.filter((item) => item.supportRequest?.requestedBy?.id === technician.id).length]])),
    reportSection('Turnos e registros de ponto', reportTable(['Data', 'Status', 'Início', 'Saída almoço', 'Retorno', 'Fim', 'Tempo ativo'], days.map((day) => { const shift = deriveShift(day.events); return [reportDate(day.day), SHIFT_STATUS[shift.status], reportDateTime(shift.records.start), reportDateTime(shift.records.lunchStart), reportDateTime(shift.records.lunchEnd), reportDateTime(shift.records.end), shift.activeMinutes == null ? '' : formatMinutes(shift.activeMinutes)]; }))),
    reportSection('Ocorrências concluídas', reportTable(['Protocolo', 'Conclusão', 'Local', 'Elevador', 'Problema'], concluded.map((item) => [item.protocol, reportDateTime(item.completedAt), item.client?.name, item.elevator?.identification, item.description]))),
    reportSection('Atendimentos e histórico disponíveis', reportTable(['Protocolo', 'Data', 'Papel', 'Status', 'Local', 'Elevador'], records.map((item) => [item.protocol, occurrenceDate(item), wasTeamMember(item, technician.id) ? teamRoleLabel(item, technician.id) : 'Participação anterior', displayStatus(item.operationalStatus), item.client?.name, item.elevator?.identification]))),
    ...records.map((item) => reportSection(`Registro ${item.protocol || item.id}`, occurrenceDetails(item) + reportTable(['Data/hora', 'Etapa'], (item.workflowHistory || []).filter((event) => event.technicianId === technician.id).map((event) => [reportDateTime(event.at), event.label])))),
  ].filter(Boolean).join('');
  printReport({ title, content });
}

export function printOpenOccurrencesReport(occurrences) {
  const open = occurrences.filter((item) => item.operationalStatus !== OPERATION_STATUS.RESOLVED);
  const title = 'Ocorrências em aberto';
  const content = reportSection('Situação atual da fila', reportTable(['Protocolo', 'Prioridade', 'Status', 'Local', 'Elevador', 'Técnico', 'SLA', 'Peça / suporte', 'Situação atual'], open.map((item) => {
    const sla = item.serviceType === 'preventive' ? null : getSlaStatus(item);
    return [item.protocol, displayStatus(item.priority?.classification), displayStatus(item.operationalStatus), list([item.client?.name, item.address || item.client?.address]), item.elevator?.identification, technicianName(item), sla ? `${sla.label} · ${sla.detail}` : '', list([partDescription(item.partRequest), item.partRequest?.state, item.supportRequest?.reason, item.supportRequest?.state]), item.workflowHistory?.at(-1)?.label || displayStatus(item.operationalStatus)];
  })) || '<p class="report-empty">Não há ocorrências em aberto.</p>');
  printReport({ title, content, landscape: true });
}

export function printPreventivesReport(plans, occurrences) {
  const scheduled = plans.filter((plan) => ['Agendada', 'Próxima', 'Atrasada'].includes(preventiveStatus(plan, occurrences))).sort((a, b) => a.date.localeCompare(b.date));
  const title = 'Preventivas agendadas';
  const content = reportSection('Agenda de visitas', reportTable(['Elevador', 'Cliente / local', 'Data', 'Janela prevista', 'Técnico', 'Tipo', 'Status'], scheduled.map((plan) => {
    const elevator = getElevatorById(plan.elevatorId);
    const client = getClientById(elevator?.clientId);
    const service = occurrences.find((item) => item.id === plan.occurrenceId);
    const technician = getTechnicianById(plan.technicianId || service?.technicianId || service?.assignedTechnicianId);
    return [elevator?.identification || plan.elevatorId, list([client?.name, elevator?.address || client?.address]), reportDate(plan.date), plan.window, technician?.name, plan.type || plan.serviceType || (service?.serviceType === 'preventive' ? 'Preventiva' : ''), preventiveStatus(plan, occurrences)];
  })) || '<p class="report-empty">Não há preventivas agendadas.</p>');
  printReport({ title, content });
}

export function printElevatorReport(elevator, elevatorType, plans = [], occurrences = []) {
  const related = [...(elevator.maintenanceHistory || [])].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  const preventivePlans = plans.filter((plan) => plan.elevatorId === elevator.id);
  const title = `Histórico do elevador · ${elevator.identification || elevator.id}`;
  const content = [
    reportSection('Identificação e dados técnicos', reportFacts([['Código', elevator.id], ['Identificação', elevator.identification], ['Cliente', elevator.client?.name], ['Local', elevator.address || elevator.client?.address], ['Tipo', elevatorType], ['Modelo', elevator.model], ['Estado atual', displayStatus(elevator.status)], ['Última manutenção', reportDate(elevator.lastMaintenance)], ['Ocorrência ativa', elevator.activeOccurrence?.protocol]])),
    reportSection('Histórico de ocorrências e manutenções', reportTable(['Protocolo', 'Abertura', 'Conclusão', 'Status', 'Problema', 'Técnico'], related.map((item) => [item.protocol, reportDateTime(item.time), reportDateTime(item.completedAt), displayStatus(item.operationalStatus), item.description, technicianName(item)]))),
    ...related.map((item) => reportSection(`Atendimento ${item.protocol || item.id}`, occurrenceDetails(item))),
    reportSection('Preventivas', reportTable(['Data', 'Janela', 'Tipo', 'Status', 'Técnico', 'Foco da visita'], preventivePlans.map((plan) => { const service = occurrences.find((item) => item.id === plan.occurrenceId); return [reportDate(plan.date), plan.window, plan.type || plan.serviceType || (service?.serviceType === 'preventive' ? 'Preventiva' : ''), preventiveStatus(plan, occurrences), getTechnicianById(plan.technicianId || service?.technicianId || service?.assignedTechnicianId)?.name, plan.note]; }))),
  ].filter(Boolean).join('');
  printReport({ title, content });
}

export function printOccurrenceReport(occurrence) {
  const sla = occurrence.serviceType === 'preventive' ? null : getSlaStatus(occurrence);
  const title = `Relatório da ocorrência · ${occurrence.protocol || occurrence.id}`;
  const content = [
    reportSection('Identificação e prioridade', reportFacts([['Protocolo', occurrence.protocol], ['Prioridade', displayStatus(occurrence.priority?.classification)], ['Score', Number.isFinite(occurrence.priority?.score) ? `${occurrence.priority.score}/100` : ''], ['Status', displayStatus(occurrence.operationalStatus)], ['Abertura', reportDateTime(occurrence.time)], ['Conclusão', reportDateTime(occurrence.completedAt)], ['SLA', sla ? `${sla.label} · ${sla.detail}` : '']])),
    reportSection('Problema e fatores críticos', reportFacts([['Problema', occurrence.description], ['Sintomas informados', occurrence.metadata?.reportedProblems], ['Pessoas presas', occurrence.trappedPeople > 0 ? occurrence.trappedPeople : ''], ['Fatores críticos', occurrence.priority?.reasons], ['Contexto do local', occurrence.locationContext || occurrence.metadata?.clientNotes]])),
    reportSection('Local, elevador e equipe', reportFacts([['Cliente', occurrence.client?.name], ['Endereço', occurrence.address || occurrence.client?.address], ['Elevador', occurrence.elevator?.identification], ['Código do elevador', occurrence.elevatorId], ['Modelo', occurrence.elevator?.model], ['Estado do elevador', displayStatus(occurrence.elevator?.status)]]) + teamFacts(occurrence)),
    reportSection('Histórico operacional', reportTable(['Data/hora', 'Etapa', 'Técnico'], (occurrence.workflowHistory || []).map((event) => [reportDateTime(event.at), event.label, event.technicianName]))),
    reportSection('Diagnóstico e atendimento', reportFacts([['Diagnóstico', occurrence.finalDiagnosis || occurrence.technicalReport?.finalDiagnosis || occurrence.partRequest?.diagnosis || occurrence.metadata?.diagnosis?.summary], ['Ação realizada', occurrence.solution || occurrence.technicalReport?.maintenancePerformed], ['Peças substituídas', list(occurrence.technicalReport?.replacedParts || occurrence.replacedParts)], ['Condição final', occurrence.finalCondition], ['Duração', occurrence.duration], ['Observações', occurrence.technicalReport?.technicianNotes || occurrence.completionObservation]])),
    reportSection('Registros da equipe', teamRecords(occurrence)),
    reportSection('Peça solicitada', reportFacts([['Peças', partDescription(occurrence.partRequest)], ['Estado', occurrence.partRequest?.state], ['Solicitada por', occurrence.partRequest?.diagnosedBy?.name], ['Diagnóstico da solicitação', occurrence.partRequest?.diagnosis], ['Local de retirada', occurrence.partRequest?.pickupLocation], ['Solicitada em', reportDateTime(occurrence.partRequest?.requestedAt)]])),
    reportSection('Suporte solicitado', reportFacts([['Motivo', occurrence.supportRequest?.reason], ['Estado', occurrence.supportRequest?.state], ['Observações', occurrence.supportRequest?.observation], ['Solicitado em', reportDateTime(occurrence.supportRequest?.requestedAt)]])),
  ].filter(Boolean).join('');
  printReport({ title, content });
}
