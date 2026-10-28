import { getElevatorById } from '../data/mockData.js';
import { OPERATION_STATUS } from '../data/operationStore.js';
import { calculatePriority } from '../utils/priorityScore.js';
import { getDisplayElevator } from '../data/clientData.js';

/**
 * Constrói a hipótese de diagnóstico e regiões suspeitas a partir dos problemas relatados.
 *
 * @param {string[]} reportedProblems
 * @param {string} trappedPeople
 * @param {Object} elevator
 * @param {string} summary
 * @returns {Object}
 */
const buildDiagnosisHypothesis = (reportedProblems, trappedPeople, elevator, summary) => {
  let probableOrigin = 'Região relacionada ao relato';
  let suspectedRegions = ['cabin'];

  if (reportedProblems.includes('Porta com defeito')) {
    probableOrigin = 'Conjunto de portas';
    suspectedRegions = ['doors', 'doorOperator'];
  } else if (reportedProblems.includes('Painel/botão não responde')) {
    probableOrigin = 'Painel de controle';
    suspectedRegions = ['control', 'sensors'];
  } else if (reportedProblems.includes('Barulho estranho')) {
    probableOrigin = 'Tração e componentes mecânicos';
    suspectedRegions = ['machine', 'pulleys', 'belts'];
  } else if (trappedPeople === 'Sim') {
    probableOrigin = 'Cabine e conjunto de portas';
    suspectedRegions = ['cabin', 'doors'];
  }

  return {
    demoCode: 'MVP-CLIENT-REPORT',
    system: elevator.system || 'Geral',
    source: 'Indicação baseada na triagem do cliente',
    probableOrigin,
    suspectedRegions,
    summary,
  };
};

/**
 * Constrói e valida a entidade completa de ocorrência originada pelo cliente,
 * aplicando regras de priorização, geolocalização e metadados operacionais.
 *
 * @param {Object} form - Dados enviados no formulário de abertura
 * @param {Object} establishment - Entidade do cliente/estabelecimento
 * @param {Array<Object>} displayedElevators - Elevadores disponíveis
 * @param {Date} [now=new Date()] - Referência temporal
 * @returns {Object} Entidade completa de ocorrência pronta para inserção no store
 */
export const buildClientOccurrencePayload = (form, establishment, displayedElevators, now = new Date()) => {
  const elevator = form.elevator
    || getDisplayElevator(form.elevatorId, displayedElevators)
    || displayedElevators[0];

  const id = `OCC-CLIENT-${now.getTime()}`;
  const protocol = `HOP-${String(now.getTime()).slice(-6)}`;

  const trappedCountNum = form.trappedPeople === 'Sim' ? (Number(form.trappedCount) || 1) : 0;
  const reportedProblems = Array.isArray(form.problemTypes) && form.problemTypes.length
    ? form.problemTypes
    : [form.problemType].filter(Boolean);

  const problemDescription = reportedProblems
    .map((problem) => (problem === 'Outro problema' ? form.otherProblem : problem))
    .filter(Boolean)
    .join(' · ');

  const summary = form.observation
    || problemDescription
    || 'Ocorrência aberta pelo cliente responsável com validação de passageiros presos e risco.';

  const description = form.observation
    || problemDescription
    || (form.trappedPeople === 'Sim'
      ? `Passageiro(s) preso(s) na cabine (${trappedCountNum} pessoa${trappedCountNum > 1 ? 's' : ''}).`
      : `Intercorrência relatada pelo cliente no ${elevator.displayName}.`);

  const occurrence = {
    id,
    elevatorId: elevator.id,
    clientId: establishment.id,
    address: elevator.address || establishment.address,
    time: now.toISOString(),
    description,
    status: 'aberta',
    technicianId: null,
    trappedPeople: trappedCountNum,
    locationContext: `${establishment.type} com operação assistencial contínua.`,
  };

  const clientNotes = [
    ...reportedProblems.map((problem) => (problem === 'Outro problema' ? form.otherProblem : problem)),
    form.riskNote,
    form.observation,
  ].filter(Boolean).join(' — ');

  const metadata = {
    riskToLife: form.risk === 'Sim' ? true : form.risk === 'Não' ? false : null,
    riskUnknown: form.risk === 'Não sei',
    criticalFacility: establishment.type === 'Hospital',
    elevatorStopped: form.functioning === 'Não está funcionando',
    partialFailure: form.functioning === 'Sim, mas com dificuldade',
    serviceNumber: protocol,
    clientNotes,
    reportedProblems,
    emergencyDispatchSimulation: form.risk === 'Sim',
    distanceKm: 2.4,
    etaMinutes: 7,
    latitude: -23.5688,
    longitude: -46.6487,
    recurrence: false,
    diagnosis: buildDiagnosisHypothesis(reportedProblems, form.trappedPeople, elevator, summary),
  };

  const baseElevator = getElevatorById(elevator.id) || elevator;
  const priority = calculatePriority({
    occurrence,
    client: establishment,
    elevator: {
      ...baseElevator,
      status: metadata.elevatorStopped ? 'parado' : baseElevator.status,
    },
    metadata,
    now,
  });

  return {
    ...occurrence,
    protocol,
    detectedFailure: form.observation || problemDescription || `Relato de intercorrência no ${elevator.displayName}`,
    system: elevator.system || 'Cabine / Portas',
    functioning: form.functioning,
    trappedPeopleAnswer: form.trappedPeople,
    trappedCount: form.trappedCount,
    riskAnswer: form.risk,
    observation: form.observation,
    riskNote: form.riskNote,
    reportedProblems,
    priority,
    severity: priority.classification,
    workflowStatus: OPERATION_STATUS.WAITING_ASSIGNMENT,
    metadata,
    origin: 'client',
    completedAt: null,
    duration: null,
    finalDiagnosis: null,
    solution: null,
  };
};
