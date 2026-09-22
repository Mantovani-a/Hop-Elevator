/**
 * Contractual Service Level Agreement (SLA) response thresholds in minutes.
 * - crítica: 45 min (emergencies, trapped passengers)
 * - alta: 120 min (high operational disruptions)
 * - atenção: 240 min (preventive / partial failures)
 * - baixa: 480 min (standard or cosmetic requests)
 */
export const SLA_TARGETS_MINUTES = {
  crítica: 45,
  alta: 120,
  atenção: 240,
  baixa: 480,
};

/**
 * Formats a duration in minutes into a human-friendly string (e.g., '45 min', '1h 30min').
 * @param {number} minutes
 * @returns {string}
 */
const formatDuration = (minutes) => {
  const abs = Math.abs(minutes);
  if (abs < 60) return `${abs} min`;
  const hours = Math.floor(abs / 60);
  const remaining = abs % 60;
  return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
};

/**
 * @typedef {Object} SlaStatusResult
 * @property {number} targetMinutes - Contractual maximum minutes.
 * @property {string} targetFormatted - Formatted target string (e.g. '45 min').
 * @property {number} elapsedMinutes - Minutes elapsed since creation.
 * @property {number} remainingMinutes - Minutes until breach (negative if breached).
 * @property {boolean} isBreached - Whether SLA deadline was violated.
 * @property {boolean} isNearBreach - Warning state when <= 20% of window remains.
 * @property {boolean} isResolved - Whether the incident is closed.
 * @property {'success'|'warning'|'critical'} tone - UI indicator tone.
 * @property {string} label - Human-readable SLA status title.
 * @property {string} detail - Explanatory breakdown of SLA state.
 * @property {string} shortStatus - Compact badge text.
 */

/**
 * Evaluates the SLA adherence and deadline posture for an occurrence.
 *
 * @param {Object} occurrence - Occurrence with time, severity/priority, and optional completedAt.
 * @param {Date} [now=new Date()] - Reference date for time elapsed calculation.
 * @returns {SlaStatusResult|null}
 */
export const getSlaStatus = (occurrence, now = new Date()) => {
  if (!occurrence) return null;

  const severity = occurrence.priority?.classification || occurrence.severity || 'baixa';
  const targetMinutes = SLA_TARGETS_MINUTES[severity] ?? SLA_TARGETS_MINUTES.baixa;

  const openedAt = occurrence.time ? new Date(occurrence.time) : new Date();
  const closedAt = occurrence.completedAt ? new Date(occurrence.completedAt) : null;
  const isResolved = Boolean(closedAt && !Number.isNaN(closedAt.getTime()));
  const referenceTime = isResolved ? closedAt : now;

  const elapsedMinutes = Math.max(0, Math.floor((referenceTime.getTime() - openedAt.getTime()) / 60000));
  const remainingMinutes = targetMinutes - elapsedMinutes;
  const isBreached = remainingMinutes < 0;
  const isNearBreach = !isBreached && remainingMinutes <= Math.max(15, Math.round(targetMinutes * 0.2));

  const targetFormatted = formatDuration(targetMinutes);

  let tone = 'success';
  let label = 'No prazo';

  if (isBreached) {
    tone = 'critical';
    label = isResolved ? 'SLA Excedido no encerramento' : 'SLA Excedido';
  } else if (isNearBreach) {
    tone = 'warning';
    label = 'Próximo do limite de SLA';
  }

  const detail = isBreached
    ? `Excedido em ${formatDuration(remainingMinutes)} (Meta contratual: ${targetFormatted})`
    : `Restam ${formatDuration(remainingMinutes)} (Meta contratual: ${targetFormatted})`;

  const shortStatus = isBreached
    ? `SLA −${formatDuration(remainingMinutes)}`
    : `SLA ${formatDuration(remainingMinutes)}`;

  return {
    targetMinutes,
    targetFormatted,
    elapsedMinutes,
    remainingMinutes,
    isBreached,
    isNearBreach,
    isResolved,
    tone,
    label,
    detail,
    shortStatus,
  };
};
