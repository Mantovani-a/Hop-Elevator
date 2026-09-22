import { useState } from 'react';
import ProfileAvatar from '../../components/ProfileAvatar';
import StatusBadge from '../../components/StatusBadge';

const filters = [
  ['all', 'Todos'],
  ['disponível', 'Disponíveis'],
  ['em deslocamento', 'Em deslocamento'],
  ['em atendimento', 'Em atendimento'],
  ['indisponível', 'Indisponíveis']
];

export default function ControlTechnicians({ technicians, onSelectTechnician }) {
  const [filter, setFilter] = useState('all');
  const available = technicians.filter((t) => t.status === 'disponível').length;
  const sortedTechnicians = [...technicians].sort((a, b) => {
    if (a.id === 'TEC-010') return -1;
    if (b.id === 'TEC-010') return 1;
    return a.name.localeCompare(b.name);
  });
  const filtered = sortedTechnicians.filter((technician) => filter === 'all' || technician.status === filter);

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
      
      <section className="row g-4 mt-2">
        {filtered.map((technician) => (
          <div className="col-12 col-sm-6 col-lg-4 col-xl-3" key={technician.id}>
            <button
              className="btn btn-link text-decoration-none text-start p-3 w-100 h-100 app-card position-relative d-flex flex-column align-items-stretch"
              style={{ minHeight: '235px', borderLeft: technician.id === 'TEC-010' ? '4px solid var(--color-primary-action)' : '1px solid var(--color-border)', color: 'var(--color-text)' }}
              type="button"
              onClick={() => onSelectTechnician(technician.id)}
            >
              <header className="d-flex align-items-start mb-3 w-100" style={{ paddingRight: '6.5rem' }}>
                <div className="d-flex align-items-center gap-3">
                  <ProfileAvatar name={technician.name} src={technician.avatar} size="md" decorative />
                  <div><h2 className="fs-5 mb-1" style={{ color: 'var(--color-text)' }}>{technician.name}</h2><p className="text-secondary mb-0" style={{ fontSize: '0.78rem' }}>{technician.specialty}</p></div>
                </div>
                <span className="position-absolute top-0 end-0 mt-3 me-3"><StatusBadge value={technician.status} /></span>
              </header>
              <dl className="d-grid gap-3 mt-auto pt-3 border-top m-0 w-100" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                <div><dt className="text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.66rem' }}>Região</dt><dd className="fw-bold mb-0" style={{ color: 'var(--color-text)', fontSize: '0.8rem' }}>{technician.region}</dd></div>
                <div><dt className="text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.66rem' }}>Atendimento atual</dt><dd className="fw-bold mb-0" style={{ color: 'var(--color-text)', fontSize: '0.8rem' }}>{technician.currentOccurrence?.protocol || 'Sem chamado'}</dd></div>
                <div><dt className="text-secondary fw-bold text-uppercase mb-1" style={{ fontSize: '0.66rem' }}>Distância</dt><dd className="fw-bold mb-0" style={{ color: 'var(--color-text)', fontSize: '0.8rem' }}>{technician.distanceKm.toFixed(1).replace('.', ',')} km</dd></div>
              </dl>
              <small className="d-block mt-3 text-primary fw-bold" style={{ fontSize: '0.76rem' }}>Ver detalhes <span aria-hidden="true">→</span></small>
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
