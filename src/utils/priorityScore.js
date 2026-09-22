/**
 * @typedef {Object} PriorityCalculationParams
 * @property {Object} occurrence - Occurrence entity containing status, time, trapped people, severity.
 * @property {Object} [client] - Client/building entity with type (e.g., Hospital).
 * @property {Object} [elevator] - Elevator entity with operational status.
 * @property {Object} [metadata] - Additional risk flags (riskToLife, criticalFacility, recurrence).
 * @property {Date} [now] - Reference date for time elapsed calculation (defaults to current time).
 */

/**
 * @typedef {Object} PriorityCalculationResult
 * @property {number} score - Calculated priority score between 0 and 100.
 * @property {'crítica'|'alta'|'atenção'|'baixa'} classification - Severity tier.
 * @property {string[]} reasons - Human-readable reasons contributing to score.
 * @property {number} elapsedMinutes - Time elapsed since occurrence opening.
 */

const scoreRanges = [
  { min: 80, label: 'crítica' },
  { min: 55, label: 'alta' },
  { min: 30, label: 'atenção' },
  { min: 0, label: 'baixa' },
];

/**
 * Formats elapsed minutes into human-readable hours and minutes.
 * @param {number} minutes
 * @returns {string}
 */
const formatElapsedTime = (minutes) => {
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
};

/**
 * Maps a numerical score (0-100) to a qualitative classification.
 * @param {number} score
 * @returns {'crítica'|'alta'|'atenção'|'baixa'}
 */
const classifyPriority = (score) =>
  scoreRanges.find((range) => score >= range.min)?.label || 'baixa';

/**
 * Calculates dynamic HOP Priority Score (0-100) based on severity,
 * trapped passengers, building criticality (hospitals), stopped elevator status,
 * recurrence, and SLA elapsed time.
 *
 * @param {PriorityCalculationParams} params
 * @returns {PriorityCalculationResult}
 */
export const calculatePriority = ({ occurrence, client, elevator, metadata = {}, now = new Date() }) => {
  let score = 5;
  const reasons = [];
  const openedAt = new Date(occurrence.time);
  const closedAt = occurrence.completedAt ? new Date(occurrence.completedAt) : null;
  const referenceTime = closedAt && !Number.isNaN(closedAt.getTime()) ? closedAt : now;
  const elapsedMinutes = Math.max(0, Math.floor((referenceTime.getTime() - openedAt.getTime()) / 60000));

  if (occurrence.trappedPeople > 0) {
    score = 70 + Math.min(10, occurrence.trappedPeople * 3);
    reasons.push(`${occurrence.trappedPeople} ${occurrence.trappedPeople === 1 ? 'passageiro preso — prioridade de resgate' : 'passageiros presos — prioridade de resgate'}`);
  } else if (occurrence.severity === 'crítica') {
    score += 55;
    reasons.push('Severidade crítica operacional');
  } else if (occurrence.severity === 'alta') {
    score += 35;
    reasons.push('Severidade alta operacional');
  } else if (occurrence.severity === 'atenção') {
    score += 15;
    reasons.push('Severidade com necessidade de atenção');
  }

  if (metadata.riskToLife === true) {
    score += 15;
    reasons.push('Risco à vida informado');
  } else if (metadata.riskUnknown) {
    reasons.push('Risco imediato não confirmado — requer verificação');
  }

  if (client?.type === 'Hospital' || metadata.criticalFacility) {
    score += 10;
    reasons.push('Instalação crítica: hospital');
  }

  if (elevator?.status === 'parado' || metadata.elevatorStopped) {
    score += 8;
    reasons.push('Elevador totalmente inoperante');
  } else if (metadata.partialFailure) {
    score += 4;
    reasons.push('Falha parcial de funcionamento');
  }

  if (elapsedMinutes >= 60) score += 8;
  else if (elapsedMinutes >= 30) score += 4;
  else if (elapsedMinutes >= 10) score += 2;

  reasons.push(`Ocorrência aberta há ${formatElapsedTime(elapsedMinutes)}`);

  if (metadata.recurrence) {
    score += 5;
    reasons.push('Reincidência recente no equipamento');
  }

  const normalizedScore = Math.min(100, Math.max(0, score));
  return {
    score: normalizedScore,
    classification: classifyPriority(normalizedScore),
    reasons,
    elapsedMinutes,
  };
};
