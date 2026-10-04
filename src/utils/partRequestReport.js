import { componentLabel } from '../data/technicalIntelligence';
import { buildReportHtml, reportDateTime, reportFacts, reportParagraph, reportSection, reportTable } from './reportPrint.js';
import { getTechnicianById } from '../data/mockData.js';
import { normalizeOccurrenceTeam } from './occurrenceTeam.js';

const quantityOf = (value) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;

export const getRequestedParts = (request) => {
  if (!request) return [];
  const source = Array.isArray(request.parts) && request.parts.length ? request.parts
    : Array.isArray(request.items) && request.items.length ? request.items
      : request.part || request.partId ? [request] : [];
  return source.map((item) => ({
    code: item.partId || item.code || item.sku || null,
    name: item.part || item.name || 'Peça não informada',
    quantity: quantityOf(item.quantity),
  }));
};

export const buildPartRequestReportHtml = (occurrence, formattedRequestedAt, generatedAt = new Date()) => {
  const request = occurrence.partRequest || {};
  const team = normalizeOccurrenceTeam(occurrence);
  const lines = getRequestedParts(request);
  const title = `Relatório da solicitação · ${occurrence.protocol}`;
  const content = [
    reportSection('Dados da solicitação', reportFacts([
      ['Protocolo', occurrence.protocol], ['Cliente', occurrence.client?.name], ['Local', occurrence.address || occurrence.client?.address],
      ['Elevador', occurrence.elevator?.identification], ['Modelo', occurrence.elevator?.model], ['Técnico solicitante', request.diagnosedBy?.name],
      ['Responsável', getTechnicianById(team.responsibleId)?.name], ['Equipe vinculada', (request.teamMemberIds || team.members.map((member) => member.technicianId)).map((id) => getTechnicianById(id)?.name || id).join(' · ')],
      ['Solicitada em', formattedRequestedAt || reportDateTime(request.requestedAt)], ['Componente', request.componentId ? componentLabel(request.componentId) : ''],
      ['Urgência', request.urgency], ['Prioridade', occurrence.priority?.classification], ['Estado', request.state],
    ])),
    reportSection('Peças solicitadas', reportTable(['Código / referência', 'Peça', 'Quantidade'], lines.map((part) => [part.code, part.name, part.quantity]))),
    reportSection('Diagnóstico / motivo', reportParagraph(request.diagnosis)),
    reportSection('Observações', reportParagraph(request.observation)),
    `<section style="display:flex;gap:25px;margin-top:50px"><div style="flex:1;border-top:1px solid #112244;padding-top:6px">Conferência da central de estoque</div><div style="flex:1;border-top:1px solid #112244;padding-top:6px">Retirada pelo técnico / responsável</div></section>`,
  ].filter(Boolean).join('');
  return buildReportHtml({ title, content, generatedAt });
};
