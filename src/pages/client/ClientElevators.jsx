import ClientElevatorCard from '../../components/client/ClientElevatorCard';

export default function ClientElevators({ displayedElevators }) {
  return (
    <>
      <header className="page-header mb-4">
        <div>
          <p className="page-header__subtitle">Equipamentos cadastrados</p>
          <h1 className="page-header__title">Elevadores</h1>
        </div>
      </header>
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {displayedElevators.map((elevator) => (
          <div className="col" key={elevator.id}>
            <ClientElevatorCard
              elevator={elevator}
              activeCall={elevator.activeCall}
              onSupport={(id) => { window.location.hash = `/client/support/${id}`; }}
              onViewCall={(callId) => { window.location.hash = `/client/call/${callId}`; }}
            />
          </div>
        ))}
      </div>
    </>
  );
}
