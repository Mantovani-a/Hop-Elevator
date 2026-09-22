import { useState } from 'react';
import Modal from '../Modal';
import ProfileAvatar from '../ProfileAvatar';
import StatusBadge from '../StatusBadge';

export default function ControlPartResumeModal({ occurrence, technicians, onCancel, onConfirm }) {
  const [pickupLocation, setPickupLocation] = useState('Central / Estoque OTIS');
  const [technicianId, setTechnicianId] = useState('');
  const [validation, setValidation] = useState('');

  if (!occurrence) return null;

  const submit = (event) => {
    event.preventDefault();
    if (!pickupLocation.trim() || !technicianId) return setValidation('Informe o local de retirada e selecione o técnico responsável.');
    onConfirm({ pickupLocation: pickupLocation.trim(), technicianId });
  };

  return (
    <Modal
      isOpen={Boolean(occurrence)}
      onClose={onCancel}
      title="Peça disponível — retomar atendimento"
      eyebrow={occurrence.protocol}
      titleId="part-resume-title"
    >
      <form onSubmit={submit}>
        <div className="control-part-summary"><strong>{occurrence.partRequest?.part} ×{occurrence.partRequest?.quantity}</strong><span>Diagnóstico inicial por {occurrence.partRequest?.diagnosedBy?.name}</span><p>{occurrence.partRequest?.diagnosis}</p></div>
        <div className="mb-4"><label className="form-label fw-bold" htmlFor="pickup-location">Local de retirada</label><input id="pickup-location" className="form-control" maxLength="160" value={pickupLocation} onChange={(event) => setPickupLocation(event.target.value)} /></div>
        <fieldset className="border-0 p-0"><legend className="fs-6 fw-bold mb-3">Técnico responsável pelo retorno</legend><div className="control-reassignment-list">{technicians.map((technician) => <button key={technician.id} className={technicianId === technician.id ? 'is-selected' : ''} type="button" onClick={() => setTechnicianId(technician.id)}><ProfileAvatar name={technician.name} src={technician.avatar} size="md" decorative /><span><strong>{technician.name}</strong><small>{technician.specialty} · {technician.id === occurrence.partRequest?.diagnosedBy?.id ? 'diagnóstico inicial' : 'novo responsável'}</small></span><span><StatusBadge value={technician.status} /></span></button>)}</div></fieldset>
        {validation && <p className="text-danger fw-bold mb-0" role="alert">{validation}</p>}
        <footer><button className="btn btn-outline-secondary" type="button" onClick={onCancel}>Cancelar</button><button className="btn btn-primary" type="submit">Disponibilizar e atribuir</button></footer>
      </form>
    </Modal>
  );
}
