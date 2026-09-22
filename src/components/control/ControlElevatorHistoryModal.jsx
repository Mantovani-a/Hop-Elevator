import { useMemo } from 'react';
import Modal from '../Modal';
import StatusBadge from '../StatusBadge';
import { OPERATION_STATUS } from '../../data/operationStatus';
import { formatDateTime } from '../../utils/presentation';

const getDiagnosis = (occurrence) => occurrence.finalDiagnosis
  || occurrence.partRequest?.diagnosis
  || occurrence.metadata?.diagnosis?.summary;

const getParts = (occurrence) => {
  if (!occurrence.partRequest?.part) return null;
  const quantity = occurrence.partRequest.quantity ? ` ×${occurrence.partRequest.quantity}` : '';
  return `${occurrence.partRequest.part}${quantity}`;
};

export default function ControlElevatorHistoryModal({ elevator, onClose }) {
  const history = useMemo(
    () => [...(elevator?.maintenanceHistory || [])]
      .sort((first, second) => new Date(second.time || 0) - new Date(first.time || 0)),
    [elevator],
  );

  if (!elevator) return null;

  return (
    <Modal
      isOpen={Boolean(elevator)}
      onClose={onClose}
      className="control-elevator-history"
      titleId="elevator-history-title"
      showHeader={false}
    >
      <header>
        <div>
          <p className="eyebrow eyebrow--dark">{elevator.client?.name}</p>
          <h2 id="elevator-history-title">Histórico de manutenções</h2>
          <span>{elevator.identification} · {elevator.id}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar histórico">×</button>
      </header>

        <div className="control-elevator-history__summary">
          <strong>{history.length} {history.length === 1 ? 'registro' : 'registros'} neste equipamento</strong>
          {history.length > 1 && <span>Compare os sintomas dos registros para identificar reincidências.</span>}
        </div>

        {history.length ? (
          <ol className="control-elevator-history__list">
            {history.map((occurrence) => {
              const diagnosis = getDiagnosis(occurrence);
              const parts = getParts(occurrence);
              const isResolved = occurrence.operationalStatus === OPERATION_STATUS.RESOLVED;
              return (
                <li key={occurrence.id}>
                  <article className="control-elevator-history__item">
                    <header>
                      <div>
                        <time dateTime={occurrence.time}>{formatDateTime(occurrence.time)}</time>
                        <strong>{occurrence.protocol}</strong>
                      </div>
                      <StatusBadge value={occurrence.operationalStatus || occurrence.status} />
                    </header>

                    <div className="control-elevator-history__problem">
                      <span>Ocorrência / sintomas</span>
                      <p>{occurrence.description}</p>
                      {occurrence.metadata?.reportedProblems?.length > 0 && <small>{occurrence.metadata.reportedProblems.join(' · ')}</small>}
                    </div>

                    <dl>
                      {occurrence.technician?.name && <div><dt>Técnico responsável</dt><dd>{occurrence.technician.name}</dd></div>}
                      {diagnosis && <div><dt>Diagnóstico</dt><dd>{diagnosis}</dd></div>}
                      {occurrence.solution && <div><dt>Ação realizada</dt><dd>{occurrence.solution}</dd></div>}
                      {parts && <div><dt>Peças utilizadas ou solicitadas</dt><dd>{parts}{occurrence.partRequest?.state ? ` · ${occurrence.partRequest.state}` : ''}</dd></div>}
                      {isResolved && occurrence.finalCondition && <div><dt>Status final</dt><dd>{occurrence.finalCondition}</dd></div>}
                      {occurrence.duration && <div><dt>Tempo de atendimento</dt><dd>{occurrence.duration}</dd></div>}
                      {occurrence.completedAt && <div><dt>Conclusão</dt><dd>{formatDateTime(occurrence.completedAt)}</dd></div>}
                    </dl>
                  </article>
                </li>
              );
            })}
          </ol>
        ) : <p className="control-elevator-history__empty">Nenhuma ocorrência ou manutenção registrada para este equipamento.</p>}
    </Modal>
  );
}
