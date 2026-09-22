import { operatorOccurrenceMetadata } from './operatorData.js';
import { clients, elevators, createMockOccurrences } from './mockData.js';
import { calculatePriority } from '../utils/priorityScore.js';
import { resolveAutomaticDispatch } from '../utils/dispatchRecommendation.js';
import { publishOperationNotifications, resetNotifications } from './notificationStore.js';
import { OPERATION_STATUS } from './operationStatus.js';

export { OPERATION_STATUS };

const computeDuration = (startIso, endIso) => {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const minutes = Math.max(1, Math.round((end - start) / 60000));
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours ? `${hours}h${remaining ? ` ${remaining}min` : ''}` : `${minutes} min`;
};

const OPERATION_STORAGE_KEY = 'hop-shared-operation-v5';
const OPERATION_UPDATED_EVENT = 'hop-operation-updated';

let cachedRawState = null;
let cachedOperationState = null;

const clientById = (id) => clients.find((client) => client.id === id);
const elevatorById = (id) => elevators.find((elevator) => elevator.id === id);

const initialWorkflowStatus = (occurrence) => {
  if (occurrence.status === 'resolvida') return OPERATION_STATUS.RESOLVED;
  if (occurrence.status === 'em deslocamento') return OPERATION_STATUS.TRAVELING;
  if (occurrence.status === 'em atendimento') return OPERATION_STATUS.MAINTENANCE;
  return occurrence.technicianId ? OPERATION_STATUS.TECHNICIAN_ASSIGNED : OPERATION_STATUS.WAITING_ASSIGNMENT;
};

const createSeedOccurrence = (occurrence, index, now) => {
  const seededOccurrence = occurrence.technicianId === 'TEC-010'
    ? { ...occurrence, technicianId: null }
    : occurrence;
  const client = clientById(seededOccurrence.clientId);
  const elevator = elevatorById(seededOccurrence.elevatorId);
  const metadata = operatorOccurrenceMetadata[occurrence.id] || {};
  const priority = calculatePriority({ occurrence: seededOccurrence, client, elevator, metadata, now });
  const workflowStatus = initialWorkflowStatus(seededOccurrence);
  return {
    ...seededOccurrence,
    protocol: metadata.serviceNumber || `HOP-${1100 + index}`,
    metadata,
    priority,
    workflowStatus,
    origin: 'mock',
    completedAt: workflowStatus === OPERATION_STATUS.RESOLVED ? (occurrence.completedAt || occurrence.time) : null,
    duration: workflowStatus === OPERATION_STATUS.RESOLVED ? (occurrence.duration || computeDuration(occurrence.time, occurrence.completedAt || occurrence.time)) : null,
  };
};

export const createInitialOperationState = (now = new Date()) => {
  const seedOccurrences = createMockOccurrences(now);
  return {
    version: 5,
    updatedAt: now.toISOString(),
    operatorShiftActive: true,
    occurrences: seedOccurrences.map((occurrence, index) => createSeedOccurrence(occurrence, index, now)),
  };
};

export const validateAndSanitizeOccurrence = (occ, index = 0, now = new Date()) => {
  if (!occ || typeof occ !== 'object') return null;
  const clientId = occ.clientId || 'CLI-001';
  const elevatorId = occ.elevatorId || 'ELV-001';
  const client = clientById(clientId) || clients[0];
  const elevator = elevatorById(elevatorId) || elevators[0];
  const templateMeta = operatorOccurrenceMetadata[occ.id] || {};
  const metadata = {
    distanceKm: 2.4,
    etaMinutes: 10,
    serviceNumber: `HOP-${1100 + index}`,
    ...templateMeta,
    ...(occ.metadata || {}),
  };

  const priority = calculatePriority({ occurrence: { ...occ, clientId, elevatorId }, client, elevator, metadata, now });

  const workflowStatus = occ.workflowStatus || initialWorkflowStatus(occ);

  return {
    ...occ,
    id: occ.id || `OCC-AUTO-${index}`,
    clientId,
    elevatorId,
    description: occ.description || 'Intercorrência reportada no equipamento.',
    protocol: occ.protocol || metadata.serviceNumber || `HOP-${1100 + index}`,
    time: occ.time || now.toISOString(),
    trappedPeople: Number(occ.trappedPeople) || 0,
    severity: occ.severity || priority.classification || 'baixa',
    status: occ.status || 'aberta',
    technicianId: occ.technicianId || null,
    origin: occ.origin || 'mock',
    metadata,
    priority,
    workflowStatus,
    completedAt: workflowStatus === OPERATION_STATUS.RESOLVED ? (occ.completedAt || occ.time || now.toISOString()) : null,
    duration: workflowStatus === OPERATION_STATUS.RESOLVED ? (occ.duration || computeDuration(occ.time, occ.completedAt || occ.time)) : null,
  };
};

const normalizeState = (state, now = new Date()) => {
  const rawOccurrences = Array.isArray(state?.occurrences) ? state.occurrences : [];
  const occurrences = rawOccurrences
    .map((occ, idx) => validateAndSanitizeOccurrence(occ, idx, now))
    .filter(Boolean);

  return {
    version: 5,
    updatedAt: state?.updatedAt || now.toISOString(),
    operatorShiftActive: state?.operatorShiftActive !== false,
    occurrences: occurrences.length ? occurrences : createInitialOperationState(now).occurrences,
  };
};

const cacheState = (state) => {
  cachedOperationState = normalizeState(state);
  cachedRawState = JSON.stringify(cachedOperationState);
  return cachedOperationState;
};

const readOperationState = () => {
  try {
    window.localStorage.removeItem('hop-shared-operation-v1');
    window.localStorage.removeItem('hop-shared-operation-v2');
    window.localStorage.removeItem('hop-shared-operation-v3');
    window.localStorage.removeItem('hop-shared-operation-v4');
    const stored = window.localStorage.getItem(OPERATION_STORAGE_KEY);
    if (stored === cachedRawState && cachedOperationState) return cachedOperationState;
    if (stored) {
      let parsed = null;
      try {
        parsed = JSON.parse(stored);
      } catch {
        parsed = null;
      }

      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.occurrences) && parsed.occurrences.length > 0) {
        const storedTime = new Date(parsed.updatedAt || 0).getTime();
        const isStale = Number.isNaN(storedTime) || (Date.now() - storedTime > 12 * 60 * 60 * 1000);

        if (!isStale) {
          const sanitizedState = normalizeState(parsed);
          cachedOperationState = sanitizedState;
          cachedRawState = JSON.stringify(sanitizedState);
          return cachedOperationState;
        }

        // Re-ancora as ocorrências de demonstração se forem de outro dia (>12h), mantendo o MVP sempre atualizado
        const freshState = createInitialOperationState(new Date());
        const clientCreated = (parsed.occurrences || [])
          .filter((item) => item?.origin !== 'mock')
          .map((item, idx) => validateAndSanitizeOccurrence(item, idx))
          .filter(Boolean);

        if (clientCreated.length) {
          freshState.occurrences = [...clientCreated, ...freshState.occurrences];
        }

        const cachedFresh = cacheState(freshState);
        try {
          window.localStorage.setItem(OPERATION_STORAGE_KEY, cachedRawState);
        } catch {
          /* mantém em memória */
        }
        return cachedFresh;
      }
    }

    // Se não há dados salvos ou estavam corrompidos, inicia com o estado limpo
    const initialState = createInitialOperationState();
    const cachedInitialState = cacheState(initialState);
    try {
      window.localStorage.setItem(OPERATION_STORAGE_KEY, cachedRawState);
    } catch {
      /* mantém em memória */
    }
    return cachedInitialState;
  } catch (err) {
    console.warn('HOP: Falha ao ler operationState do localStorage. Usando estado inicial limpo.', err);
    if (!cachedOperationState) cacheState(createInitialOperationState());
    return cachedOperationState;
  }
};

const writeOperationState = (state, { force = false } = {}) => {
  const nextState = { ...normalizeState(state), updatedAt: new Date().toISOString() };
  const currentState = readOperationState();
  if (!force
    && currentState.operatorShiftActive === nextState.operatorShiftActive
    && JSON.stringify(currentState.occurrences) === JSON.stringify(nextState.occurrences)) return currentState;
  const cachedNextState = cacheState(nextState);
  try {
    window.localStorage.setItem(OPERATION_STORAGE_KEY, cachedRawState);
  } catch {
    // O estado em memória mantém o MVP funcional quando o armazenamento do navegador está indisponível.
  }
  if (!force) publishOperationNotifications(currentState, cachedNextState);
  window.dispatchEvent(new CustomEvent(OPERATION_UPDATED_EVENT));
  return cachedNextState;
};

/**
 * Inserts a new occurrence into the shared operational store, automatically
 * triggering prioritization and smart automated technician dispatch.
 *
 * @param {Object} occurrence - Raw or partially populated occurrence data.
 * @returns {Object} Updated shared operation state snapshot.
 */
export const addOperationOccurrence = (occurrence) => {
  const state = readOperationState();
  const sanitizedOccurrence = validateAndSanitizeOccurrence(occurrence, 0);
  if (!sanitizedOccurrence) return state;

  const preparedOccurrence = resolveAutomaticDispatch(sanitizedOccurrence, {
    operatorShiftActive: state.operatorShiftActive,
    occurrences: state.occurrences,
  });

  return writeOperationState({
    ...state,
    occurrences: [preparedOccurrence, ...state.occurrences.filter((item) => item.id !== preparedOccurrence.id)],
  });
};

/**
 * Updates an existing occurrence in the shared operational store.
 * Supports partial object changes or an updater function receiving the current occurrence.
 *
 * @param {string} occurrenceId - The unique occurrence ID (e.g., 'OCC-2026-001').
 * @param {Object|Function} changes - Partial fields to update or function returning changes.
 * @returns {Object} Updated shared operation state snapshot.
 */
export const updateOperationOccurrence = (occurrenceId, changes) => {
  const state = readOperationState();
  let changed = false;
  const occurrences = state.occurrences.map((occurrence) => {
    if (occurrence.id !== occurrenceId) return occurrence;
    const occurrenceChanges = typeof changes === 'function' ? changes(occurrence) : changes;
    if (!occurrenceChanges || Object.entries(occurrenceChanges).every(([key, value]) => Object.is(occurrence[key], value))) return occurrence;
    changed = true;
    return { ...occurrence, ...occurrenceChanges };
  });
  if (!changed) return state;
  return writeOperationState({ ...state, occurrences });
};

/**
 * Sets the operator's duty shift state (active or inactive).
 *
 * @param {boolean} operatorShiftActive
 * @returns {Object} Updated shared operation state snapshot.
 */
export const updateOperatorShift = (operatorShiftActive) => {
  const state = readOperationState();
  return writeOperationState({ ...state, operatorShiftActive: Boolean(operatorShiftActive) });
};

/**
 * Resets the shared operational store back to pristine initial mock demo state,
 * clearing any stale or orphaned localStorage keys across modules.
 *
 * @returns {Object} Fresh initial operation state snapshot.
 */
export const resetOperationState = () => {
  const initialState = createInitialOperationState();
  const obsoleteKeys = [
    'hop-client-calls', 'hop-client-created-occurrences', 'hop-operator-occurrence-statuses',
    'hop-operator-technician-status', 'hop-operator-completed-items', 'hop-control-occurrence-assignments',
    'hop-shared-operation-v1', 'hop-shared-operation-v2', 'hop-shared-operation-v3',
  ];
  try {
    obsoleteKeys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // A restauração ainda atualiza a fonte em memória.
  }
  resetNotifications();
  return writeOperationState(initialState, { force: true });
};

/**
 * Subscribes to operational store changes across tabs (storage event),
 * intra-window events (CustomEvent), and an interval heartbeat for relative time tracking.
 *
 * @param {() => void} callback - Listener invoked on state mutations.
 * @returns {() => void} Unsubscribe cleanup function.
 */
export const subscribeOperationState = (callback) => {
  const handleCustomUpdate = () => callback();
  const handleStorageUpdate = (event) => {
    if (event.key !== OPERATION_STORAGE_KEY || event.newValue === cachedRawState) return;
    if (event.newValue) {
      try {
        cachedRawState = event.newValue;
        cachedOperationState = normalizeState(JSON.parse(event.newValue));
      } catch {
        cachedRawState = null;
        cachedOperationState = null;
      }
    }
    callback();
  };
  // Atualiza periodicamente para manter tempos relativos sincronizados
  const intervalId = window.setInterval(callback, 60000);

  window.addEventListener(OPERATION_UPDATED_EVENT, handleCustomUpdate);
  window.addEventListener('storage', handleStorageUpdate);
  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener(OPERATION_UPDATED_EVENT, handleCustomUpdate);
    window.removeEventListener('storage', handleStorageUpdate);
  };
};

/**
 * Returns an immediate read snapshot of current operation state.
 * @returns {Object}
 */
export const getOperationSnapshot = () => readOperationState();

