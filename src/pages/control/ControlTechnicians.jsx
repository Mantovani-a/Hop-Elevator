import { useState } from 'react';
import ProfileAvatar from '../../components/ProfileAvatar';
import StatusBadge from '../../components/StatusBadge';
import { statusToneClass } from '../../utils/presentation';

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

      <section className="d-flex flex-wrap gap-2 mt-4" aria-label="Filtrar técnicos por status">
        {filters.map(([id, label]) => (
          <button
            className={`btn btn-sm rounded-pill ${filter === id ? 'btn-primary' : 'btn-outline-secondary'}`}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            key={id}
          >
            {label}
          </button>
        ))}
      </section>

      <section className="control-technician-grid row g-4 mt-2">
        {filtered.map((technician) => {
          const toneClass = statusToneClass(technician.status);

          return (
            <div className="col-12 col-sm-6 col-lg-4 col-xl-3" key={technician.id}>
              <button
                className={`control-technician-card app-card ${toneClass}`}
                type="button"
                onClick={() => onSelectTechnician(technician.id)}
                aria-label={`Ver detalhes do técnico ${technician.name}, status ${technician.status}`}
              >
                <header className="control-technician-card__header">
                  <div className="control-technician-card__identity">
                    <ProfileAvatar name={technician.name} src={technician.avatar} size="md" decorative />
                    <div>
                      <h2 className="control-technician-card__name">{technician.name}</h2>
                      <p className="control-technician-card__specialty">{technician.specialty}</p>
                    </div>
                  </div>
                  <div className="control-technician-card__badge-wrap">
                    <StatusBadge value={technician.status} />
                  </div>
                </header>

                <dl className="control-technician-card__metrics">
                  <div>
                    <dt>Região</dt>
                    <dd>{technician.region}</dd>
                  </div>
                  <div>
                    <dt>Atendimento Atual</dt>
                    <dd>{technician.currentOccurrence?.protocol || 'Sem chamado'}</dd>
                  </div>
                  <div>
                    <dt>Distância</dt>
                    <dd>{technician.distanceKm.toFixed(1).replace('.', ',')} km</dd>
                  </div>
                </dl>

                <div className="control-technician-card__footer">
                  <span>Ver perfil e rotas →</span>
                </div>
              </button>
            </div>
          );
        })}
      </section>
    </>
  );
}
