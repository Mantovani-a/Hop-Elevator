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
  getDisplayElevator,
} from '../data/clientData';
import { OPERATION_STATUS, addOperationOccurrence } from '../data/operationStore';
import useOperationState from '../hooks/useOperationState';
import { buildClientOccurrencePayload } from '../services/clientSupportService';
import { navigateTo } from '../utils/navigation';

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
      const call = buildClientOccurrencePayload(form, clientEstablishment, displayedElevators);
      addOperationOccurrence(call);
      setNewCallId(call.id);
      navigateTo(`/client/call/${call.id}`);
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
        onCancel={() => navigateTo('/client')}
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
        onCancel={() => navigateTo('/client')}
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
