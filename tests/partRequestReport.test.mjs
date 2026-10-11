import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const { getRequestedParts, buildPartRequestReportHtml } = await server.ssrLoadModule('/src/utils/partRequestReport.js');
const { default: ControlPartRequestModal } = await server.ssrLoadModule('/src/components/control/ControlPartRequestModal.jsx');

test('normaliza solicitação antiga com uma peça sem inventar quantidade', () => {
  assert.deepEqual(getRequestedParts({ part: 'Sensor', partId: 'S-1' }), [{ code: 'S-1', name: 'Sensor', quantity: null }]);
});

test('relatório inclui várias peças e protege texto livre', () => {
  const occurrence = { protocol: 'HOP-1', client: { name: 'Cliente <teste>' }, elevator: { identification: 'Cabine 01' }, partRequest: { parts: [{ name: 'Sensor', code: 'S-1', quantity: 2 }, { name: 'Cabo', code: 'C-2', quantity: 1 }], diagnosis: '<script>alert(1)</script>', urgency: 'Alta' } };
  const html = buildPartRequestReportHtml(occurrence, '03/10/2026 14:00', new Date('2026-10-03T17:00:00Z'));
  assert.match(html, /<img[^>]+alt="HOP"/);
  assert.match(html, /<img[^>]+alt="OTIS"/);
  assert.match(html, /@page\{size:A4/);
  assert.match(html, /S-1/);
  assert.match(html, /C-2/);
  assert.match(html, /Cliente &lt;teste&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('modal exibe solicitação com múltiplas peças e ação de impressão', () => {
  const occurrence = { id: '1', protocol: 'HOP-1', client: { name: 'Cliente' }, elevator: { identification: 'Cabine 01' }, priority: { classification: 'alta' }, operationalStatus: 'Aguardando peça', partRequest: { parts: [{ name: 'Sensor', code: 'S-1', quantity: 2 }, { name: 'Cabo', code: 'C-2', quantity: 1 }], diagnosedBy: { name: 'Técnico' } } };
  const html = renderToStaticMarkup(React.createElement(ControlPartRequestModal, { occurrence, onClose() {} }));
  assert.match(html, /Solicitação de peça/);
  assert.match(html, /Sensor/);
  assert.match(html, /C-2/);
  assert.match(html, /Imprimir relatório da solicitação/);
});

test.after(async () => { await server.close(); });
