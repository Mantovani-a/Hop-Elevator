import { operatorOccurrenceMetadata } from './operatorData.js';
import { clients, elevators, createMockOccurrences } from './mockData.js';
import { calculatePriority } from '../utils/priorityScore.js';
import { resolveAutomaticDispatch } from '../utils/dispatchRecommendation.js';
import { publishOperationNotifications, resetNotifications } from './notificationStore.js';
import { OPERATION_STATUS } from './operationStatus.js';
import { seedComponentFor } from './technicalIntelligence.js';
import { DEFAULT_SHIFT_PLAN, deriveShift, validShiftPlan, localDay } from '../utils/shiftSchedule.js';
import { normalizeOccurrenceTeam } from '../utils/occurrenceTeam.js';

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

const dateFromNow = (days, now) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const createSeedPreventives = (now) => [
  { id: 'PREV-001', elevatorId: 'ELV-001', date: dateFromNow(2, now), window: '09:00–11:00', note: 'Inspeção periódica de portas e nivelamento', occurrenceId: null },
  { id: 'PREV-002', elevatorId: 'ELV-003', date: dateFromNow(5, now), window: '13:00–15:00', note: 'Verificação do elevador de serviço', occurrenceId: null },
  { id: 'PREV-003', elevatorId: 'ELV-006', date: dateFromNow(8, now), window: '09:00–11:00', note: 'Inspeção periódica', occurrenceId: null },
];

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
    componentId: seedComponentFor(seededOccurrence.id),
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
    version: 6,
    updatedAt: now.toISOString(),
    operatorShiftActive: false,
    operatorShiftPlan: { ...DEFAULT_SHIFT_PLAN },
    shiftEvents: [],
    occurrences: seedOccurrences.map((occurrence, index) => createSeedOccurrence(occurrence, index, now)),
    preventives: createSeedPreventives(now),
  };
};

export const validateAndSanitizeOccurrence = (occ, index = 0, now = new Date()) => {
  if (!occ || typeof occ !== 'object') return null;
  try {
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

    let priority;
    try {
      priority = calculatePriority({ occurrence: { ...occ, clientId, elevatorId }, client, elevator, metadata, now });
    } catch {
      priority = { score: 15, classification: 'baixa', slaMinutes: 180, label: 'Baixa prioridade' };
    }

    const workflowStatus = occ.workflowStatus || initialWorkflowStatus(occ);
    const team = normalizeOccurrenceTeam({ ...occ, priority });

    return {
      ...occ,
      componentId: occ.componentId || seedComponentFor(occ.id),
      id: occ.id || `OCC-AUTO-${index}`,
      clientId,
      elevatorId,
      description: occ.description || 'Intercorrência reportada no equipamento.',
      protocol: occ.protocol || metadata.serviceNumber || `HOP-${1100 + index}`,
      time: occ.time || now.toISOString(),
      trappedPeople: Number(occ.trappedPeople) || 0,
      severity: occ.severity || priority?.classification || 'baixa',
      status: occ.status || 'aberta',
      technicianId: team.responsibleId,
      assignedTechnicianId: team.responsibleId,
      team,
      origin: occ.origin || 'mock',
      metadata,
      priority: priority || { score: 15, classification: 'baixa', slaMinutes: 180 },
      workflowStatus,
      completedAt: workflowStatus === OPERATION_STATUS.RESOLVED ? (occ.completedAt || occ.time || now.toISOString()) : null,
      duration: workflowStatus === OPERATION_STATUS.RESOLVED ? (occ.duration || computeDuration(occ.time, occ.completedAt || occ.time)) : null,
    };
  } catch (err) {
    console.warn('HOP: Erro ao sanitizar ocorrência, ignorando item inconsistente:', err);
    return null;
  }
};

const normalizeState = (state, now = new Date()) => {
  try {
    const rawOccurrences = Array.isArray(state?.occurrences) ? state.occurrences : [];
    const occurrences = rawOccurrences
      .map((occ, idx) => validateAndSanitizeOccurrence(occ, idx, now))
      .filter(Boolean);
    const shiftEvents = Array.isArray(state?.shiftEvents) ? state.shiftEvents.filter((event) => event?.type && event?.at && !Number.isNaN(new Date(event.at).getTime())) : [];
    const todayEvents = shiftEvents.filter((event) => event.technicianId === 'TEC-010' && localDay(event.at) === localDay(now));
    const shiftStatus = deriveShift(todayEvents, now).status;

    return {
      version: 6,
      updatedAt: state?.updatedAt || now.toISOString(),
      operatorShiftActive: shiftStatus === 'active' || shiftStatus === 'break',
      operatorShiftPlan: validShiftPlan(state?.operatorShiftPlan) ? state.operatorShiftPlan : { ...DEFAULT_SHIFT_PLAN },
      shiftEvents,
      occurrences: occurrences.length ? occurrences : createInitialOperationState(now).occurrences,
      preventives: Array.isArray(state?.preventives) ? state.preventives.filter((plan) => plan?.id && plan?.elevatorId && /^\d{4}-\d{2}-\d{2}$/.test(plan.date || '')) : createSeedPreventives(now),
    };
  } catch (err) {
    console.warn('HOP: Falha ao normalizar estado. Retornando estado inicial limpo.', err);
    return createInitialOperationState(now);
  }
};

const cacheState = (state) => {
  cachedOperationState = normalizeState(state);
  cachedRawState = JSON.stringify(cachedOperationState);
  return cachedOperationState;
};

const readOperationState = () => {
  try {
    ['hop-shared-operation-v1', 'hop-shared-operation-v2', 'hop-shared-operation-v3', 'hop-shared-operation-v4'].forEach((k) => {
      try { window.localStorage.removeItem(k); } catch { /* noop */ }
    });

    const stored = window.localStorage.getItem(OPERATION_STORAGE_KEY);
    if (stored === cachedRawState && cachedOperationState) return cachedOperationState;

    if (stored) {
      let parsed = null;
      try {
        parsed = JSON.parse(stored);
      } catch {
        // JSON corrompido: auto-purga silenciosa
        console.warn('HOP: JSON corrompido no localStorage. Realizando auto-purga.');
        window.localStorage.removeItem(OPERATION_STORAGE_KEY);
        parsed = null;
      }

      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.occurrences) && parsed.occurrences.length > 0) {
        const storedTime = new Date(parsed.updatedAt || 0).getTime();
        const isStale = Number.isNaN(storedTime);

        if (!isStale) {
          const sanitizedState = normalizeState(parsed);
          if (sanitizedState && Array.isArray(sanitizedState.occurrences) && sanitizedState.occurrences.length > 0) {
            cachedOperationState = sanitizedState;
            cachedRawState = JSON.stringify(sanitizedState);
            if (stored !== cachedRawState) {
              try { window.localStorage.setItem(OPERATION_STORAGE_KEY, cachedRawState); } catch { /* mantém em memória */ }
            }
            return cachedOperationState;
          }
        }

        // Estado inconsistente: recria com estado inicial preservando chamados do cliente válidos.
        const freshState = createInitialOperationState(new Date());
        if (Array.isArray(parsed.preventives)) freshState.preventives = parsed.preventives;
        if (Array.isArray(parsed.shiftEvents)) freshState.shiftEvents = parsed.shiftEvents;
        if (validShiftPlan(parsed.operatorShiftPlan)) freshState.operatorShiftPlan = parsed.operatorShiftPlan;
        try {
          const clientCreated = (parsed.occurrences || [])
            .filter((item) => item?.origin !== 'mock')
            .map((item, idx) => validateAndSanitizeOccurrence(item, idx))
            .filter(Boolean);

          if (clientCreated.length) {
            freshState.occurrences = [...clientCreated, ...freshState.occurrences];
          }
        } catch {
          /* em caso de erro na fusão, mantém apenas o freshState */
        }

        const cachedFresh = cacheState(freshState);
        try {
          window.localStorage.setItem(OPERATION_STORAGE_KEY, cachedRawState);
        } catch {
          /* mantém em memória */
        }
        return cachedFresh;
      } else if (parsed) {
        // Estrutura inválida encontrada: auto-purga
        try { window.localStorage.removeItem(OPERATION_STORAGE_KEY); } catch { /* noop */ }
      }
    }

    // Se não há dados salvos ou foram purgados, inicia com estado limpo
    const initialState = createInitialOperationState();
    const cachedInitialState = cacheState(initialState);
    try {
      window.localStorage.setItem(OPERATION_STORAGE_KEY, cachedRawState);
    } catch {
      /* mantém em memória */
    }
    return cachedInitialState;
  } catch (err) {
    console.warn('HOP: Falha ao ler operationState do localStorage. Auto-purgando e usando estado inicial limpo.', err);
    try { window.localStorage.removeItem(OPERATION_STORAGE_KEY); } catch { /* noop */ }
    if (!cachedOperationState) cacheState(createInitialOperationState());
    return cachedOperationState;
  }
};

const writeOperationState = (state, { force = false } = {}) => {
  try {
    const nextState = { ...normalizeState(state), updatedAt: new Date().toISOString() };
    const currentState = readOperationState();
    if (!force
      && currentState.operatorShiftActive === nextState.operatorShiftActive
      && JSON.stringify(currentState.operatorShiftPlan) === JSON.stringify(nextState.operatorShiftPlan)
      && JSON.stringify(currentState.preventives) === JSON.stringify(nextState.preventives)
      && JSON.stringify(currentState.shiftEvents) === JSON.stringify(nextState.shiftEvents)
      && JSON.stringify(currentState.occurrences) === JSON.stringify(nextState.occurrences)) return currentState;
    const cachedNextState = cacheState(nextState);
    try {
      window.localStorage.setItem(OPERATION_STORAGE_KEY, cachedRawState);
    } catch (storageError) {
      console.warn('HOP: localStorage indisponível ou limite atingido. Estado mantido em memória.', storageError);
    }
    if (!force) {
      try {
        publishOperationNotifications(currentState, cachedNextState);
      } catch (notifErr) {
        console.warn('HOP: Falha ao publicar notificações:', notifErr);
      }
    }
    window.dispatchEvent(new CustomEvent(OPERATION_UPDATED_EVENT));
    return cachedNextState;
  } catch (err) {
    console.error('HOP: Erro na escrita do estado operacional. Recuperando estado seguro.', err);
    return cachedOperationState || cacheState(createInitialOperationState());
  }
};

/**
 * Inserts a new occurrence into the shared operational store, automatically
 * triggering prioritization and smart automated technician dispatch.
 *
 * @param {Object} occurrence - Raw or partially populated occurrence data.
 * @returns {Object} Updated shared operation state snapshot.
 */
export const addOperationOccurrence = (occurrence) => {
  try {
    const state = readOperationState();
    const sanitizedOccurrence = validateAndSanitizeOccurrence(occurrence, 0);
    if (!sanitizedOccurrence) return state;

    let preparedOccurrence = sanitizedOccurrence;
    try {
      preparedOccurrence = resolveAutomaticDispatch(sanitizedOccurrence, {
        operatorShiftActive: state.operatorShiftActive,
        occurrences: state.occurrences,
      });
    } catch (dispatchErr) {
      console.warn('HOP: Falha no despacho automático, mantendo ocorrência sem atribuição automática:', dispatchErr);
    }

    return writeOperationState({
      ...state,
      occurrences: [preparedOccurrence, ...state.occurrences.filter((item) => item.id !== preparedOccurrence.id)],
    });
  } catch (err) {
    console.error('HOP: Erro ao adicionar ocorrência:', err);
    return readOperationState();
  }
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
  try {
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
  } catch (err) {
    console.error('HOP: Erro ao atualizar ocorrência:', err);
    return readOperationState();
  }
};


export const addPreventive = ({ elevatorId, date, window, note }) => {
  const state = readOperationState();
  if (!elevatorById(elevatorId) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return state;
  const plan = { id: `PREV-${Date.now()}`, elevatorId, date, window: window || 'A combinar', note: (note || 'Inspeção periódica').trim(), occurrenceId: null };
  return writeOperationState({ ...state, preventives: [...state.preventives, plan] });
};

export const reschedulePreventive = (planId, date) => {
  const state = readOperationState();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return state;
  return writeOperationState({ ...state, preventives: state.preventives.map((plan) => plan.id === planId && !plan.occurrenceId ? { ...plan, date } : plan) });
};

export const startPreventive = (planId) => {
  const state = readOperationState();
  const plan = state.preventives.find((item) => item.id === planId);
  if (!plan || plan.occurrenceId) return state;
  const elevator = elevatorById(plan.elevatorId);
  if (!elevator) return state;
  const occurrenceId = `OCC-PREV-${Date.now()}`;
  const time = new Date().toISOString();
  const occurrence = validateAndSanitizeOccurrence({
    id: occurrenceId, elevatorId: elevator.id, clientId: elevator.clientId,
    protocol: `HOP-P-${String(Date.now()).slice(-7)}`,
    address: elevator.address, time, description: plan.note, serviceType: 'preventive',
    preventiveId: plan.id, origin: 'preventive', status: 'agendada',
    technicianId: 'TEC-010', workflowStatus: OPERATION_STATUS.TECHNICIAN_ASSIGNED,
    trappedPeople: 0, severity: 'baixa',
  });
  return writeOperationState({ ...state, occurrences: [occurrence, ...state.occurrences], preventives: state.preventives.map((item) => item.id === planId ? { ...item, occurrenceId } : item) });
};

/**
 * Sets the operator's duty shift state (active or inactive).
 *
 * @param {boolean} operatorShiftActive
 * @returns {Object} Updated shared operation state snapshot.
 */
export const updateOperatorShift = (operatorShiftActive) => {
  const state = readOperationState();
  const active = Boolean(operatorShiftActive);
  return registerOperatorShiftEvent(active ? 'start' : 'end');
};

export const updateOperatorShiftPlan = (plan) => {
  const state = readOperationState();
  return validShiftPlan(plan) ? writeOperationState({ ...state, operatorShiftPlan: { ...plan } }) : state;
};

export const registerOperatorShiftEvent = (type) => {
  const state = readOperationState();
  const today = localDay(new Date());
  const todaysEvents = state.shiftEvents.filter((event) => event.technicianId === 'TEC-010' && localDay(event.at) === today);
  const shift = deriveShift(todaysEvents);
  if (type !== shift.nextAction) return state;
  const at = new Date().toISOString();
  const openOccurrences = type === 'end' ? state.occurrences.filter((item) => item.technicianId === 'TEC-010' && item.workflowStatus !== OPERATION_STATUS.RESOLVED).length : undefined;
  return writeOperationState({ ...state, operatorShiftActive: type === 'end' ? false : true, shiftEvents: [{ type, at, technicianId: 'TEC-010', ...(openOccurrences === undefined ? {} : { openOccurrences }), ...(type === 'start' ? { plan: state.operatorShiftPlan } : {}) }, ...state.shiftEvents] });
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

