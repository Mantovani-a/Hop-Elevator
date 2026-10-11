// Pequena base técnica demonstrativa, vinculada às famílias de modelos cadastradas.
export const components = [
  { id: 'doors', label: 'Portas e sensores' },
  { id: 'control', label: 'Comando e painel' },
  { id: 'drive', label: 'Tração e nivelamento' },
  { id: 'power', label: 'Alimentação elétrica' },
];

export const parts = [
  { id: 'SEN-24', name: 'Sensor de presença da porta', componentId: 'doors', models: ['H', 'P', 'R', 'V', 'C'] },
  { id: 'ROL-12', name: 'Conjunto de roldanas da porta', componentId: 'doors', models: ['P', 'R', 'V'] },
  { id: 'MOD-CB', name: 'Módulo de chamada da cabine', componentId: 'control', models: ['H', 'P', 'R', 'V', 'C'] },
  { id: 'PL-02', name: 'Placa de comando auxiliar', componentId: 'control', models: ['H', 'P', 'C'] },
  { id: 'NV-08', name: 'Sensor de nivelamento', componentId: 'drive', models: ['H', 'P', 'R', 'V', 'C'] },
  { id: 'INV-04', name: 'Interface do inversor de tração', componentId: 'drive', models: ['P', 'R', 'V'] },
  { id: 'FON-24', name: 'Fonte de alimentação 24 V', componentId: 'power', models: ['H', 'P', 'R', 'V', 'C'] },
];

const modelFamily = (model = '') => {
  const code = model.match(/\b([HPRVC])-\d+\b/i)?.[1]?.toUpperCase();
  return code || null;
};

export const compatibleParts = (model, componentId) => {
  const family = modelFamily(model);
  return family ? parts.filter((part) => part.models.includes(family) && (!componentId || part.componentId === componentId)) : [];
};

export const componentLabel = (id) => components.find((item) => item.id === id)?.label || 'Componente não informado';
export const partById = (id) => parts.find((item) => item.id === id);

const seedComponents = {
  'OCC-2026-002': 'doors', 'OCC-2026-003': 'doors', 'OCC-2026-005': 'control',
  'OCC-2026-006': 'power', 'OCC-2026-007': 'control', 'OCC-2026-008': 'doors',
  'OCC-2026-011': 'doors', 'OCC-2026-012': 'control', 'OCC-2026-013': 'control',
  'OCC-2026-014': 'doors', 'OCC-2026-015': 'control', 'OCC-2026-017': 'power',
  'OCC-2026-018': 'drive', 'OCC-2026-020': 'drive', 'OCC-2026-021': 'doors',
  'OCC-2026-022': 'power', 'OCC-2026-023': 'doors', 'OCC-2026-025': 'control',
};

export const seedComponentFor = (id) => seedComponents[id] || null;

export const componentRecurrences = (occurrences, elevatorId, now = new Date()) => {
  const cutoff = now.getTime() - 30 * 86400000;
  const grouped = new Map();
  occurrences.forEach((occurrence) => {
    if (occurrence.elevatorId !== elevatorId || occurrence.serviceType === 'preventive') return;
    const componentId = occurrence.componentId || seedComponentFor(occurrence.id);
    const timestamp = new Date(occurrence.time).getTime();
    if (!componentId || !Number.isFinite(timestamp) || timestamp < cutoff || timestamp > now.getTime()) return;
    grouped.set(componentId, [...(grouped.get(componentId) || []), occurrence]);
  });
  return [...grouped.entries()]
    .filter(([, items]) => items.length >= 2)
    .map(([componentId, items]) => ({ componentId, label: componentLabel(componentId), count: items.length, latest: items.sort((a, b) => new Date(b.time) - new Date(a.time))[0] }))
    .sort((a, b) => b.count - a.count);
};
