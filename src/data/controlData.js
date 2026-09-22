import { operatorOccurrenceMetadata } from './operatorData.js';
import {
  elevators,
  getClientById,
  getElevatorById,
  getTechnicianById,
  occurrences,
  technicians,
} from './mockData.js';
import { calculatePriority } from '../utils/priorityScore.js';
import { getProfilePhotoPath } from '../utils/profileAvatar.js';
import { clientGeoPositions } from './geoCoordinates.js';
import { OPERATION_STATUS } from './operationStore.js';

export const controlUser = {
  id: 'CONTROL-USER-001',
  name: 'Fernanda Lima',
  initials: 'FL',
  role: 'Supervisora de Operações',
  avatar: getProfilePhotoPath('Fernanda Lima', 'leadership'),
};

const workflowFromStatus = (occurrence) => {
  if (occurrence.workflowStatus) return occurrence.workflowStatus;
  if (occurrence.status === 'em deslocamento') return OPERATION_STATUS.TRAVELING;
  if (occurrence.status === 'em atendimento') return OPERATION_STATUS.MAINTENANCE;
  if (occurrence.status === 'resolvida') return OPERATION_STATUS.RESOLVED;
  return occurrence.technicianId ? OPERATION_STATUS.TECHNICIAN_ASSIGNED : OPERATION_STATUS.WAITING_ASSIGNMENT;
};

const getOperationalStatus = (workflowStatus, hasTechnician = true) => {
  if (workflowStatus) return workflowStatus;
  return hasTechnician ? OPERATION_STATUS.TECHNICIAN_ASSIGNED : OPERATION_STATUS.WAITING_ASSIGNMENT;
};

const buildMetadata = (occurrence, index, elevator) => {
  const existing = occurrence.metadata || operatorOccurrenceMetadata[occurrence.id] || {};
  const clientGeo = clientGeoPositions[occurrence.clientId];
  const fallbackLat = clientGeo?.lat ?? -23.5587;
  const fallbackLng = clientGeo?.lng ?? -46.6500;
  return {
    ...existing,
    serviceNumber: occurrence.protocol || existing.serviceNumber || `HOP-${1040 + index}`,
    distanceKm: existing.distanceKm ?? (2.1 + (index % 8) * 1.3),
    etaMinutes: existing.etaMinutes ?? (6 + (index % 7) * 3),
    latitude: existing.latitude ?? fallbackLat,
    longitude: existing.longitude ?? fallbackLng,
    riskToLife: existing.riskToLife ?? null,
    riskUnknown: existing.riskUnknown ?? false,
    criticalFacility: existing.criticalFacility ?? getClientById(occurrence.clientId)?.type === 'Hospital',
    elevatorStopped: existing.elevatorStopped ?? elevator?.status === 'parado',
    partialFailure: existing.partialFailure ?? ['atenção', 'baixa'].includes(occurrence.severity),
    recurrence: existing.recurrence ?? occurrences.filter((item) => item.elevatorId === occurrence.elevatorId).length >= 2,
    clientNotes: existing.clientNotes || occurrence.observation || occurrence.locationContext,
    diagnosis: existing.diagnosis,
  };
};

export const buildControlOccurrences = (operationState, now = new Date()) => {
  const sharedOccurrences = operationState?.occurrences || [];
  return sharedOccurrences.map((occurrence, index) => {
    const client = getClientById(occurrence.clientId) || {
      id: occurrence.clientId || 'CLI-001',
      name: occurrence.address?.split('—')[0]?.trim() || 'Cliente Corporativo',
      type: 'Estabelecimento',
      address: occurrence.address || 'São Paulo — SP',
    };
    const baseElevator = getElevatorById(occurrence.elevatorId) || {
      id: occurrence.elevatorId || 'ELV-001',
      identification: 'Elevador Principal',
      model: 'Passageiros',
      status: 'operando',
      clientId: client.id,
    };
    const metadata = buildMetadata(occurrence, index, baseElevator);
    const elevator = metadata.elevatorStopped ? { ...baseElevator, status: 'parado' } : baseElevator;
    const workflowStatus = workflowFromStatus(occurrence);
    const technicianId = occurrence.technicianId || occurrence.assignedTechnicianId || null;
    const technician = technicianId ? getTechnicianById(technicianId) : null;
    const priority = calculatePriority({ occurrence, client, elevator, metadata, now });
    return {
      ...occurrence,
      client,
      elevator,
      metadata,
      priority,
      protocol: metadata.serviceNumber,
      technicianId,
      technician,
      workflowStatus,
      operationalStatus: getOperationalStatus(workflowStatus, Boolean(technicianId)),
    };
  }).sort((first, second) => (second.priority?.score ?? 0) - (first.priority?.score ?? 0));
};

export const buildControlTechnicians = (controlOccurrences, operatorShiftActive = true) => technicians.map((technician, index) => {
  const technicianOccurrences = controlOccurrences.filter((occurrence) =>
    occurrence.technicianId === technician.id && occurrence.operationalStatus !== OPERATION_STATUS.RESOLVED);
  const executionOccurrence = technicianOccurrences.find((occurrence) => [
    OPERATION_STATUS.ACCEPTED,
    OPERATION_STATUS.TRAVELING,
    OPERATION_STATUS.TRAVELING_TO_PICKUP,
    OPERATION_STATUS.RETURNING_TO_CLIENT,
    OPERATION_STATUS.ON_SITE,
    OPERATION_STATUS.MAINTENANCE,
  ].includes(occurrence.operationalStatus));
  const currentOccurrence = executionOccurrence || technicianOccurrences[0] || null;
  let status = technician.status;

  if (technicianOccurrences.length > 0) {
    if ([OPERATION_STATUS.TRAVELING, OPERATION_STATUS.TRAVELING_TO_PICKUP, OPERATION_STATUS.RETURNING_TO_CLIENT].includes(currentOccurrence?.operationalStatus)) {
      status = 'em deslocamento';
    } else {
      status = 'em atendimento';
    }
  } else {
    if (technician.id === 'TEC-010') {
      status = operatorShiftActive ? 'disponível' : 'indisponível';
    } else if (technician.status !== 'indisponível') {
      status = 'disponível';
    }
  }

  if (technician.id === 'TEC-010' && !operatorShiftActive) status = 'indisponível';
  return {
    ...technician,
    status,
    currentOccurrence,
    executionOccurrence,
    completedToday: 1 + (index % 4),
    recentHistory: [
      `${10 + (index % 4)}:${index % 2 ? '35' : '10'} — Atendimento concluído`,
      `Ontem — ${technician.specialty}`,
    ],
    mapPosition: { x: 15 + ((index * 17) % 72), y: 18 + ((index * 23) % 64) },
  };
});

export const buildElevatorOverview = (controlOccurrences = []) => elevators.map((elevator) => {
  const related = controlOccurrences
    .filter((occurrence) => occurrence.elevatorId === elevator.id)
    .sort((first, second) => new Date(second.time || 0) - new Date(first.time || 0));
  const lastOccurrence = [...related].sort((first, second) => new Date(second.time) - new Date(first.time))[0];
  const activeOccurrence = related.find((occurrence) => occurrence.operationalStatus !== OPERATION_STATUS.RESOLVED);
  const finalCondition = !activeOccurrence ? lastOccurrence?.finalCondition : null;
  const client = getClientById(elevator.clientId) || {
    id: elevator.clientId || 'CLI-001',
    name: 'Cliente Corporativo',
    type: 'Estabelecimento',
  };
  return {
    ...elevator,
    status: activeOccurrence?.elevator?.status
      || (finalCondition === 'Equipamento permanece indisponível' ? 'parado'
        : finalCondition === 'Funcionamento parcial' ? 'atenção'
          : finalCondition === 'Operação restabelecida' ? 'operando' : elevator.status),
    client,
    activeOccurrence,
    lastOccurrence,
    maintenanceHistory: related,
    recentOccurrenceCount: related.length,
    recurrent: related.length >= 2,
  };
});
