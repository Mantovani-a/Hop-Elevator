import { getClientById, getElevatorById, getTechnicianById } from './mockData.js';
import { OPERATION_STATUS } from './operationStatus.js';

const NOTIFICATION_STORAGE_KEY = 'hop-notifications-v1';
const NOTIFICATION_UPDATED_EVENT = 'hop-notifications-updated';
const MAX_NOTIFICATIONS = 60;

let cachedRawState = null;
let cachedNotificationState = null;

const emptyState = Object.freeze({ notifications: [] });

const normalizeNotification = (notification) => ({
  id: notification.id || `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  module: notification.module,
  recipientId: notification.recipientId || null,
  title: notification.title || 'Atualização do atendimento',
  message: notification.message || '',
  actionLabel: notification.actionLabel || 'Abrir',
  href: notification.href || '#/',
  occurrenceId: notification.occurrenceId || null,
  createdAt: notification.createdAt || new Date().toISOString(),
  read: notification.read === true,
});

const normalizeState = (state) => ({
  notifications: Array.isArray(state?.notifications)
    ? state.notifications.filter((item) => item?.module).map(normalizeNotification).slice(0, MAX_NOTIFICATIONS)
    : [],
});

const cacheState = (state) => {
  cachedNotificationState = normalizeState(state);
  cachedRawState = JSON.stringify(cachedNotificationState);
  return cachedNotificationState;
};

const readNotificationState = () => {
  try {
    const stored = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored === cachedRawState && cachedNotificationState) return cachedNotificationState;
    if (!stored) return cachedNotificationState || cacheState(emptyState);
    return cacheState(JSON.parse(stored));
  } catch {
    return cachedNotificationState || cacheState(emptyState);
  }
};

const writeNotificationState = (state) => {
  const cached = cacheState(state);
  try {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, cachedRawState);
  } catch {
    // O estado em memória mantém o histórico disponível quando o armazenamento está bloqueado.
  }
  window.dispatchEvent(new CustomEvent(NOTIFICATION_UPDATED_EVENT));
  return cached;
};

const addNotifications = (notifications) => {
  if (!notifications.length) return readNotificationState();
  const state = readNotificationState();
  const createdAt = new Date().toISOString();
  const withIds = notifications.map((item, index) => normalizeNotification({
    ...item,
    id: `NTF-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt,
    read: false,
  }));
  return writeNotificationState({ notifications: [...withIds, ...state.notifications].slice(0, MAX_NOTIFICATIONS) });
};

const occurrenceContext = (occurrence) => {
  const client = getClientById(occurrence.clientId);
  const elevator = getElevatorById(occurrence.elevatorId);
  const technician = getTechnicianById(occurrence.technicianId || occurrence.assignedTechnicianId);
  return {
    protocol: occurrence.protocol || occurrence.metadata?.serviceNumber || occurrence.id,
    clientName: client?.name || 'Cliente',
    elevatorName: elevator?.identification || 'Elevador',
    technicianName: technician?.name || 'Técnico designado',
  };
};

const controlNotification = (occurrence, title, message, actionLabel = 'Ver ocorrência') => ({
  module: 'control',
  title,
  message,
  actionLabel,
  href: `#/control/occurrences?occurrence=${encodeURIComponent(occurrence.id)}`,
  occurrenceId: occurrence.id,
});

const operatorNotification = (occurrence, title, message, actionLabel = 'Abrir ocorrência') => ({
  module: 'operator',
  recipientId: occurrence.technicianId || occurrence.assignedTechnicianId,
  title,
  message,
  actionLabel,
  href: `#/operator/occurrence/${encodeURIComponent(occurrence.id)}`,
  occurrenceId: occurrence.id,
});

const clientNotification = (occurrence, title, message, actionLabel = 'Acompanhar ocorrência') => ({
  module: 'client',
  recipientId: occurrence.clientId,
  title,
  message,
  actionLabel,
  href: `#/client/call/${encodeURIComponent(occurrence.id)}`,
  occurrenceId: occurrence.id,
});

export const publishOperationNotifications = (previousState, nextState) => {
  const previousById = new Map((previousState?.occurrences || []).map((occurrence) => [occurrence.id, occurrence]));
  const notifications = [];

  (nextState?.occurrences || []).forEach((occurrence) => {
    const previous = previousById.get(occurrence.id);
    const context = occurrenceContext(occurrence);

    if (!previous) {
      const isCritical = occurrence.priority?.classification === 'crítica';
      notifications.push(controlNotification(
        occurrence,
        isCritical ? 'Nova urgência crítica' : 'Nova ocorrência registrada',
        `${context.protocol} · ${context.clientName}. ${occurrence.description}`,
      ));
      if (occurrence.technicianId || occurrence.assignedTechnicianId) {
        notifications.push(operatorNotification(
          occurrence,
          isCritical ? 'Você tem uma nova ocorrência crítica' : 'Nova ocorrência atribuída',
          `${context.clientName} · ${context.elevatorName}`,
        ));
      }
      return;
    }

    const previousTechnicianId = previous.technicianId || previous.assignedTechnicianId || null;
    const nextTechnicianId = occurrence.technicianId || occurrence.assignedTechnicianId || null;
    if (nextTechnicianId && nextTechnicianId !== previousTechnicianId && occurrence.workflowStatus !== OPERATION_STATUS.PART_AVAILABLE) {
      notifications.push(operatorNotification(
        occurrence,
        occurrence.priority?.classification === 'crítica' ? 'Você tem uma nova ocorrência crítica' : 'Nova ocorrência atribuída',
        `${context.protocol} · ${context.clientName} · ${context.elevatorName}`,
      ));
    }

    if (!previous.metadata?.requiresReassignment && occurrence.metadata?.requiresReassignment) {
      notifications.push(controlNotification(
        occurrence,
        'Técnico encerrou turno com demanda aberta',
        `${context.protocol} necessita reatribuição para continuar o atendimento.`,
        'Reatribuir',
      ));
    }

    if (previous.workflowStatus === occurrence.workflowStatus) return;

    switch (occurrence.workflowStatus) {
      case OPERATION_STATUS.TRAVELING:
        notifications.push(clientNotification(
          occurrence,
          'Um operador está a caminho',
          `${context.technicianName} foi designado para o atendimento ${context.protocol}.`,
        ));
        break;
      case OPERATION_STATUS.MAINTENANCE:
        notifications.push(clientNotification(
          occurrence,
          previous.workflowStatus === OPERATION_STATUS.RETURNING_TO_CLIENT ? 'Atendimento retomado' : 'Manutenção iniciada',
          `${context.protocol} · ${context.elevatorName}`,
        ));
        break;
      case OPERATION_STATUS.WAITING_PART:
        notifications.push(controlNotification(
          occurrence,
          'Ocorrência com necessidade de peças',
          `${context.protocol} · ${occurrence.partRequest?.part || 'Peça solicitada'} · ${context.clientName}`,
          'Ver solicitação',
        ));
        notifications.push(clientNotification(
          occurrence,
          'Atendimento aguardando peça',
          `${context.protocol} permanece acompanhado pela central até a retomada.`,
        ));
        break;
      case OPERATION_STATUS.WAITING_SUPPORT:
        notifications.push(controlNotification(
          occurrence,
          'Suporte da central solicitado',
          `${context.protocol} · ${context.clientName}`,
        ));
        break;
      case OPERATION_STATUS.PART_AVAILABLE:
        notifications.push(operatorNotification(
          occurrence,
          'Peça disponível para retirada',
          `${context.protocol} · ${occurrence.partRequest?.pickupLocation || 'Local de retirada definido pela central'}`,
        ));
        notifications.push(clientNotification(
          occurrence,
          'Atendimento retomado',
          `${context.protocol} recebeu peça e técnico para a próxima etapa.`,
        ));
        break;
      case OPERATION_STATUS.TRAVELING_TO_PICKUP:
        notifications.push(clientNotification(
          occurrence,
          'Atendimento retomado',
          `${context.technicianName} iniciou a retirada da peça para o atendimento.`,
        ));
        break;
      case OPERATION_STATUS.RESOLVED:
        notifications.push(controlNotification(
          occurrence,
          'Atendimento concluído',
          `${context.protocol} · ${context.clientName} · ${context.elevatorName}`,
        ));
        notifications.push(clientNotification(
          occurrence,
          'Atendimento concluído',
          `${context.protocol} foi finalizado pela equipe técnica.`,
        ));
        break;
      default:
        break;
    }
  });

  return addNotifications(notifications);
};

export const markNotificationRead = (notificationId) => {
  const state = readNotificationState();
  const notifications = state.notifications.map((item) => item.id === notificationId ? { ...item, read: true } : item);
  return writeNotificationState({ notifications });
};

export const markAllNotificationsRead = (module, recipientId = null) => {
  const state = readNotificationState();
  const notifications = state.notifications.map((item) => {
    const belongsToModule = item.module === module && (!item.recipientId || !recipientId || item.recipientId === recipientId);
    return belongsToModule ? { ...item, read: true } : item;
  });
  return writeNotificationState({ notifications });
};

export const resetNotifications = () => {
  try {
    window.localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
  } catch {
    // Mantém o reset em memória.
  }
  return writeNotificationState(emptyState);
};

export const subscribeNotifications = (callback) => {
  const handleCustomUpdate = () => callback();
  const handleStorageUpdate = (event) => {
    if (event.key !== NOTIFICATION_STORAGE_KEY || event.newValue === cachedRawState) return;
    cachedRawState = null;
    cachedNotificationState = null;
    callback();
  };
  window.addEventListener(NOTIFICATION_UPDATED_EVENT, handleCustomUpdate);
  window.addEventListener('storage', handleStorageUpdate);
  return () => {
    window.removeEventListener(NOTIFICATION_UPDATED_EVENT, handleCustomUpdate);
    window.removeEventListener('storage', handleStorageUpdate);
  };
};

export const getNotificationSnapshot = () => readNotificationState();
