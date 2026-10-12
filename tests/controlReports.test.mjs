import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const reports = await server.ssrLoadModule('/src/utils/controlReports.js');
let printedHtml = '';
globalThis.window = {
  location: { href: 'http://localhost:5173/#/control' },
  open: () => ({
    document: { open() {}, write(html) { printedHtml = html; }, close() {}, readyState: 'complete', body: {}, images: [] },
    addEventListener() {}, focus() {}, print() {},
  }),
};

const occurrence = {
  id: 'OCC-1', protocol: 'HOP-1001', elevatorId: 'ELV-001', time: '2026-10-04T12:00:00Z',
  operationalStatus: 'Em manutenção', priority: { classification: 'alta', score: 82, reasons: ['Risco informado'] },
  description: 'Falha no painel', client: { name: 'Hospital Santa Helena' },
  elevator: { identification: 'Torre A • Elevador 01', model: 'H-01', status: 'parado' },
  workflowHistory: [{ at: '2026-10-04T12:10:00Z', label: 'Técnico chegou', technicianId: 'TEC-001', technicianName: 'Ana Ribeiro' }],
  technicianId: 'TEC-001', technician: { name: 'Ana Ribeiro' },
};

test('relatórios usam o mesmo cabeçalho A4 e só incluem registros pertinentes', () => {
  reports.printOpenOccurrencesReport([occurrence, { ...occurrence, id: 'OCC-2', protocol: 'HOP-1002', operationalStatus: 'Resolvido' }]);
  assert.match(printedHtml, /@page\{size:A4 landscape/);
  assert.match(printedHtml, /alt="HOP"/);
  assert.match(printedHtml, /alt="OTIS"/);
  assert.match(printedHtml, /HOP-1001/);
  assert.doesNotMatch(printedHtml, /HOP-1002/);

  reports.printOccurrenceReport(occurrence);
  assert.match(printedHtml, /Falha no painel/);
  assert.match(printedHtml, /Risco informado/);
  assert.match(printedHtml, /Técnico chegou/);
  assert.doesNotMatch(printedHtml, /Peça solicitada/);

  reports.printTechnicianReport({ id: 'TEC-001', name: 'Ana Ribeiro', status: 'em atendimento', specialty: 'Portas' }, [occurrence]);
  assert.match(printedHtml, /Ana Ribeiro/);
  assert.match(printedHtml, /Em atendimento/);
  assert.doesNotMatch(printedHtml, /Horários previstos/);

  reports.printElevatorReport({ id: 'ELV-001', identification: 'Torre A • Elevador 01', status: 'parado', maintenanceHistory: [occurrence] }, 'Hospitalar');
  assert.match(printedHtml, /Histórico do elevador/);
  assert.match(printedHtml, /HOP-1001/);
  assert.match(printedHtml, /Parado/);

  reports.printPreventivesReport([{ id: 'PREV-1', elevatorId: 'ELV-001', date: '2099-01-01', window: '09:00–11:00' }], []);
  assert.match(printedHtml, /Preventivas agendadas/);
  assert.match(printedHtml, /09:00–11:00/);
});

test('relatórios gerais incluem todos os registros recebidos e mantêm tabelas pagináveis', () => {
  reports.printOpenOccurrencesReport(Array.from({ length: 35 }, (_, index) => ({ ...occurrence, id: `OCC-${index}`, protocol: `HOP-${2000 + index}` })));
  assert.match(printedHtml, /section\{break-inside:auto\}/);
  assert.match(printedHtml, /thead\{display:table-header-group\}/);
  assert.match(printedHtml, /HOP-2034/);

  reports.printOperatorsReport([
    { id: 'TEC-001', name: 'Ana Ribeiro', status: 'disponível', region: 'Centro' },
    { id: 'TEC-002', name: 'Bruno Martins', status: 'em atendimento', region: 'Sul' },
  ], [occurrence], [{ technicianId: 'TEC-001', type: 'start', at: '2026-10-04T10:00:00Z' }]);
  assert.match(printedHtml, /Total de operadores/);
  assert.match(printedHtml, /Ana Ribeiro/);
  assert.match(printedHtml, /Bruno Martins/);
  assert.match(printedHtml, /Registros de ponto/);

  reports.printElevatorsReport([
    { id: 'ELV-001', identification: 'Torre A', status: 'parado', maintenanceHistory: [occurrence], activeOccurrence: occurrence },
    { id: 'ELV-002', identification: 'Torre B', status: 'operando', maintenanceHistory: [] },
  ], [{ elevatorId: 'ELV-002', date: '2099-01-01' }]);
  assert.match(printedHtml, /Torre A/);
  assert.match(printedHtml, /Torre B/);
  assert.match(printedHtml, /Status operacional/);
  assert.match(printedHtml, /Ocorrência ativa/);
});

test('análises só imprimem dados do período fornecido e representam os gráficos', () => {
  printedHtml = '';
  const empty = { period: '7', start: '2026-10-01', end: '2026-10-07', opened: [], concluded: [], active: [], mttr: null, durations: [], recurrent: [], pendingParts: [], slaRisk: [], severity: [], stages: [], failures: [], places: [], days: [] };
  assert.equal(reports.printAnalyticsReport(empty), false);
  assert.equal(printedHtml, '');
  assert.equal(reports.printAnalyticsReport({ ...empty, opened: [occurrence], severity: [{ label: 'alta', value: 1 }], days: [{ label: '04/10', value: 1 }] }), true);
  assert.match(printedHtml, /01\/10\/2026 a 07\/10\/2026/);
  assert.match(printedHtml, /Prioridade das ocorrências/);
  assert.match(printedHtml, /Evolução de chamados/);
  assert.match(printedHtml, /report-chart-fill/);
});

test.after(async () => { await server.close(); delete globalThis.window; });
