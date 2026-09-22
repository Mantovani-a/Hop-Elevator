import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import OperatorShell from '../components/operator/OperatorShell';
import OperatorStateMessage from '../components/operator/OperatorStateMessage';
import NewOccurrenceAlert from '../components/operator/NewOccurrenceAlert';
import OperatorShiftClosed from '../components/operator/OperatorShiftClosed';
import Modal from '../components/Modal';
import {
  buildOperatorOccurrence,
  createSimulatedOccurrence,
  operatorTechnician,
} from '../data/operatorData';
import {
  addOperationOccurrence,
  OPERATION_STATUS,
  updateOperatorShift,
  updateOperationOccurrence,
} from '../data/operationStore';
import useOperationState from '../hooks/useOperationState';
import { getWorkflowStep } from '../utils/operatorWorkflow';
import OperatorDashboard from './operator/OperatorDashboard';
import OperatorHistory from './operator/OperatorHistory';
import OperatorOccurrenceDetail from './operator/OperatorOccurrenceDetail';
import OperatorOccurrences from './operator/OperatorOccurrences';
import OperatorProfile from './operator/OperatorProfile';
import OperatorServicePage from './operator/OperatorServicePage';
import { playNotificationSound } from '../utils/notificationSound';
import { formatElapsedMinutes } from '../utils/presentation';
import { navigateTo } from '../utils/navigation';

const calculateRealDuration = (assignedAt, completedAt, fallbackStart) => {
  const start = new Date(assignedAt || fallbackStart).getTime();
  const end = new Date(completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const diffMinutes = Math.max(0, Math.round((end - start) / 60000));
  return formatElapsedMinutes(diffMinutes);
};

export default function OperatorPage({ route = '/operator' }) {
  const operationState = useOperationState();
  const [simulatedOccurrence, setSimulatedOccurrence] = useState(() => createSimulatedOccurrence());
  const [simulatedAlertOpen, setSimulatedAlertOpen] = useState(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState(() => new Set());
  const [realAlertOccurrence, setRealAlertOccurrence] = useState(null);
  const lastAlertedIdRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shiftTransition, setShiftTransition] = useState('');
  const [endShiftConfirmationOpen, setEndShiftConfirmationOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route]);

  const allOccurrences = useMemo(
    () => operationState.occurrences
      .filter((occurrence) => occurrence.technicianId === operatorTechnician.id || occurrence.assignedTechnicianId === operatorTechnician.id)
      .map((occurrence) => {
        const operatorOccurrence = buildOperatorOccurrence(occurrence);
        return {
          ...operatorOccurrence,
          ...occurrence,
          priority: operatorOccurrence.priority,
          metadata: { ...operatorOccurrence.metadata, ...occurrence.metadata },
        };
      }),
    [operationState.occurrences],
  );

  const statusFor = (occurrenceId) => allOccurrences.find((occurrence) => occurrence.id === occurrenceId)?.workflowStatus
    || OPERATION_STATUS.TECHNICIAN_ASSIGNED;
  const pendingOccurrences = allOccurrences
    .filter((occurrence) => statusFor(occurrence.id) !== OPERATION_STATUS.RESOLVED)
    .sort((first, second) => (second.priority?.score ?? 0) - (first.priority?.score ?? 0));
  const activeOccurrence = pendingOccurrences.find((occurrence) => [
    OPERATION_STATUS.ACCEPTED,
    OPERATION_STATUS.TRAVELING,
    OPERATION_STATUS.TRAVELING_TO_PICKUP,
    OPERATION_STATUS.RETURNING_TO_CLIENT,
    OPERATION_STATUS.ON_SITE,
    OPERATION_STATUS.MAINTENANCE,
  ].includes(occurrence.workflowStatus));
  const unacceptedOccurrence = pendingOccurrences.find((occurrence) =>
    occurrence.workflowStatus === OPERATION_STATUS.TECHNICIAN_ASSIGNED
  );

  useEffect(() => {
    if (unacceptedOccurrence && !dismissedAlertIds.has(unacceptedOccurrence.id)) {
      if (lastAlertedIdRef.current !== unacceptedOccurrence.id) {
        lastAlertedIdRef.current = unacceptedOccurrence.id;
        playNotificationSound();
      }
      setRealAlertOccurrence(unacceptedOccurrence);
    } else {
      setRealAlertOccurrence(null);
    }
  }, [unacceptedOccurrence, dismissedAlertIds]);

  const technicianStatus = [OPERATION_STATUS.TRAVELING, OPERATION_STATUS.TRAVELING_TO_PICKUP, OPERATION_STATUS.RETURNING_TO_CLIENT].includes(activeOccurrence?.workflowStatus)
    ? 'em deslocamento'
    : activeOccurrence
      ? 'em atendimento'
      : 'disponível';

  const advanceOccurrence = (occurrenceId) => {
    const currentStatus = statusFor(occurrenceId);
    const nextStatus = getWorkflowStep(currentStatus).nextStatus;
    if (!nextStatus) return;
    if (nextStatus === OPERATION_STATUS.TRAVELING
      && activeOccurrence
      && activeOccurrence.id !== occurrenceId) return;
    if (nextStatus === OPERATION_STATUS.RESOLVED) {
      navigateTo(`/operator/service/${occurrenceId}`);
      return;
    }
    const transitionAt = new Date().toISOString();
    const transitionTimestamps = nextStatus === OPERATION_STATUS.TRAVELING
      ? { acceptedAt: transitionAt, travelingAt: transitionAt }
      : nextStatus === OPERATION_STATUS.TRAVELING_TO_PICKUP
        ? { pickupTravelStartedAt: transitionAt }
        : nextStatus === OPERATION_STATUS.RETURNING_TO_CLIENT
          ? { partPickedUpAt: transitionAt }
      : nextStatus === OPERATION_STATUS.MAINTENANCE
        ? { arrivedAt: transitionAt, maintenanceStartedAt: transitionAt, resumedAt: currentStatus === OPERATION_STATUS.RETURNING_TO_CLIENT ? transitionAt : undefined }
        : {};
    const eventLabel = nextStatus === OPERATION_STATUS.TRAVELING_TO_PICKUP ? 'Técnico iniciou deslocamento para retirada da peça'
      : nextStatus === OPERATION_STATUS.RETURNING_TO_CLIENT ? 'Peça retirada; técnico retornando ao cliente'
        : nextStatus === OPERATION_STATUS.MAINTENANCE && currentStatus === OPERATION_STATUS.RETURNING_TO_CLIENT ? 'Técnico retornou ao cliente; manutenção retomada'
          : nextStatus === OPERATION_STATUS.MAINTENANCE ? 'Técnico chegou ao cliente; manutenção iniciada'
            : 'Técnico iniciou deslocamento';
    updateOperationOccurrence(occurrenceId, (current) => ({
      workflowStatus: nextStatus,
      technicianId: operatorTechnician.id,
      ...transitionTimestamps,
      partRequest: current.partRequest ? {
        ...current.partRequest,
        state: nextStatus === OPERATION_STATUS.TRAVELING_TO_PICKUP ? 'Em retirada'
          : nextStatus === OPERATION_STATUS.RETURNING_TO_CLIENT ? 'Peça retirada'
            : nextStatus === OPERATION_STATUS.MAINTENANCE ? 'Aplicação em andamento' : current.partRequest.state,
      } : current.partRequest,
      workflowHistory: [...(current.workflowHistory || []), { status: nextStatus, label: eventLabel, at: transitionAt, technicianId: operatorTechnician.id, technicianName: operatorTechnician.name }],
    }));
    if ([OPERATION_STATUS.TRAVELING, OPERATION_STATUS.TRAVELING_TO_PICKUP, OPERATION_STATUS.RETURNING_TO_CLIENT, OPERATION_STATUS.MAINTENANCE].includes(nextStatus)) {
      navigateTo(`/operator/service/${occurrenceId}`);
    }
  };

  const completeOccurrence = (occurrenceId, details) => {
    const occurrence = allOccurrences.find((item) => item.id === occurrenceId);
    if (!occurrence) return;
    const completedAt = new Date().toISOString();
    if (details.outcome === 'part') {
      updateOperationOccurrence(occurrenceId, (current) => ({
        workflowStatus: OPERATION_STATUS.WAITING_PART,
        technicianId: null,
        assignedTechnicianId: null,
        status: 'pendente',
        partRequest: {
          part: details.part,
          quantity: Number(details.quantity) || 1,
          urgency: details.urgency,
          diagnosis: details.diagnosis,
          observation: details.observation,
          requestedAt: completedAt,
          state: 'Aguardando peça',
          diagnosedBy: { id: operatorTechnician.id, name: operatorTechnician.name },
        },
        workflowHistory: [...(current.workflowHistory || []),
          { status: OPERATION_STATUS.MAINTENANCE, label: 'Primeira visita e diagnóstico técnico', at: current.maintenanceStartedAt || completedAt, technicianId: operatorTechnician.id, technicianName: operatorTechnician.name },
          { status: OPERATION_STATUS.WAITING_PART, label: `Peça solicitada: ${details.part} ×${Number(details.quantity) || 1}; técnico liberado`, at: completedAt, technicianId: operatorTechnician.id, technicianName: operatorTechnician.name },
        ],
      }));
      navigateTo('/operator');
      return;
    }
    if (details.outcome === 'support') {
      updateOperationOccurrence(occurrenceId, (current) => ({
        workflowStatus: OPERATION_STATUS.WAITING_SUPPORT,
        technicianId: null,
        assignedTechnicianId: null,
        status: 'pendente',
        supportRequest: { reason: details.diagnosis, observation: details.observation, requestedAt: completedAt, requestedBy: { id: operatorTechnician.id, name: operatorTechnician.name }, state: 'Aguardando central' },
        workflowHistory: [...(current.workflowHistory || []), { status: OPERATION_STATUS.WAITING_SUPPORT, label: 'Suporte da central solicitado; técnico liberado', at: completedAt, technicianId: operatorTechnician.id, technicianName: operatorTechnician.name }],
      }));
      navigateTo('/operator');
      return;
    }
    const finalCondition = details.condition;
    updateOperationOccurrence(occurrenceId, (current) => ({
      workflowStatus: OPERATION_STATUS.RESOLVED,
      completedAt,
      duration: calculateRealDuration(occurrence.assignedAt, completedAt, occurrence.travelingAt || occurrence.time),
      finalDiagnosis: details.result,
      solution: details.action,
      finalCondition,
      status: 'resolvida',
      metadata: {
        ...occurrence.metadata,
        elevatorStopped: finalCondition === 'Equipamento permanece indisponível',
        partialFailure: finalCondition === 'Funcionamento parcial',
      },
      workflowHistory: [...(current.workflowHistory || []), { status: OPERATION_STATUS.RESOLVED, label: 'Atendimento concluído', at: completedAt, technicianId: operatorTechnician.id, technicianName: operatorTechnician.name }],
    }));
    navigateTo('/operator');
  };

  const openSimulation = useCallback(() => {
    setSimulatedOccurrence(createSimulatedOccurrence());
    playNotificationSound();
    setSimulatedAlertOpen(true);
  }, []);

  const addSimulatedOccurrence = (workflowStatus) => {
    addOperationOccurrence({
      ...simulatedOccurrence,
      protocol: simulatedOccurrence.metadata?.serviceNumber || simulatedOccurrence.protocol || 'HOP-DEMO',
      workflowStatus,
      technicianId: operatorTechnician.id,
      origin: 'simulação',
    });
    setSimulatedAlertOpen(false);
    navigateTo(workflowStatus === OPERATION_STATUS.TRAVELING
      ? `/operator/service/${simulatedOccurrence.id}`
      : `/operator/occurrence/${simulatedOccurrence.id}`);
  };

  const currentAlertOccurrence = realAlertOccurrence || (simulatedAlertOpen ? simulatedOccurrence : null);
  const isAlertOpen = Boolean(currentAlertOccurrence);

  const handleAcceptAlert = () => {
    if (realAlertOccurrence) {
      const occurrenceId = realAlertOccurrence.id;
      setRealAlertOccurrence(null);
      advanceOccurrence(occurrenceId);
    } else if (simulatedAlertOpen) {
      addSimulatedOccurrence(OPERATION_STATUS.TRAVELING);
      setSimulatedAlertOpen(false);
    }
  };

  const handleViewAlert = () => {
    if (realAlertOccurrence) {
      const occurrenceId = realAlertOccurrence.id;
      setDismissedAlertIds((prev) => new Set([...prev, occurrenceId]));
      setRealAlertOccurrence(null);
      navigateTo(`/operator/occurrence/${occurrenceId}`);
    } else if (simulatedAlertOpen) {
      addSimulatedOccurrence(OPERATION_STATUS.TECHNICIAN_ASSIGNED);
      setSimulatedAlertOpen(false);
    }
  };

  const handleCloseAlert = () => {
    if (realAlertOccurrence) {
      setDismissedAlertIds((prev) => new Set([...prev, realAlertOccurrence.id]));
      setRealAlertOccurrence(null);
    }
    setSimulatedAlertOpen(false);
  };

  const historyItems = allOccurrences
    .filter((occurrence) => occurrence.workflowStatus === OPERATION_STATUS.RESOLVED)
    .map((occurrence) => ({
      id: `SHARED-${occurrence.id}`,
      occurrenceId: occurrence.id,
      occurrence,
      completedAt: occurrence.completedAt || occurrence.time || new Date().toISOString(),
      duration: occurrence.duration || calculateRealDuration(occurrence.assignedAt, occurrence.completedAt, occurrence.travelingAt || occurrence.time) || '—',
    }))
    .sort((first, second) => new Date(second.completedAt || 0) - new Date(first.completedAt || 0));
  const completedToday = historyItems.filter((item) => {
    const itemDate = new Date(item.completedAt);
    return !Number.isNaN(itemDate.getTime()) && itemDate.toDateString() === new Date().toDateString();
  }).length;
  const workflowStatuses = Object.fromEntries(allOccurrences.map((occurrence) => [occurrence.id, statusFor(occurrence.id)]));
  const endShift = (force = false) => {
    if (pendingOccurrences.length && !force) {
      setEndShiftConfirmationOpen(true);
      return;
    }
    if (force) {
      pendingOccurrences.forEach((occurrence) => updateOperationOccurrence(occurrence.id, {
        metadata: { ...occurrence.metadata, assignedTechnicianUnavailable: true, requiresReassignment: true },
      }));
    }
    setEndShiftConfirmationOpen(false);
    setShiftTransition('ending');
    window.setTimeout(() => {
      updateOperatorShift(false);
      navigateTo('/operator');
      setShiftTransition('');
    }, 320);
  };
  const startShift = () => {
    setShiftTransition('starting');
    window.setTimeout(() => {
      updateOperatorShift(true);
      setShiftTransition('');
    }, 320);
  };

  let pageContent;
  if (route === '/operator') {
    pageContent = (
      <OperatorDashboard
        technician={operatorTechnician}
        technicianStatus={technicianStatus}
        occurrences={pendingOccurrences}
        activeOccurrence={activeOccurrence}
        workflowStatuses={workflowStatuses}
        onAdvance={advanceOccurrence}
        completedToday={completedToday}
        isLoading={isLoading}
        onSimulate={openSimulation}
      />
    );
  } else if (route === '/operator/occurrences') {
    pageContent = <OperatorOccurrences occurrences={pendingOccurrences} workflowStatuses={workflowStatuses} isLoading={isLoading} />;
  } else if (route === '/operator/history') {
    pageContent = <OperatorHistory historyItems={historyItems} />;
  } else if (route === '/operator/profile') {
    pageContent = <OperatorProfile technician={operatorTechnician} technicianStatus={technicianStatus} />;
  } else if (route.startsWith('/operator/service/')) {
    const occurrenceId = route.split('/').pop();
    const selectedOccurrence = allOccurrences.find((occurrence) => occurrence.id === occurrenceId);
    pageContent = <OperatorServicePage occurrence={selectedOccurrence} workflowStatus={statusFor(occurrenceId)} onAdvance={advanceOccurrence} onComplete={completeOccurrence} />;
  } else if (route.startsWith('/operator/occurrence/')) {
    const occurrenceId = route.split('/').pop();
    const selectedOccurrence = allOccurrences.find((occurrence) => occurrence.id === occurrenceId);
    pageContent = <OperatorOccurrenceDetail occurrence={selectedOccurrence} workflowStatus={statusFor(occurrenceId)} onAdvance={advanceOccurrence} />;
  } else {
    pageContent = <OperatorStateMessage type="error" title="Página do HOP Operator não encontrada">Use o menu lateral para voltar a uma seção disponível.</OperatorStateMessage>;
  }

  if (operationState.operatorShiftActive === false || shiftTransition === 'starting') {
    return <OperatorShiftClosed technician={operatorTechnician} isStarting={shiftTransition === 'starting'} onStartShift={startShift} />;
  }

  return (
    <OperatorShell
      route={route}
      technician={operatorTechnician}
      onEndShift={() => endShift()}
      onSimulate={openSimulation}
    >
      {pageContent}
      <NewOccurrenceAlert
        occurrence={currentAlertOccurrence}
        open={isAlertOpen}
        onClose={handleCloseAlert}
        onAccept={handleAcceptAlert}
        onView={handleViewAlert}
      />
      {shiftTransition === 'ending' && <div className="operator-shift-transition" role="status">Encerrando turno…</div>}
      <Modal
        isOpen={endShiftConfirmationOpen}
        onClose={() => setEndShiftConfirmationOpen(false)}
        title="Você ainda possui demandas abertas"
        titleId="end-shift-title"
        className="operator-end-shift-modal"
        layerClassName="operator-end-shift-layer"
      >
        <p>Existem atendimentos vinculados ao seu turno que ainda não foram concluídos. Ao encerrar o turno, essas demandas continuarão registradas e poderão exigir acompanhamento da operação.</p>
        <div className="d-flex flex-column flex-sm-row-reverse gap-2 mt-4">
          <button className="btn btn-danger flex-fill" type="button" onClick={() => endShift(true)}>Encerrar turno mesmo assim</button>
          <button className="btn btn-outline-secondary flex-fill" type="button" onClick={() => setEndShiftConfirmationOpen(false)}>Voltar ao trabalho</button>
        </div>
      </Modal>
    </OperatorShell>
  );
}
