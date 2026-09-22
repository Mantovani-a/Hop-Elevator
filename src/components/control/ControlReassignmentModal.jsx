import { useState } from 'react';
import Modal from '../Modal';
import ProfileAvatar from '../ProfileAvatar';
import StatusBadge from '../StatusBadge';

export default function ControlReassignmentModal({ occurrence, technicians, onCancel, onConfirm }) {
  const [selectedId, setSelectedId] = useState('');

  if (!occurrence) return null;
  const selected = technicians.find((technician) => technician.id === selectedId);

  return (
    <Modal
      isOpen={Boolean(occurrence)}
      onClose={onCancel}
      title="Reatribuir técnico"
      eyebrow={occurrence.protocol}
      titleId="reassignment-title"
    >
      <p>Selecione um técnico disponível para assumir esta ocorrência.</p>
      <div className="control-reassignment-list">
        {technicians.map((technician) => <button key={technician.id} className={selectedId === technician.id ? 'is-selected' : ''} type="button" onClick={() => setSelectedId(technician.id)}><ProfileAvatar name={technician.name} src={technician.avatar} size="md" className="control-reassignment-avatar" decorative /><span><strong>{technician.name}</strong><small>{technician.region} · {technician.specialty}</small></span><span><StatusBadge value={technician.status} /><small>{technician.distanceKm.toFixed(1).replace('.', ',')} km</small></span></button>)}
      </div>
      {selected && <div className="control-confirm-copy" role="status">Reatribuir {occurrence.protocol} de {occurrence.technician?.name || 'sem técnico'} para <strong>{selected.name}</strong>?</div>}
      <footer><button className="btn btn-outline-secondary" type="button" onClick={onCancel}>Cancelar</button><button className="btn btn-primary" type="button" disabled={!selected} onClick={() => onConfirm(selected.id)}>Confirmar reatribuição</button></footer>
    </Modal>
  );
}
