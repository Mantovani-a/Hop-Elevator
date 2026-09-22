import StatusBadge from '../../components/StatusBadge';
import ProfileAvatar from '../../components/ProfileAvatar';

export default function OperatorProfile({ technician, technicianStatus }) {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="page-header__subtitle">Dados demonstrativos</p>
          <h1 className="page-header__title">Perfil</h1>
        </div>
      </header>
      <section className="app-card p-4 p-md-5">
        <div className="d-flex flex-wrap align-items-center gap-4 pb-4 border-bottom"><ProfileAvatar name={technician.name} src={technician.avatar} size="lg" decorative /><div className="flex-grow-1"><h2 className="fs-4 mb-1" style={{ color: 'var(--color-text)' }}>{technician.name}</h2><p className="mb-3 text-secondary" style={{ fontSize: '0.9rem' }}>{technician.employeeId}</p><StatusBadge value={technicianStatus} /></div></div>
        <dl className="d-grid gap-4 mt-4 pt-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div><dt className="detail-item-label">Região</dt><dd className="detail-item-value">{technician.region}</dd></div>
          <div><dt className="detail-item-label">Turno</dt><dd className="detail-item-value">{technician.shift}</dd></div>
          <div><dt className="detail-item-label">Atendimentos realizados</dt><dd className="detail-item-value">{technician.completedServices}</dd></div>
          <div><dt className="detail-item-label">Chamados concluídos</dt><dd className="detail-item-value">{technician.completionRate}%</dd></div>
          <div style={{ gridColumn: '1 / -1' }}><dt className="detail-item-label">Especialidades</dt><dd className="mb-0"><ul className="list-unstyled d-flex flex-wrap gap-2 m-0">{technician.specialties.map((specialty) => <li className="px-3 py-2 rounded-pill text-primary bg-primary bg-opacity-10 fw-bold" style={{ fontSize: '0.82rem' }} key={specialty}>{specialty}</li>)}</ul></dd></div>
        </dl>
      </section>
    </>
  );
}
