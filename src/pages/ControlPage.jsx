import { useEffect, useMemo, useState } from 'react';
import ControlOccurrenceDetail from '../components/control/ControlOccurrenceDetail';
import ControlReassignmentModal from '../components/control/ControlReassignmentModal';
import ControlShell from '../components/control/ControlShell';
import ControlTechnicianDetail from '../components/control/ControlTechnicianDetail';
import ControlPartResumeModal from '../components/control/ControlPartResumeModal';
import ControlPartRequestModal from '../components/control/ControlPartRequestModal';
import ControlTechnicalReport from '../components/control/ControlTechnicalReport';
import { getTechnicianById } from '../data/mockData';
import {
  buildControlOccurrences,
  buildControlTechnicians,
  buildElevatorOverview,
  controlUser,
} from '../data/controlData';
import { OPERATION_STATUS, updateOperationOccurrence } from '../data/operationStore';
import useOperationState from '../hooks/useOperationState';
import ControlAnalytics from './control/ControlAnalytics';
import ControlElevators from './control/ControlElevators';
import ControlOccurrences from './control/ControlOccurrences';
import ControlOverview from './control/ControlOverview';
import ControlTechnicians from './control/ControlTechnicians';
import ControlPreventives from './control/ControlPreventives';
import { recommendTechnician, suggestOccurrenceTeam } from '../utils/dispatchRecommendation';
import { activeTeamMembers, assignTeamMember, normalizeOccurrenceTeam, removeTeamMember, TEAM_MODE } from '../utils/occurrenceTeam.js';
import { parseRoute } from '../utils/navigation';

export default function ControlPage({ route = '/control' }) {
  const { baseRoute, queryParams } = useMemo(() => parseRoute(route), [route]);
  const operationState = useOperationState();
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(null);
  const [reassignmentId, setReassignmentId] = useState(null);
  const [partResumeId, setPartResumeId] = useState(null);
  const [selectedPartRequestId, setSelectedPartRequestId] = useState(null);
  const [reportOccurrenceId, setReportOccurrenceId] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route]);

  useEffect(() => {
    const occurrenceId = queryParams.get('occurrence');
    if (occurrenceId) setSelectedOccurrenceId(occurrenceId);
  }, [queryParams]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setReassignmentId(null);
        setSelectedOccurrenceId(null);
        setSelectedTechnicianId(null);
        setPartResumeId(null);
        setSelectedPartRequestId(null);
        setReportOccurrenceId(null);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const controlOccurrences = useMemo(() => buildControlOccurrences(operationState), [operationState]);
  const controlTechnicians = useMemo(
    () => buildControlTechnicians(controlOccurrences, operationState.operatorShiftActive),
    [controlOccurrences, operationState.operatorShiftActive],
  );
  const elevatorOverview = useMemo(() => buildElevatorOverview(controlOccurrences), [controlOccurrences]);
  const selectedOccurrence = controlOccurrences.find((item) => item.id === selectedOccurrenceId);
  const selectedTechnician = controlTechnicians.find((item) => item.id === selectedTechnicianId);
  const reassignmentOccurrence = controlOccurrences.find((item) => item.id === reassignmentId);
  const partResumeOccurrence = controlOccurrences.find((item) => item.id === partResumeId);
  const selectedPartRequest = controlOccurrences.find((item) => item.id === selectedPartRequestId);
  const reportOccurrence = controlOccurrences.find((item) => item.id === reportOccurrenceId);
  const historyElevatorId = queryParams.get('history');
  const availableTechnicians = controlTechnicians.filter((item) => item.status === 'disponível' && item.id !== reassignmentOccurrence?.technicianId);
  const recommendedTechnician = selectedOccurrence && !selectedOccurrence.technicianId && selectedOccurrence.operationalStatus !== OPERATION_STATUS.WAITING_PART
    ? recommendTechnician(selectedOccurrence, controlTechnicians, controlOccurrences)
    : null;
  const selectedTeam = selectedOccurrence && normalizeOccurrenceTeam(selectedOccurrence);
  const teamCandidates = selectedOccurrence ? controlTechnicians.filter((item) => item.status === 'disponível' && !selectedTeam.members.some((member) => member.technicianId === item.id)) : [];
  const suggestedTeam = selectedOccurrence && selectedTeam.mode !== TEAM_MODE.INDIVIDUAL
    ? suggestOccurrenceTeam(selectedOccurrence, controlTechnicians, controlOccurrences) : [];

  const updateTeam = (action, technicianId, mode) => {
    if (!selectedOccurrence) return;
    const at = new Date().toISOString();
    updateOperationOccurrence(selectedOccurrence.id, (current) => {
      const technician = getTechnicianById(technicianId);
      const team = normalizeOccurrenceTeam(current);
      let patch;
      let label;
      if (action === 'mode') {
        patch = { team: { ...team, mode, requiredCount: mode === TEAM_MODE.INDIVIDUAL ? 1 : Math.max(2, team.requiredCount) } };
        label = `Tipo de atendimento definido: ${mode === TEAM_MODE.INDIVIDUAL ? 'Individual' : mode === TEAM_MODE.RECOMMENDED ? 'Equipe recomendada' : 'Equipe obrigatória'}`;
      } else if (action === 'remove') {
        patch = removeTeamMember(current, technicianId);
        if (!patch) return null;
        label = `${technician?.name || technicianId} removido da equipe pela central`;
      } else {
        patch = assignTeamMember(current, technicianId, action === 'leader' ? 'responsible' : 'support', at);
        label = action === 'leader' ? `Liderança transferida para ${technician?.name || technicianId}` : `${technician?.name || technicianId} adicionado como apoio pela central`;
      }
      return { ...patch, ...(action === 'leader' ? { metadata: { ...current.metadata, automaticAssignment: null, manualAssignment: { technicianId, assignedAt: at } } } : {}), workflowStatus: !current.technicianId && patch.technicianId ? OPERATION_STATUS.TECHNICIAN_ASSIGNED : current.workflowStatus, status: !current.technicianId && patch.technicianId ? 'em atendimento' : current.status, workflowHistory: [...(current.workflowHistory || []), { at, status: current.workflowStatus, label, technicianId: technicianId || null, technicianName: technician?.name || null, author: 'Central de Operações' }] };
    });
  };
  const applySuggestedTeam = () => {
    if (!selectedOccurrence || !suggestedTeam.length) return;
    const at = new Date().toISOString();
    updateOperationOccurrence(selectedOccurrence.id, (current) => {
      let patch = {};
      let updated = current;
      const events = [];
      suggestedTeam.forEach(({ technician }) => {
        patch = assignTeamMember(updated, technician.id, updated.technicianId ? 'support' : 'responsible', at);
        updated = { ...updated, ...patch };
        events.push({ at, status: current.workflowStatus, label: `${technician.name} adicionado à equipe sugerida`, technicianId: technician.id, technicianName: technician.name, author: 'Central de Operações' });
      });
      return { ...patch, workflowStatus: current.technicianId ? current.workflowStatus : OPERATION_STATUS.TECHNICIAN_ASSIGNED, workflowHistory: [...(current.workflowHistory || []), ...events] };
    });
  };

  const assignRecommendedTechnician = () => {
    if (!selectedOccurrence || !recommendedTechnician) return;
    const assignedAt = new Date().toISOString();
    updateOperationOccurrence(selectedOccurrence.id, {
      ...assignTeamMember(selectedOccurrence, recommendedTechnician.id, 'responsible', assignedAt),
      technicianId: recommendedTechnician.id,
      assignedTechnicianId: recommendedTechnician.id,
      assignedAt,
      workflowStatus: OPERATION_STATUS.TECHNICIAN_ASSIGNED,
      status: 'em atendimento',
      workflowHistory: [
        ...(selectedOccurrence.workflowHistory || []),
        {
          status: OPERATION_STATUS.TECHNICIAN_ASSIGNED,
          label: `${recommendedTechnician.name} atribuído pela central`,
          at: assignedAt,
          technicianId: recommendedTechnician.id,
          technicianName: recommendedTechnician.name,
        },
      ],
    });
  };
  const confirmReassignment = (technicianId) => {
    const occurrence = reassignmentOccurrence;
    if (!occurrence) return;
    const technician = getTechnicianById(technicianId);
    const reassignedAt = new Date().toISOString();
    updateOperationOccurrence(occurrence.id, {
      ...assignTeamMember({ ...occurrence, technicianId, assignedTechnicianId: technicianId, team: normalizeOccurrenceTeam(occurrence).mode === TEAM_MODE.INDIVIDUAL ? { ...normalizeOccurrenceTeam(occurrence), responsibleId: technicianId, members: [], pastMembers: [...normalizeOccurrenceTeam(occurrence).pastMembers, ...normalizeOccurrenceTeam(occurrence).members] } : { ...normalizeOccurrenceTeam(occurrence), responsibleId: technicianId } }, technicianId, 'responsible', reassignedAt),
      technicianId,
      assignedTechnicianId: technicianId,
      assignedAt: reassignedAt,
      workflowStatus: OPERATION_STATUS.TECHNICIAN_ASSIGNED,
      status: 'em atendimento',
      metadata: {
        ...occurrence.metadata,
        assignedTechnicianUnavailable: false,
        requiresReassignment: false,
        distanceKm: technician?.distanceKm ?? occurrence.metadata?.distanceKm,
        etaMinutes: technician?.distanceKm != null ? Math.max(5, Math.round(technician.distanceKm * 3)) : occurrence.metadata?.etaMinutes,
        automaticAssignment: null,
        manualAssignment: { technicianId, assignedAt: reassignedAt },
      },
      workflowHistory: [
        ...(occurrence.workflowHistory || []),
        {
          status: OPERATION_STATUS.TECHNICIAN_ASSIGNED,
          label: `${technician?.name || technicianId} atribuído manualmente pela central`,
          at: reassignedAt,
          technicianId,
          technicianName: technician?.name,
        },
      ],
    });
    setReassignmentId(null);
  };

  const resumePartOccurrence = ({ pickupLocation, technicianId }) => {
    const occurrence = partResumeOccurrence;
    if (!occurrence) return;
    const technician = getTechnicianById(technicianId);
    const resumedAt = new Date().toISOString();
    updateOperationOccurrence(occurrence.id, (current) => ({
      ...assignTeamMember(current, technicianId, 'responsible', resumedAt),
      technicianId,
      assignedTechnicianId: technicianId,
      assignedAt: resumedAt,
      workflowStatus: OPERATION_STATUS.PART_AVAILABLE,
      status: 'pendente',
      partRequest: { ...current.partRequest, pickupLocation, state: 'Peça disponível', availableAt: resumedAt, resumedBy: technician ? { id: technician.id, name: technician.name } : { id: technicianId, name: technicianId } },
      workflowHistory: [...(current.workflowHistory || []), { status: OPERATION_STATUS.PART_AVAILABLE, label: `Peça disponibilizada pela central externa; retomada atribuída a ${technician?.name || technicianId}`, at: resumedAt, technicianId, technicianName: technician?.name }],
    }));
    setPartResumeId(null);
  };

  let pageContent;
  if (baseRoute === '/control') {
    pageContent = (
      <ControlOverview
        occurrences={controlOccurrences}
        technicians={controlTechnicians}
        onSelectOccurrence={setSelectedOccurrenceId}
        onSelectTechnician={setSelectedTechnicianId}
        onReassignOccurrence={setReassignmentId}
      />
    );
  } else if (baseRoute === '/control/occurrences') {
    pageContent = (
      <ControlOccurrences
        occurrences={controlOccurrences}
        onSelectOccurrence={setSelectedOccurrenceId}
        onViewReport={setReportOccurrenceId}
      />
    );
  } else if (baseRoute === '/control/technicians') {
    pageContent = (
      <ControlTechnicians
        technicians={controlTechnicians}
        onSelectTechnician={setSelectedTechnicianId}
      />
    );
  } else if (baseRoute === '/control/elevators') {
    pageContent = (
      <ControlElevators
        elevators={elevatorOverview}
        historyElevatorId={historyElevatorId}
      />
    );
  } else if (baseRoute === '/control/analytics') {
    pageContent = <ControlAnalytics occurrences={controlOccurrences} />;
  } else if (baseRoute === '/control/preventives') {
    pageContent = <ControlPreventives plans={operationState.preventives || []} occurrences={operationState.occurrences} />;
  } else {
    pageContent = (
      <div className="control-empty-note" role="alert">
        <strong>Página do HOP Control não encontrada.</strong>
        <span>Use o menu lateral para voltar à Central de Operações.</span>
      </div>
    );
  }

  return (
    <ControlShell route={baseRoute} user={controlUser}>
      {pageContent}
      <ControlOccurrenceDetail
        occurrence={selectedOccurrence}
        recommendedTechnician={recommendedTechnician}
        onAssignRecommended={assignRecommendedTechnician}
        teamCandidates={teamCandidates}
        suggestedTeam={suggestedTeam}
        onTeamAction={updateTeam}
        onApplySuggestedTeam={applySuggestedTeam}
        onClose={() => setSelectedOccurrenceId(null)}
        onReassign={(occurrence) => setReassignmentId(occurrence.id)}
        onResumePart={(occurrence) => setPartResumeId(occurrence.id)}
        onOpenPartRequest={(occurrence) => { setSelectedOccurrenceId(null); setSelectedPartRequestId(occurrence.id); }}
      />
      <ControlPartRequestModal occurrence={selectedPartRequest} onClose={() => setSelectedPartRequestId(null)} onResumePart={(occurrence) => { setSelectedPartRequestId(null); setPartResumeId(occurrence.id); }} />
      <ControlTechnicalReport
        occurrence={reportOccurrence}
        onClose={() => setReportOccurrenceId(null)}
      />
      <ControlTechnicianDetail
        technician={selectedTechnician}
        occurrences={controlOccurrences}
        shiftActive={operationState.operatorShiftActive}
        shiftEvents={operationState.shiftEvents}
        shiftPlan={operationState.operatorShiftPlan}
        onSelectOccurrence={(id) => { setSelectedTechnicianId(null); setSelectedOccurrenceId(id); }}
        onClose={() => setSelectedTechnicianId(null)}
      />
      <ControlReassignmentModal
        occurrence={reassignmentOccurrence}
        technicians={availableTechnicians}
        onCancel={() => setReassignmentId(null)}
        onConfirm={confirmReassignment}
      />
      <ControlPartResumeModal
        occurrence={partResumeOccurrence}
        technicians={controlTechnicians.filter((technician) => technician.status === 'disponível' || activeTeamMembers(partResumeOccurrence).some((member) => member.technicianId === technician.id))}
        onCancel={() => setPartResumeId(null)}
        onConfirm={resumePartOccurrence}
      />
    </ControlShell>
  );
}
