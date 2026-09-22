import { useEffect, useMemo, useState } from 'react';
import ClientShell from '../components/client/ClientShell';
import ClientSupportFlow from '../components/client/ClientSupportFlow';
import ClientOverview from './client/ClientOverview';
import ClientElevators from './client/ClientElevators';
import ClientCalls from './client/ClientCalls';
import ClientCallDetail from './client/ClientCallDetail';
import ClientProfile from './client/ClientProfile';
import {
  clientElevators,
  clientEstablishment,
  clientUser,
  getClientStatus,
} from '../data/clientData';
import { OPERATION_STATUS, addOperationOccurrence } from '../data/operationStore';
import { getElevatorById } from '../data/mockData';
import useOperationState from '../hooks/useOperationState';
import { calculatePriority } from '../utils/priorityScore';

const getDisplayElevator = (elevatorId) => clientElevators.find((elevator) => elevator.id === elevatorId);

export default function ClientPage({ route = '/client' }) {
  const operationState = useOperationState();
  const [newCallId, setNewCallId] = useState(null);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route]);

  const allCalls = useMemo(
    () => (operationState?.occurrences || [])
      .filter((call) => call?.clientId === clientEstablishment?.id)
      .sort((first, second) => new Date(second.time || 0) - new Date(first.time || 0)),
    [operationState],
  );

  const statusFor = (call) => getClientStatus(call);
  const activeCalls = allCalls.filter((call) => statusFor(call) !== OPERATION_STATUS.RESOLVED);
  const resolvedCalls = allCalls.filter((call) => statusFor(call) === OPERATION_STATUS.RESOLVED);
  const latestActiveCall = activeCalls[0];

  const displayedElevators = clientElevators.map((elevator) => {
    const trackedCall = activeCalls.find((call) => call.elevatorId === elevator.id);
    const latestCall = allCalls.find((call) => call.elevatorId === elevator.id);
    if (!trackedCall) {
      return {
        ...elevator,
        clientStatus: latestCall?.finalCondition || 'Operação normal',
        activeCall: null,
      };
    }
    const clientStatus = trackedCall.workflowStatus === OPERATION_STATUS.RESOLVED
      ? 'Operação normal'
      : getClientStatus(trackedCall);
    return {
      ...elevator,
      clientStatus,
      system: trackedCall.system || elevator.system,
      activeCall: trackedCall.workflowStatus !== OPERATION_STATUS.RESOLVED ? trackedCall : null,
    };
  });

  const submitSupport = (form) => {
    setSubmitError(false);
    try {
      const now = new Date();
      const elevator = form.elevator || getDisplayElevator(form.elevatorId) || displayedElevators[0];
      const id = `OCC-CLIENT-${now.getTime()}`;
      const protocol = `HOP-${String(now.getTime()).slice(-6)}`;

      const trappedCountNum = form.trappedPeople === 'Sim' ? (Number(form.trappedCount) || 1) : 0;
      const reportedProblems = Array.isArray(form.problemTypes) && form.problemTypes.length
        ? form.problemTypes
        : [form.problemType].filter(Boolean);
      const problemDescription = reportedProblems
        .map((problem) => problem === 'Outro problema' ? form.otherProblem : problem)
        .filter(Boolean)
        .join(' · ');
      const occurrence = {
        id,
        elevatorId: elevator.id,
        clientId: clientEstablishment.id,
        address: elevator.address || clientEstablishment.address,
        time: now.toISOString(),
        description: form.observation || problemDescription || (form.trappedPeople === 'Sim'
          ? `Passageiro(s) preso(s) na cabine (${trappedCountNum} pessoa${trappedCountNum > 1 ? 's' : ''}).`
          : `Intercorrência relatada pelo cliente no ${elevator.displayName}.`),
        status: 'aberta',
        technicianId: null,
        trappedPeople: trappedCountNum,
        locationContext: `${clientEstablishment.type} com operação assistencial contínua.`,
      };

      const metadata = {
        riskToLife: form.risk === 'Sim' ? true : form.risk === 'Não' ? false : null,
        riskUnknown: form.risk === 'Não sei',
        criticalFacility: clientEstablishment.type === 'Hospital',
        elevatorStopped: form.functioning === 'Não está funcionando',
        partialFailure: form.functioning === 'Sim, mas com dificuldade',
        serviceNumber: protocol,
        clientNotes: [...reportedProblems.map((problem) => problem === 'Outro problema' ? form.otherProblem : problem), form.riskNote, form.observation].filter(Boolean).join(' — '),
        reportedProblems,
        emergencyDispatchSimulation: form.risk === 'Sim',
        distanceKm: 2.4,
        etaMinutes: 7,
        latitude: -23.5688,
        longitude: -46.6487,
        recurrence: false,
        diagnosis: {
          demoCode: 'MVP-CLIENT-REPORT',
          system: elevator.system || 'Geral',
          source: 'Indicação baseada na triagem do cliente',
          probableOrigin: reportedProblems.includes('Porta com defeito')
            ? 'Conjunto de portas'
            : reportedProblems.includes('Painel/botão não responde')
              ? 'Painel de controle'
              : reportedProblems.includes('Barulho estranho')
                ? 'Tração e componentes mecânicos'
                : form.trappedPeople === 'Sim'
                  ? 'Cabine e conjunto de portas'
                  : 'Região relacionada ao relato',
          suspectedRegions: reportedProblems.includes('Porta com defeito')
            ? ['doors', 'doorOperator']
            : reportedProblems.includes('Painel/botão não responde')
              ? ['control', 'sensors']
              : reportedProblems.includes('Barulho estranho')
                ? ['machine', 'pulleys', 'belts']
                : form.trappedPeople === 'Sim'
                  ? ['cabin', 'doors']
                  : ['cabin'],
          summary: form.observation || problemDescription || 'Ocorrência aberta pelo cliente responsável com validação de passageiros presos e risco.',
        },
      };

      const baseElevator = getElevatorById(elevator.id) || elevator;
      const priority = calculatePriority({
        occurrence,
        client: clientEstablishment,
        elevator: { ...baseElevator, status: metadata.elevatorStopped ? 'parado' : baseElevator.status },
        metadata,
        now,
      });

      const call = {
        ...occurrence,
        protocol,
        detectedFailure: form.observation || problemDescription || `Relato de intercorrência no ${elevator.displayName}`,
        system: elevator.system || 'Cabine / Portas',
        functioning: form.functioning,
        trappedPeopleAnswer: form.trappedPeople,
        trappedCount: form.trappedCount,
        riskAnswer: form.risk,
        observation: form.observation,
        riskNote: form.riskNote,
        reportedProblems,
        priority,
        severity: priority.classification,
        workflowStatus: OPERATION_STATUS.WAITING_ASSIGNMENT,
        metadata,
        origin: 'client',
        completedAt: null,
        duration: null,
        finalDiagnosis: null,
        solution: null,
      };

      addOperationOccurrence(call);
      setNewCallId(id);
      window.location.hash = `/client/call/${id}`;
    } catch {
      setSubmitError(true);
    }
  };

  let content;
  if (route === '/client') {
    content = (
      <ClientOverview
        displayedElevators={displayedElevators}
        activeCalls={activeCalls}
        latestActiveCall={latestActiveCall}
        statusFor={statusFor}
      />
    );
  } else if (route === '/client/elevators') {
    content = <ClientElevators displayedElevators={displayedElevators} />;
  } else if (route === '/client/calls') {
    content = <ClientCalls activeCalls={activeCalls} resolvedCalls={resolvedCalls} />;
  } else if (route === '/client/profile') {
    content = <ClientProfile />;
  } else if (route === '/client/support') {
    content = (
      <ClientSupportFlow
        elevators={displayedElevators}
        establishment={clientEstablishment}
        onCancel={() => { window.location.hash = '/client'; }}
        onSubmit={submitSupport}
        submitError={submitError}
      />
    );
  } else if (route.startsWith('/client/support/')) {
    const elevatorId = route.split('/').pop();
    const elevator = getDisplayElevator(elevatorId);
    content = elevator ? (
      <ClientSupportFlow
        elevator={elevator}
        elevators={displayedElevators}
        establishment={clientEstablishment}
        onCancel={() => { window.location.hash = '/client'; }}
        onSubmit={submitSupport}
        submitError={submitError}
      />
    ) : (
      <div className="client-error-message p-4" role="alert">
        <strong>Elevador não encontrado.</strong>
        <span>Verifique a lista de elevadores e tente novamente.</span>
      </div>
    );
  } else if (route.startsWith('/client/call/')) {
    const callId = route.split('/').pop();
    const call = allCalls.find((item) => item.id === callId);
    content = call ? (
      <ClientCallDetail
        call={call}
        newCallId={newCallId}
        statusFor={statusFor}
      />
    ) : (
      <div className="client-error-message p-4" role="alert">
        <strong>Chamado não encontrado.</strong>
        <span>Volte para a lista de chamados e tente novamente.</span>
      </div>
    );
  } else {
    content = (
      <div className="client-error-message p-4" role="alert">
        <strong>Página não encontrada.</strong>
        <span>Use o menu para voltar ao início do HOP Client.</span>
      </div>
    );
  }

  return (
    <ClientShell route={route} user={clientUser} establishment={clientEstablishment}>
      {content}
    </ClientShell>
  );
}
