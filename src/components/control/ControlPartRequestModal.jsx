import Modal from '../Modal';
import StatusBadge from '../StatusBadge';
import { OPERATION_STATUS } from '../../data/operationStore';
import { componentLabel } from '../../data/technicalIntelligence';
import { formatDateTime } from '../../utils/presentation';
import { buildPartRequestReportHtml, getRequestedParts } from '../../utils/partRequestReport';
import { printReportHtml, reportDateTime } from '../../utils/reportPrint';

export default function ControlPartRequestModal({ occurrence, onClose, onResumePart }) {
  if (!occurrence?.partRequest) return null;
  const request = occurrence.partRequest;
  const parts = getRequestedParts(request);
  const printReport = () => {
    printReportHtml(buildPartRequestReportHtml(occurrence, reportDateTime(request.requestedAt)), `Solicitação de peça · ${occurrence.protocol}`);
  };
  const facts = [
    ['Cliente', occurrence.client?.name], ['Local', occurrence.address || occurrence.client?.address],
    ['Elevador', occurrence.elevator?.identification], ['Modelo', occurrence.elevator?.model],
    ['Técnico solicitante', request.diagnosedBy?.name], ['Solicitada em', formatDateTime(request.requestedAt)],
    ['Componente afetado', request.componentId ? componentLabel(request.componentId) : null],
    ['Urgência', request.urgency], ['Estado atual', request.state],
  ];
  return <Modal isOpen onClose={onClose} title="Solicitação de peça" titleId="part-request-title" showHeader={false} className="control-detail-panel control-part-request-modal" layerClassName="control-modal-layer control-detail-layer">
    <header className="control-occurrence-head"><div><p className="eyebrow eyebrow--dark">{occurrence.protocol}</p><h2 id="part-request-title">Solicitação de peça</h2></div><div className="control-occurrence-head__badges"><StatusBadge value={occurrence.priority?.classification || 'baixa'} type="severity" /><StatusBadge value={occurrence.operationalStatus} /></div><button type="button" onClick={onClose} aria-label="Fechar solicitação">×</button></header>
    <div className="control-part-request-body">
      <section><h3>Dados da solicitação</h3><dl className="control-part-request-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Não informado'}</dd></div>)}</dl></section>
      <section><h3>Peças solicitadas</h3><div className="control-part-request-table-scroll"><table><thead><tr><th>Peça</th><th>Referência / código</th><th>Quantidade</th></tr></thead><tbody>{parts.map((part, index) => <tr key={`${part.code || part.name}-${index}`}><td>{part.name}</td><td>{part.code || 'Não informada'}</td><td>{part.quantity ?? 'Não informada'}</td></tr>)}</tbody></table></div>{!parts.length && <p>Nenhuma peça discriminada.</p>}</section>
      <section className="control-part-request-notes"><h3>Diagnóstico e observações</h3><dl><div><dt>Motivo da substituição</dt><dd>{request.diagnosis || 'Não informado'}</dd></div><div><dt>Observação</dt><dd>{request.observation || 'Nenhuma observação registrada.'}</dd></div></dl></section>
    </div>
    <footer className="control-part-request-actions">{occurrence.workflowStatus === OPERATION_STATUS.WAITING_PART && <button type="button" className="btn btn-outline-primary" onClick={() => onResumePart(occurrence)}>Peça disponível · retomar atendimento</button>}<button type="button" className="btn btn-primary" onClick={printReport}>Imprimir relatório da solicitação</button></footer>
  </Modal>;
}
