import { useEffect, useMemo, useState } from 'react';
import ControlOccurrenceDetail from '../components/control/ControlOccurrenceDetail';
import ControlReassignmentModal from '../components/control/ControlReassignmentModal';
import ControlShell from '../components/control/ControlShell';
import ControlTechnicianDetail from '../components/control/ControlTechnicianDetail';
import ControlPartResumeModal from '../components/control/ControlPartResumeModal';
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
import { recommendTechnician } from '../utils/dispatchRecommendation';
import { parseRoute } from '../utils/navigation';

export default function ControlPage({ route = '/control' }) {
  const { baseRoute, queryParams } = useMemo(() => parseRoute(route), [route]);
  const operationState = useOperationState();
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(null);
  const [reassignmentId, setReassignmentId] = useState(null);
  const [partResumeId, setPartResumeId] = useState(null);
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
  const reportOccurrence = controlOccurrences.find((item) => item.id === reportOccurrenceId);
  const historyElevatorId = queryParams.get('history');
  const availableTechnicians = controlTechnicians.filter((item) => item.status === 'disponível' && item.id !== reassignmentOccurrence?.technicianId);
  const recommendedTechnician = selectedOccurrence && !selectedOccurrence.technicianId
    ? recommendTechnician(selectedOccurrence, controlTechnicians, controlOccurrences)
    : null;

  const assignRecommendedTechnician = () => {
    if (!selectedOccurrence || !recommendedTechnician) return;
    const assignedAt = new Date().toISOString();
    updateOperationOccurrence(selectedOccurrence.id, {
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
      technicianId,
      assignedTechnicianId: technicianId,
      assignedAt: resumedAt,
      workflowStatus: OPERATION_STATUS.PART_AVAILABLE,
      status: 'pendente',
      partRequest: { ...current.partRequest, pickupLocation, state: 'Peça disponível', availableAt: resumedAt, resumedBy: technician ? { id: technician.id, name: technician.name } : { id: technicianId, name: technicianId } },
      workflowHistory: [...(current.workflowHistory || []), { status: OPERATION_STATUS.PART_AVAILABLE, label: `Peça disponibilizada; retomada atribuída a ${technician?.name || technicianId}`, at: resumedAt, technicianId, technicianName: technician?.name }],
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
        onClose={() => setSelectedOccurrenceId(null)}
        onReassign={(occurrence) => setReassignmentId(occurrence.id)}
        onResumePart={(occurrence) => setPartResumeId(occurrence.id)}
      />
      <ControlTechnicalReport
        occurrence={reportOccurrence}
        onClose={() => setReportOccurrenceId(null)}
      />
      <ControlTechnicianDetail
        technician={selectedTechnician}
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
        technicians={controlTechnicians.filter((technician) => technician.status === 'disponível')}
        onCancel={() => setPartResumeId(null)}
        onConfirm={resumePartOccurrence}
      />
    </ControlShell>
  );
}
