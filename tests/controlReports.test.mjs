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

test.after(async () => { await server.close(); delete globalThis.window; });
