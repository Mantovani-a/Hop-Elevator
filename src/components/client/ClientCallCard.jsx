import { ModuleIcon } from '../ModuleSidebar';
import StatusBadge from '../StatusBadge';
import { clientElevators, getClientStatus } from '../../data/clientData';
import { OPERATION_STATUS } from '../../data/operationStore';
import { formatDateTime } from '../../utils/presentation';

const getDisplayElevator = (elevatorId) => clientElevators.find((elevator) => elevator.id === elevatorId);

export default function ClientCallCard({ call }) {
  const elevator = getDisplayElevator(call.elevatorId);
  const status = getClientStatus(call);

  return (
    <a
      className={`app-card client-call-item${call.workflowStatus === OPERATION_STATUS.RESOLVED ? ' is-resolved' : ' is-active'}`}
      href={`#/client/call/${call.id}`}
    >
      <div className="client-call-item__head">
        <strong className="text-primary">{call.protocol || 'Chamado'}</strong>
        <StatusBadge value={status} />
      </div>
      <h3 className="fs-5 mt-2 mb-1">{elevator?.displayName || call.elevatorId}</h3>
      <p className="text-secondary mb-3 text-truncate">{call.detectedFailure || call.description}</p>
      <small className="d-inline-flex align-items-center gap-2 text-secondary">
        <ModuleIcon name="clock" size={16} />
        {formatDateTime(call.time)}
      </small>
    </a>
  );
}
