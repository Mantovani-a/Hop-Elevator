import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import OperatorShell from '../components/operator/OperatorShell';
import OperatorStateMessage from '../components/operator/OperatorStateMessage';
import NewOccurrenceAlert from '../components/operator/NewOccurrenceAlert';
import OperatorShiftClosed from '../components/operator/OperatorShiftClosed';
import OperatorShiftPanel from '../components/operator/OperatorShiftPanel';
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
  registerOperatorShiftEvent,
  updateOperatorShiftPlan,
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
import { navigateTo } from '../utils/navigation';
import { deriveShift, localDay } from '../utils/shiftSchedule.js';
import { canRequestOccurrencePart, canResolveOccurrence, isTeamMember, normalizeOccurrenceTeam, setTeamMemberStatus, teamMember, TEAM_STATUS } from '../utils/occurrenceTeam.js';

const calculateRealDuration = (assignedAt, completedAt, fallbackStart) => {
  const start = new Date(assignedAt || fallbackStart).getTime();
  const end = new Date(completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const diffMinutes = Math.max(0, Math.round((end - start) / 60000));
  return diffMinutes >= 60 ? `${Math.floor(diffMinutes / 60)}h ${String(diffMinutes % 60).padStart(2, '0')}min` : `${diffMinutes} min`;
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
  const [shiftPanelOpen, setShiftPanelOpen] = useState(false);
  const [shiftNow, setShiftNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setShiftNow(new Date()), 60000); return () => window.clearInterval(timer); }, []);
  const todayEvents = (operationState.shiftEvents || []).filter((event) => event.technicianId === operatorTechnician.id && localDay(event.at) === localDay(shiftNow));
  const currentShift = deriveShift(todayEvents, shiftNow);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route]);

  const allOccurrences = useMemo(
    () => operationState.occurrences
      .filter((occurrence) => isTeamMember(occurrence, operatorTechnician.id))
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
    .filter((occurrence) => statusFor(occurrence.id) !== OPERATION_STATUS.RESOLVED && teamMember(occurrence, operatorTechnician.id)?.status !== TEAM_STATUS.FINISHED)
    .sort((first, second) => (second.priority?.score ?? 0) - (first.priority?.score ?? 0));
  const activeOccurrence = pendingOccurrences.find((occurrence) => [TEAM_STATUS.TRAVELING, TEAM_STATUS.ON_SITE].includes(teamMember(occurrence, operatorTechnician.id)?.status) || [
    OPERATION_STATUS.ACCEPTED,
    OPERATION_STATUS.TRAVELING,
    OPERATION_STATUS.TRAVELING_TO_PICKUP,
    OPERATION_STATUS.RETURNING_TO_CLIENT,
    OPERATION_STATUS.ON_SITE,
    OPERATION_STATUS.MAINTENANCE,
  ].includes(occurrence.workflowStatus));
  const unacceptedOccurrence = pendingOccurrences.find((occurrence) =>
    occurrence.workflowStatus === OPERATION_STATUS.TECHNICIAN_ASSIGNED && teamMember(occurrence, operatorTechnician.id)?.status === TEAM_STATUS.ASSIGNED
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

  const technicianStatus = teamMember(activeOccurrence, operatorTechnician.id)?.status === TEAM_STATUS.TRAVELING
    ? 'em deslocamento'
    : activeOccurrence
      ? 'em atendimento'
      : 'disponível';

  const updateMemberParticipation = (occurrenceId, status, note = '') => {
    const at = new Date().toISOString();
    updateOperationOccurrence(occurrenceId, (current) => {
      if (!isTeamMember(current, operatorTechnician.id) || teamMember(current, operatorTechnician.id)?.status === TEAM_STATUS.FINISHED || current.workflowStatus === OPERATION_STATUS.RESOLVED) return null;
      const patch = status ? setTeamMemberStatus(current, operatorTechnician.id, status, at) : {};
      const label = note ? `Observação/diagnóstico: ${note}` : status === TEAM_STATUS.TRAVELING ? 'Iniciou deslocamento para apoiar a equipe' : status === TEAM_STATUS.ON_SITE ? 'Chegou ao local para apoiar a equipe' : 'Concluiu sua participação na equipe';
      return { ...patch, teamNotes: note ? [...(current.teamNotes || []), { text: note, at, technicianId: operatorTechnician.id, technicianName: operatorTechnician.name }] : current.teamNotes, workflowHistory: [...(current.workflowHistory || []), { at, status: current.workflowStatus, label, technicianId: operatorTechnician.id, technicianName: operatorTechnician.name }] };
    });
    if (status === TEAM_STATUS.FINISHED) navigateTo('/operator');
  };

  const advanceOccurrence = (occurrenceId) => {
    const assignedOccurrence = allOccurrences.find((item) => item.id === occurrenceId);
    if (!assignedOccurrence || !isTeamMember(assignedOccurrence, operatorTechnician.id)) return;
    if (normalizeOccurrenceTeam(assignedOccurrence).responsibleId !== operatorTechnician.id) {
      const member = teamMember(assignedOccurrence, operatorTechnician.id);
      const status = member?.status === TEAM_STATUS.ASSIGNED ? TEAM_STATUS.TRAVELING : member?.status === TEAM_STATUS.TRAVELING ? TEAM_STATUS.ON_SITE : null;
      if (status) updateMemberParticipation(occurrenceId, status);
      return;
    }
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
    updateOperationOccurrence(occurrenceId, (current) => normalizeOccurrenceTeam(current).responsibleId === operatorTechnician.id && current.workflowStatus === currentStatus ? ({
      ...(nextStatus === OPERATION_STATUS.TRAVELING || nextStatus === OPERATION_STATUS.MAINTENANCE ? setTeamMemberStatus(current, operatorTechnician.id, nextStatus === OPERATION_STATUS.TRAVELING ? TEAM_STATUS.TRAVELING : TEAM_STATUS.ON_SITE, transitionAt) : {}),
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
    }) : null);
    if ([OPERATION_STATUS.TRAVELING, OPERATION_STATUS.TRAVELING_TO_PICKUP, OPERATION_STATUS.RETURNING_TO_CLIENT, OPERATION_STATUS.MAINTENANCE].includes(nextStatus)) {
      navigateTo(`/operator/service/${occurrenceId}`);
    }
  };

  const completeOccurrence = (occurrenceId, details) => {
    const occurrence = allOccurrences.find((item) => item.id === occurrenceId);
    if (!occurrence) return;
    const completedAt = new Date().toISOString();
    if (!isTeamMember(occurrence, operatorTechnician.id)) return;
    if (details.outcome === 'resolved' && !canResolveOccurrence(occurrence, operatorTechnician.id)) return;
    if (details.outcome === 'part' && !canRequestOccurrencePart(occurrence)) return;
    if (normalizeOccurrenceTeam(occurrence).responsibleId !== operatorTechnician.id) {
      if (details.outcome === 'resolved') return;
      updateOperationOccurrence(occurrenceId, (current) => {
        if (!isTeamMember(current, operatorTechnician.id) || current.workflowStatus === OPERATION_STATUS.RESOLVED) return null;
        if (details.outcome === 'part' && !canRequestOccurrencePart(current)) return null;
        const request = details.outcome === 'part' ? { componentId: details.componentId || null, partId: details.partId || null, part: details.part, quantity: Number(details.quantity) || 1, urgency: details.urgency, diagnosis: details.diagnosis, observation: details.observation, requestedAt: completedAt, state: 'Aguardando peça', diagnosedBy: { id: operatorTechnician.id, name: operatorTechnician.name }, teamMemberIds: normalizeOccurrenceTeam(current).members.map((member) => member.technicianId) } : null;
        const nextStatus = request ? OPERATION_STATUS.WAITING_PART : OPERATION_STATUS.WAITING_SUPPORT;
        return { ...(request ? { partRequest: request } : { supportRequest: { reason: details.diagnosis, observation: details.observation, requestedAt: completedAt, requestedBy: { id: operatorTechnician.id, name: operatorTechnician.name }, state: 'Aguardando central' } }), workflowStatus: nextStatus, status: 'pendente', workflowHistory: [...(current.workflowHistory || []), { status: nextStatus, label: details.outcome === 'part' ? `Peça solicitada pela equipe: ${details.part} ×${Number(details.quantity) || 1}` : 'Suporte solicitado pelo técnico de apoio', at: completedAt, technicianId: operatorTechnician.id, technicianName: operatorTechnician.name }] };
      });
      navigateTo('/operator');
      return;
    }
    if (details.outcome === 'part') {
      updateOperationOccurrence(occurrenceId, (current) => normalizeOccurrenceTeam(current).responsibleId === operatorTechnician.id && current.workflowStatus !== OPERATION_STATUS.RESOLVED && canRequestOccurrencePart(current) ? ({
        workflowStatus: OPERATION_STATUS.WAITING_PART,
        componentId: details.componentId || current.componentId || null,
        technicianId: normalizeOccurrenceTeam(current).members.length > 1 ? current.technicianId : null,
        assignedTechnicianId: normalizeOccurrenceTeam(current).members.length > 1 ? current.assignedTechnicianId : null,
        team: normalizeOccurrenceTeam(current).members.length > 1 ? current.team : { ...normalizeOccurrenceTeam(current), responsibleId: null, members: [], pastMembers: [...normalizeOccurrenceTeam(current).pastMembers, ...normalizeOccurrenceTeam(current).members] },
        status: 'pendente',
        partRequest: {
          componentId: details.componentId || null,
          partId: details.partId || null,
          part: details.part,
          quantity: Number(details.quantity) || 1,
          urgency: details.urgency,
          diagnosis: details.diagnosis,
          observation: details.observation,
          requestedAt: completedAt,
          state: 'Aguardando peça',
          diagnosedBy: { id: operatorTechnician.id, name: operatorTechnician.name },
          teamMemberIds: normalizeOccurrenceTeam(current).members.map((member) => member.technicianId),
        },
        workflowHistory: [...(current.workflowHistory || []),
          { status: OPERATION_STATUS.MAINTENANCE, label: 'Primeira visita e diagnóstico técnico', at: current.maintenanceStartedAt || completedAt, technicianId: operatorTechnician.id, technicianName: operatorTechnician.name },
          { status: OPERATION_STATUS.WAITING_PART, label: `Peça solicitada: ${details.part} ×${Number(details.quantity) || 1}; técnico liberado`, at: completedAt, technicianId: operatorTechnician.id, technicianName: operatorTechnician.name },
        ],
      }) : null);
      navigateTo('/operator');
      return;
    }
    if (details.outcome === 'support') {
      updateOperationOccurrence(occurrenceId, (current) => normalizeOccurrenceTeam(current).responsibleId === operatorTechnician.id && current.workflowStatus !== OPERATION_STATUS.RESOLVED ? ({
        workflowStatus: OPERATION_STATUS.WAITING_SUPPORT,
        technicianId: normalizeOccurrenceTeam(current).members.length > 1 ? current.technicianId : null,
        assignedTechnicianId: normalizeOccurrenceTeam(current).members.length > 1 ? current.assignedTechnicianId : null,
        team: normalizeOccurrenceTeam(current).members.length > 1 ? current.team : { ...normalizeOccurrenceTeam(current), responsibleId: null, members: [], pastMembers: [...normalizeOccurrenceTeam(current).pastMembers, ...normalizeOccurrenceTeam(current).members] },
        status: 'pendente',
        supportRequest: { reason: details.diagnosis, observation: details.observation, requestedAt: completedAt, requestedBy: { id: operatorTechnician.id, name: operatorTechnician.name }, state: 'Aguardando central' },
        workflowHistory: [...(current.workflowHistory || []), { status: OPERATION_STATUS.WAITING_SUPPORT, label: 'Suporte da central solicitado; técnico liberado', at: completedAt, technicianId: operatorTechnician.id, technicianName: operatorTechnician.name }],
      }) : null);
      navigateTo('/operator');
      return;
    }
    const finalCondition = details.condition;
    updateOperationOccurrence(occurrenceId, (current) => canResolveOccurrence(current, operatorTechnician.id) && current.workflowStatus !== OPERATION_STATUS.RESOLVED ? ({
      workflowStatus: OPERATION_STATUS.RESOLVED,
      componentId: details.componentId || current.componentId || null,
      completedAt,
      duration: calculateRealDuration(occurrence.assignedAt, completedAt, occurrence.travelingAt || occurrence.time),
      finalDiagnosis: details.result,
      solution: details.action,
      finalCondition,
      status: 'resolvida',
      partRequest: current.partRequest ? { ...current.partRequest, state: 'Aplicada' } : current.partRequest,
      metadata: {
        ...occurrence.metadata,
        elevatorStopped: finalCondition === 'Equipamento permanece indisponível',
        partialFailure: finalCondition === 'Funcionamento parcial',
      },
      team: { ...normalizeOccurrenceTeam(current), members: normalizeOccurrenceTeam(current).members.map((member) => ({ ...member, status: TEAM_STATUS.FINISHED, completedAt })) },
      workflowHistory: [...(current.workflowHistory || []), { status: OPERATION_STATUS.RESOLVED, label: 'Atendimento concluído pelo responsável', at: completedAt, technicianId: operatorTechnician.id, technicianName: operatorTechnician.name }],
    }) : null);
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
    .filter((occurrence) => occurrence.workflowStatus === OPERATION_STATUS.RESOLVED || teamMember(occurrence, operatorTechnician.id)?.status === TEAM_STATUS.FINISHED)
    .map((occurrence) => ({
      id: `SHARED-${occurrence.id}`,
      occurrenceId: occurrence.id,
      occurrence,
      completedAt: teamMember(occurrence, operatorTechnician.id)?.completedAt || occurrence.completedAt || occurrence.time || new Date().toISOString(),
      duration: occurrence.duration || calculateRealDuration(occurrence.assignedAt, occurrence.completedAt, occurrence.travelingAt || occurrence.time) || '—',
    }))
    .sort((first, second) => new Date(second.completedAt || 0) - new Date(first.completedAt || 0));
  const completedToday = historyItems.filter((item) => {
    const completedAt = new Date(item.completedAt);
    return !Number.isNaN(completedAt.getTime()) && completedAt.toDateString() === new Date().toDateString();
  }).length;
  const workflowStatuses = Object.fromEntries(allOccurrences.map((occurrence) => [occurrence.id, statusFor(occurrence.id)]));
  const endShift = (force = false) => {
    if (pendingOccurrences.length && !force) {
      setEndShiftConfirmationOpen(true);
      return;
    }
    if (force) {
      pendingOccurrences.forEach((occurrence) => {
        if (normalizeOccurrenceTeam(occurrence).responsibleId === operatorTechnician.id) {
          updateOperationOccurrence(occurrence.id, { metadata: { ...occurrence.metadata, assignedTechnicianUnavailable: true, requiresReassignment: true } });
        } else {
          updateMemberParticipation(occurrence.id, TEAM_STATUS.FINISHED);
        }
      });
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
    registerOperatorShiftEvent('start');
    navigateTo('/operator');
    window.setTimeout(() => setShiftTransition(''), 560);
  };
  const handleShiftAction = (type) => {
    if (type === 'start') { startShift(); return; }
    if (type === 'end') { endShift(); return; }
    registerOperatorShiftEvent(type);
  };

  let pageContent;
  if (route === '/operator') {
    pageContent = <OperatorDashboard technician={operatorTechnician} occurrences={pendingOccurrences} activeOccurrence={activeOccurrence} workflowStatuses={workflowStatuses} onAdvance={advanceOccurrence} completedToday={completedToday} isLoading={isLoading} onSimulate={openSimulation} />;
  } else if (route === '/operator/occurrences') {
    pageContent = <OperatorOccurrences occurrences={pendingOccurrences} workflowStatuses={workflowStatuses} isLoading={isLoading} />;
  } else if (route === '/operator/history') {
    pageContent = <OperatorHistory historyItems={historyItems} />;
  } else if (route === '/operator/profile') {
    pageContent = <OperatorProfile technician={operatorTechnician} technicianStatus={technicianStatus} />;
  } else if (route.startsWith('/operator/service/')) {
    const occurrenceId = route.split('/').pop();
    const selectedOccurrence = allOccurrences.find((occurrence) => occurrence.id === occurrenceId);
    pageContent = <OperatorServicePage occurrence={selectedOccurrence} workflowStatus={statusFor(occurrenceId)} onAdvance={advanceOccurrence} onComplete={completeOccurrence} onMemberAction={updateMemberParticipation} />;
  } else if (route.startsWith('/operator/occurrence/')) {
    const occurrenceId = route.split('/').pop();
    const selectedOccurrence = allOccurrences.find((occurrence) => occurrence.id === occurrenceId);
    pageContent = <OperatorOccurrenceDetail occurrence={selectedOccurrence} workflowStatus={statusFor(occurrenceId)} onAdvance={advanceOccurrence} onMemberAction={updateMemberParticipation} />;
  } else {
    pageContent = <OperatorStateMessage type="error" title="Página do HOP Operator não encontrada">Use o menu lateral para voltar a uma seção disponível.</OperatorStateMessage>;
  }

  if (currentShift.status === 'off' || currentShift.status === 'ended' || shiftTransition === 'starting') {
    return <OperatorShiftClosed technician={operatorTechnician} isStarting={shiftTransition === 'starting'} shiftEvents={todayEvents} shiftPlan={operationState.operatorShiftPlan} onShiftAction={handleShiftAction} onSaveShiftPlan={updateOperatorShiftPlan} />;
  }

  return (
    <OperatorShell
      route={route}
      technician={operatorTechnician}
      onOpenShift={() => setShiftPanelOpen(true)}
      shiftStatus={currentShift.status}
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
      <Modal isOpen={shiftPanelOpen} onClose={() => setShiftPanelOpen(false)} title="Meu turno" titleId="operator-shift-title" className="operator-shift-modal" layerClassName="operator-end-shift-layer" showHeader={false}>
        <button type="button" className="operator-shift-modal__close" aria-label="Fechar meu turno" onClick={() => setShiftPanelOpen(false)}>×</button>
        <OperatorShiftPanel events={todayEvents} plan={operationState.operatorShiftPlan} onAction={handleShiftAction} onSavePlan={updateOperatorShiftPlan} busy={Boolean(shiftTransition)} />
      </Modal>
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
