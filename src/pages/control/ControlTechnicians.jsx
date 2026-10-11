import { useState } from 'react';
import ProfileAvatar from '../../components/ProfileAvatar';
import StatusBadge from '../../components/StatusBadge';
import { displayStatus, statusToneClass } from '../../utils/presentation';
import HopFilterBar from '../../components/HopFilterBar';

const filters = [
  ['all', 'Todos'],
  ['disponível', 'Disponíveis'],
  ['em deslocamento', 'Em deslocamento'],
  ['em atendimento', 'Em atendimento'],
  ['indisponível', 'Indisponíveis'],
];

export default function ControlTechnicians({ technicians, onSelectTechnician }) {
  const [filter, setFilter] = useState('all');
  const available = technicians.filter((t) => t.status === 'disponível').length;
  const sortedTechnicians = [...technicians].sort((a, b) => {
    if (a.id === 'TEC-010') return -1;
    if (b.id === 'TEC-010') return 1;
    return a.name.localeCompare(b.name);
  });
  const filtered = sortedTechnicians.filter(
    (technician) => filter === 'all' || technician.status === filter
  );

  return (
    <>
      <header className="page-header">
        <div>
          <p className="page-header__subtitle">Operação de campo</p>
          <h1 className="page-header__title">Equipe de Campo</h1>
        </div>
        <span className="hop-badge px-3 py-2">{available} disponíveis</span>
      </header>

      <HopFilterBar label="Filtrar técnicos por status" quick={filters} active={filter} onQuickChange={setFilter} count={filtered.length} total={technicians.length} hasFilters={filter !== 'all'} onClear={() => setFilter('all')} />

      <section className="control-technician-grid" aria-label="Equipe de campo">
        {filtered.map((technician) => {
          const toneClass = statusToneClass(technician.status);
          return (
            <button
              key={technician.id}
              className={`control-elevator-card control-technician-card ${toneClass}`}
              type="button"
              onClick={() => onSelectTechnician(technician.id)}
              aria-label={`Ver perfil e rotas de ${technician.name}, status ${displayStatus(technician.status)}`}
            >
              <div className="control-elevator-card__header">
                <span className="control-elevator-card__header-left">
                  <ProfileAvatar name={technician.name} src={technician.avatar} size="md" className="control-technician-card__avatar" decorative />
                  <StatusBadge value={technician.status} />
                </span>
                <span className="control-elevator-card__menu" aria-hidden="true">
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor"><circle cx="8" cy="4" r="1.5" /><circle cx="8" cy="10" r="1.5" /><circle cx="8" cy="16" r="1.5" /></svg>
                </span>
              </div>

              <div className="control-elevator-card__main">
                <h2 className="control-elevator-card__client control-technician-card__name" title={technician.name}>{technician.name}</h2>
                <p className="control-elevator-card__title control-technician-card__specialty" title={technician.specialty}>{technician.specialty}</p>
              </div>

              <div className="control-elevator-card__footer">
                <span className="control-elevator-card__code">{technician.id}</span>
                <span className="control-technician-card__footer-action">Ver perfil →</span>
              </div>
            </button>
          );
        })}
      </section>
    </>
  );
}
