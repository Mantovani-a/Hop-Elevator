import { statusToneClass } from '../utils/presentation';

export default function StatusBadge({ value, type = 'status' }) {
  const isSeverity = type === 'severity';
  const toneClass = statusToneClass(value);

  return (
    <span className={`hop-badge hop-badge--${isSeverity ? 'severity' : 'status'} ${toneClass}`}>
      <span className="hop-badge__marker" aria-hidden="true">{isSeverity ? '!' : '●'}</span>
      {value}
    </span>
  );
}
