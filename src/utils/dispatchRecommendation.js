import { OPERATION_STATUS } from '../data/operationStatus.js';
import { technicians as allTechnicians } from '../data/mockData.js';
import { calculateHaversineDistanceKm, getEstablishmentGeoPoint, getTechnicianGeoPoint } from '../data/geoCoordinates.js';

const normalize = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const executionStatuses = new Set([
  OPERATION_STATUS.ACCEPTED,
  OPERATION_STATUS.TRAVELING,
  OPERATION_STATUS.ON_SITE,
  OPERATION_STATUS.MAINTENANCE,
  OPERATION_STATUS.TRAVELING_TO_PICKUP,
  OPERATION_STATUS.RETURNING_TO_CLIENT,
]);

const activeOccurrenceFor = (occurrence) => occurrence.workflowStatus !== OPERATION_STATUS.RESOLVED
  && occurrence.operationalStatus !== OPERATION_STATUS.RESOLVED;

const getSpecialtyMatch = (technician, occurrence) => {
  const specialty = normalize(technician?.specialty);
  const problem = normalize([
    occurrence?.description,
    occurrence?.detectedFailure,
    ...(occurrence?.metadata?.reportedProblems || []),
    occurrence?.metadata?.diagnosis?.probableOrigin,
  ].filter(Boolean).join(' '));

  if ((occurrence?.trappedPeople || 0) > 0) {
    return specialty.includes('resgate')
      ? { score: 34, reason: 'Especialidade compatível com resgate e emergência' }
      : { score: 0, reason: 'Atendimento emergencial fora da especialidade principal' };
  }
  if ((problem.includes('porta') || problem.includes('acesso')) && specialty.includes('porta')) {
    return { score: 27, reason: 'Especialidade compatível com portas e acessos' };
  }
  if ((problem.includes('painel') || problem.includes('botao') || problem.includes('comando'))
    && (specialty.includes('painel') || specialty.includes('comando') || specialty.includes('eletric'))) {
    return { score: 27, reason: 'Especialidade compatível com comandos e painéis' };
  }
  if ((problem.includes('eletric') || problem.includes('energia')) && specialty.includes('eletric')) {
    return { score: 27, reason: 'Especialidade compatível com sistemas elétricos' };
  }
  if ((problem.includes('ruido') || problem.includes('tracao') || problem.includes('mecanic')) && specialty.includes('mec')) {
    return { score: 24, reason: 'Especialidade compatível com mecânica e tração' };
  }
  if ((problem.includes('preventiv') || problem.includes('nivelamento')) && specialty.includes('preventiv')) {
    return { score: 22, reason: 'Especialidade compatível com manutenção preventiva' };
  }
  return { score: 8, reason: 'Perfil técnico geral compatível com o atendimento' };
};

/**
 * Evaluates candidate technicians for a given occurrence, ranking them
 * based on specialty match, Haversine geospatial proximity, and current workload.
 *
 * @param {Object} occurrence - The occurrence needing technical dispatch.
 * @param {Array<Object>} technicians - List of technician entities to evaluate.
 * @param {Array<Object>} [activeOccurrences=[]] - Current active occurrences to calculate load.
 * @returns {Array<{technician: Object, available: boolean, score: number, load: number, distanceKm: number, reasons: string[]}>}
 */
export const rankTechniciansForDispatch = (occurrence, technicians, activeOccurrences = []) => {
  const destPoint = occurrence?.clientId
    ? getEstablishmentGeoPoint(occurrence.clientId)
    : (occurrence?.metadata?.latitude && occurrence?.metadata?.longitude
      ? [occurrence.metadata.latitude, occurrence.metadata.longitude]
      : null);

  return technicians
    .map((technician) => {
      const assignedOccurrences = activeOccurrences.filter((item) => {
        const technicianId = item.technicianId || item.assignedTechnicianId;
        return technicianId === technician.id && activeOccurrenceFor(item);
      });
      const executing = assignedOccurrences.some((item) => executionStatuses.has(item.workflowStatus || item.operationalStatus));
      const load = assignedOccurrences.length;
      const available = technician.status === 'disponível' && !executing && load < 2;
      const specialty = getSpecialtyMatch(technician, occurrence);

      let distanceKm = 10;
      if (destPoint) {
        const techPoint = getTechnicianGeoPoint(technician);
        const calcDist = calculateHaversineDistanceKm(techPoint, destPoint);
        distanceKm = calcDist > 0 ? calcDist : Number(technician.distanceKm ?? 2.4);
      } else {
        distanceKm = Number(technician.distanceKm ?? occurrence?.metadata?.distanceKm ?? 10);
      }

      const proximityScore = Math.max(0, 28 - distanceKm * 2.6);
      const loadScore = Math.max(0, 22 - load * 11);
      const score = Math.round(40 + specialty.score + proximityScore + loadScore);
      const loadReason = load === 0 ? 'Sem chamados ativos' : `Carga atual: ${load} chamado${load > 1 ? 's' : ''}`;

      return {
        technician,
        available,
        score,
        load,
        distanceKm,
        reasons: [
          'Disponível para despacho',
          specialty.reason,
          `Proximidade estimada de ${distanceKm.toFixed(1).replace('.', ',')} km`,
          loadReason,
        ],
      };
    })
    .filter((candidate) => candidate.available)
    .sort((first, second) => second.score - first.score
      || first.distanceKm - second.distanceKm
      || first.technician.name.localeCompare(second.technician.name));
};

/**
 * Returns the best recommended candidate object or null if none available.
 * @param {Object} occurrence
 * @param {Array<Object>} technicians
 * @param {Array<Object>} [activeOccurrences=[]]
 * @returns {Object|null}
 */
export const getTechnicianRecommendation = (occurrence, technicians, activeOccurrences = []) =>
  rankTechniciansForDispatch(occurrence, technicians, activeOccurrences)[0] || null;

/**
 * Returns the recommended technician entity directly or null.
 * @param {Object} occurrence
 * @param {Array<Object>} technicians
 * @param {Array<Object>} [activeOccurrences=[]]
 * @returns {Object|null}
 */
export const recommendTechnician = (occurrence, technicians, activeOccurrences = []) =>
  getTechnicianRecommendation(occurrence, technicians, activeOccurrences)?.technician || null;

/**
 * Attempts automated dispatch for an occurrence in WAITING_ASSIGNMENT state.
 * Assigns best matching technician and calculates initial ETA and metadata.
 *
 * @param {Object} occurrence
 * @param {Object} [options]
 * @param {boolean} [options.operatorShiftActive=true]
 * @param {Array<Object>} [options.occurrences=[]]
 * @returns {Object} Occurrence updated with assignment or no-technician flag.
 */
export const resolveAutomaticDispatch = (occurrence, { operatorShiftActive = true, occurrences = [] } = {}) => {
  if (occurrence.technicianId || occurrence.workflowStatus !== OPERATION_STATUS.WAITING_ASSIGNMENT) {
    return occurrence;
  }

  const attemptedAt = new Date().toISOString();
  const dispatchTechnicians = allTechnicians.map((technician) => technician.id === 'TEC-010' && !operatorShiftActive
    ? { ...technician, status: 'indisponível' }
    : technician);
  const recommendation = getTechnicianRecommendation(occurrence, dispatchTechnicians, occurrences);

  if (recommendation) {
    const { technician, reasons, score, distanceKm, load } = recommendation;
    return {
      ...occurrence,
      technicianId: technician.id,
      assignedTechnicianId: technician.id,
      assignedAt: attemptedAt,
      workflowStatus: OPERATION_STATUS.TECHNICIAN_ASSIGNED,
      metadata: {
        ...occurrence.metadata,
        distanceKm,
        etaMinutes: Math.max(5, Math.round(distanceKm * 3)),
        assignedTechnicianUnavailable: false,
        requiresReassignment: false,
        automaticDispatch: { status: 'assigned', attemptedAt },
        automaticAssignment: {
          mode: 'automatic',
          technicianId: technician.id,
          assignedAt: attemptedAt,
          score,
          activeLoadAtAssignment: load,
          reasons,
        },
      },
      workflowHistory: [
        ...(occurrence.workflowHistory || []),
        {
          status: OPERATION_STATUS.TECHNICIAN_ASSIGNED,
          label: `${technician.name} atribuído automaticamente`,
          at: attemptedAt,
          technicianId: technician.id,
          technicianName: technician.name,
        },
      ],
    };
  }

  return {
    ...occurrence,
    metadata: {
      ...occurrence.metadata,
      automaticDispatch: {
        status: 'no-technician',
        attemptedAt,
        reason: 'Nenhum técnico disponível atende aos critérios de despacho neste momento.',
      },
    },
  };
};
