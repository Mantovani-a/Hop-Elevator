import StatusBadge from '../StatusBadge';
import Modal from '../Modal';
import { formatDateTime } from '../../utils/presentation';
import { printOccurrenceReport } from '../../utils/controlReports';

const asText = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(' · ');
  if (value == null || value === '') return '';
  return String(value);
};

const findResponsibleTechnician = (occurrence) => {
  if (occurrence.technician?.name) return occurrence.technician.name;
  const recordedTechnician = [...(occurrence.workflowHistory || [])]
    .reverse()
    .find((event) => event.technicianName)?.technicianName;
  return recordedTechnician || occurrence.partRequest?.resumedBy?.name || occurrence.partRequest?.diagnosedBy?.name || 'Não informado';
};

function ReportField({ label, value }) {
  const text = asText(value);
  if (!text) return null;
  return <div><dt>{label}</dt><dd>{text}</dd></div>;
}

export default function ControlTechnicalReport({ occurrence, onClose }) {
  if (!occurrence) return null;

  const report = occurrence.technicalReport || {};
  const symptoms = occurrence.metadata?.reportedProblems?.length
    ? occurrence.metadata.reportedProblems
    : occurrence.description;
  const finalDiagnosis = report.finalDiagnosis || occurrence.finalDiagnosticNotes || occurrence.diagnosisNotes;
  const hypothesisResult = report.hypothesisResult || occurrence.finalDiagnosis;
  const maintenancePerformed = report.maintenancePerformed || occurrence.solution;
  const replacedItems = report.replacedParts || occurrence.replacedParts || occurrence.replacedComponents;
  const technicianNotes = report.technicianNotes || occurrence.technicianNotes || occurrence.completionObservation;
  const partRequest = occurrence.partRequest;
  const technicalDetails = [finalDiagnosis, hypothesisResult, maintenancePerformed, replacedItems, technicianNotes, occurrence.finalCondition, partRequest].some(Boolean);
  const timeline = occurrence.workflowHistory || [];

  return (
    <Modal isOpen={Boolean(occurrence)} onClose={onClose} title="Relatório técnico final" titleId="control-report-title" showHeader={false} className="control-detail-panel control-report-panel" layerClassName="control-modal-layer control-detail-layer">
        <header>
          <div><p className="eyebrow eyebrow--dark">{occurrence.protocol}</p><h2 id="control-report-title">Relatório técnico final</h2></div>
          <button type="button" onClick={onClose} aria-label="Fechar">×</button>
        </header>
        <div className="control-detail-panel__body">
        <div className="control-report-print-action"><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => printOccurrenceReport(occurrence)}>Imprimir relatório da ocorrência</button></div>

        <div className="control-detail-panel__badges"><StatusBadge value="Concluída" />{occurrence.duration && <span className="control-report-panel__duration">Duração: {occurrence.duration}</span>}</div>

        <section>
          <h3>Resumo do atendimento</h3>
          <dl className="control-report-grid">
            <ReportField label="Protocolo" value={occurrence.protocol} />
            <ReportField label="Conclusão" value={formatDateTime(occurrence.completedAt)} />
            <ReportField label="Cliente" value={occurrence.client?.name} />
            <ReportField label="Elevador" value={occurrence.elevator?.identification} />
            <ReportField label="Técnico responsável" value={findResponsibleTechnician(occurrence)} />
          </dl>
        </section>

        <section>
          <h3>Registro técnico</h3>
          <dl className="control-report-grid control-report-grid--single">
            <ReportField label="Sintomas informados inicialmente" value={symptoms} />
            <ReportField label="Diagnóstico final" value={finalDiagnosis} />
            <ReportField label="Hipótese confirmada ou descartada" value={hypothesisResult} />
            <ReportField label="Manutenção realizada" value={maintenancePerformed} />
            <ReportField label="Componentes / peças substituídos" value={replacedItems} />
            {partRequest && <ReportField label="Peças solicitadas durante o atendimento" value={`${partRequest.part || 'Peça não informada'} ×${partRequest.quantity || 1}${partRequest.diagnosis ? ` — ${partRequest.diagnosis}` : ''}`} />}
            <ReportField label="Observações do técnico" value={technicianNotes || partRequest?.observation} />
            <ReportField label="Condição final do elevador" value={occurrence.finalCondition} />
          </dl>
          {!technicalDetails && <p className="control-report-panel__empty">Nenhum detalhe técnico foi registrado para esta ocorrência.</p>}
        </section>

        <section>
          <h3>{partRequest ? 'Fluxo de peça e etapas do atendimento' : 'Etapas do atendimento'}</h3>
          {timeline.length ? (
            <ol className="control-event-timeline control-report-timeline">
              {timeline.map((event, index) => (
                <li key={`${event.at}-${index}`}>
                  <time dateTime={event.at}>{formatDateTime(event.at)}</time>
                  <span>{event.label}</span>
                  {index < timeline.length - 1 && <i aria-hidden="true" />}
                </li>
              ))}
            </ol>
          ) : <p className="control-report-panel__empty">Histórico das etapas não informado.</p>}
        </section>
        </div>
    </Modal>
  );
}
