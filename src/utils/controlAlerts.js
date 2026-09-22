import { OPERATION_STATUS } from '../data/operationStatus.js';

export const criticalWaitingStatuses = new Set([
  OPERATION_STATUS.WAITING_ASSIGNMENT,
  OPERATION_STATUS.TECHNICIAN_ASSIGNED,
  OPERATION_STATUS.ACCEPTED,
]);

const RESOLVED_URGENT_STORAGE_KEY = 'hop-control-resolved-urgent-v2';

export const readResolvedAlerts = () => {
  try {
    window.localStorage.removeItem('hop-control-dismissed-urgent-v1');
    window.localStorage.removeItem('hop-control-resolved-urgent-v1');
    const stored = JSON.parse(window.localStorage.getItem(RESOLVED_URGENT_STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

export const writeResolvedAlerts = (items) => {
  const normalized = [...new Set(items)].slice(-100);
  try {
    window.localStorage.setItem(RESOLVED_URGENT_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // A resolução continua válida durante a sessão quando o armazenamento está indisponível.
  }
  return normalized;
};

export const buildOccurrenceAlert = (occurrence) => {
  const elapsed = occurrence.priority?.elapsedMinutes ?? 0;
  if (occurrence.metadata?.requiresReassignment || occurrence.metadata?.assignedTechnicianUnavailable) return {
    title: `${occurrence.technician?.name || 'Técnico atribuído'} ficou indisponível com atendimento em aberto`,
    detail: `${occurrence.protocol} · ${occurrence.client?.name}`,
    action: 'Reatribuir',
    actionType: 'reassign',
    tone: 'critical',
    rank: 100,
    alertKey: `${occurrence.id}:technician-unavailable:${occurrence.technicianId || 'none'}:${occurrence.assignedAt || occurrence.time}`,
  };
  if (!occurrence.technicianId) return {
    title: `${occurrence.protocol} está sem técnico atribuído`,
    detail: `${occurrence.client?.name} · ${occurrence.elevator?.identification || 'Elevador'}`,
    action: 'Reatribuir',
    actionType: 'reassign',
    tone: occurrence.priority?.classification === 'crítica' ? 'critical' : 'attention',
    rank: occurrence.priority?.classification === 'crítica' ? 95 : 76,
    alertKey: `${occurrence.id}:unassigned:${occurrence.metadata?.automaticDispatch?.attemptedAt || occurrence.time}`,
  };
  if (occurrence.operationalStatus === OPERATION_STATUS.WAITING_PART) return {
    title: `Nova demanda de peça para ${occurrence.protocol}`,
    detail: `${occurrence.partRequest?.part || 'Peça solicitada'} · ${occurrence.client?.name}`,
    action: 'Ver demanda',
    tone: 'attention',
    rank: 88,
    alertKey: `${occurrence.id}:waiting-part:${occurrence.partRequest?.requestedAt || occurrence.time}`,
  };
  if (occurrence.operationalStatus === OPERATION_STATUS.PART_AVAILABLE) return {
    title: `Peça disponível e atendimento ainda não retomado`,
    detail: `${occurrence.protocol} · ${occurrence.client?.name}`,
    action: 'Retomar',
    tone: 'attention',
    rank: 84,
    alertKey: `${occurrence.id}:part-available:${occurrence.partRequest?.availableAt || occurrence.time}`,
  };
  if (occurrence.priority?.classification === 'crítica'
    && criticalWaitingStatuses.has(occurrence.operationalStatus)
    && elapsed >= 30) return {
    title: `${occurrence.protocol} crítica aguarda além do limite`,
    detail: `${occurrence.client?.name} · ${occurrence.technician?.name || 'Sem técnico'}`,
    action: 'Ver ocorrência',
    tone: 'critical',
    rank: 90,
    alertKey: `${occurrence.id}:critical-wait:${occurrence.workflowHistory?.at(-1)?.at || occurrence.assignedAt || occurrence.time}`,
  };
  return null;
};

export const buildRecurrenceAlerts = (occurrences, active) => {
  const byElevator = new Map();
  occurrences.forEach((occurrence) => {
    if (!occurrence.elevatorId) return;
    const group = byElevator.get(occurrence.elevatorId) || [];
    group.push(occurrence);
    byElevator.set(occurrence.elevatorId, group);
  });

  return [...byElevator.entries()].flatMap(([elevatorId, related]) => {
    const activeOccurrence = active.find((occurrence) => occurrence.elevatorId === elevatorId);
    if (!activeOccurrence || related.length < 2) return [];
    return [{
      occurrence: activeOccurrence,
      title: `${activeOccurrence.elevator?.identification || 'Elevador'} é reincidente em múltiplas falhas`,
      detail: `${activeOccurrence.client?.name} · ${related.length} ocorrências registradas`,
      action: 'Ver histórico',
      actionType: 'elevator-history',
      elevatorId,
      tone: 'attention',
      rank: 70,
      alertKey: `recurrence-${elevatorId}-${related.length}`,
    }];
  });
};
