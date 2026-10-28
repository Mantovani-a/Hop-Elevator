import React from 'react';

export default function Elevator2DViewer({ modelCode = 'GEN2-ROB', status = 'OK' }) {
  const isEmergency = status === 'EMERGENCY' || status === 'HIGH';
  const isWarning = status === 'WARNING' || status === 'MEDIUM';

  const cableColor = isEmergency ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8';
  const cabinColor = isEmergency ? '#fee2e2' : '#f1f5f9';
  const cabinBorder = isEmergency ? '#b91c1c' : '#475569';

  return (
    <div className="card border-0 shadow-sm p-3 mb-3 bg-white rounded-3">
      <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
        <span className="small text-muted fw-bold">ESQUEMA TÉCNICO 2D: {modelCode}</span>
        <span className={`badge ${isEmergency ? 'bg-danger' : isWarning ? 'bg-warning text-dark' : 'bg-success'}`}>
          {isEmergency ? 'ALERTA CRÍTICO' : isWarning ? 'ATENÇÃO' : 'OPERACIONAL'}
        </span>
      </div>

      <div className="text-center py-2" style={{ backgroundColor: '#0f172a', borderRadius: '8px' }}>
        <svg viewBox="0 0 300 220" style={{ width: '100%', maxHeight: '200px' }}>
          {/* Caixa de Corrida (Torre) */}
          <rect x="70" y="10" width="160" height="200" fill="#1e293b" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
          
          {/* Guias Laterais */}
          <line x1="85" y1="10" x2="85" y2="210" stroke="#64748b" strokeWidth="3" />
          <line x1="215" y1="10" x2="215" y2="210" stroke="#64748b" strokeWidth="3" />

          {/* Motor de Tração no Topo */}
          <rect x="120" y="15" width="60" height="22" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="150" y="30" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold">MOTOR SKYMOTION</text>

          {/* Cabos de Aço */}
          <line x1="135" y1="37" x2="135" y2="85" stroke={cableColor} strokeWidth="2" />
          <line x1="165" y1="37" x2="165" y2="85" stroke={cableColor} strokeWidth="2" />

          {/* Cabine */}
          <rect x="105" y="85" width="90" height="75" rx="3" fill={cabinColor} stroke={cabinBorder} strokeWidth="2.5" />
          
          {/* Portas da Cabine */}
          <line x1="150" y1="85" x2="150" y2="160" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2 2" />
          <rect x="115" y="95" width="30" height="55" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
          <rect x="155" y="95" width="30" height="55" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
          <text x="150" y="130" fill="#0f172a" fontSize="10" textAnchor="middle" fontWeight="bold">CABINE</text>

          {/* Contrapeso */}
          <rect x="222" y="110" width="18" height="60" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
          <text x="231" y="145" fill="#f8fafc" fontSize="7" textAnchor="middle" transform="rotate(-90 231 145)">CONTRAPESO</text>

          {/* Sensores de Pavimento */}
          <circle cx="85" cy="50" r="3" fill="#22c55e" />
          <circle cx="85" cy="120" r="3" fill={isEmergency ? "#ef4444" : "#22c55e"} />
          <circle cx="85" cy="190" r="3" fill="#22c55e" />
        </svg>
      </div>

      <div className="d-flex justify-content-around text-center mt-2 small text-muted">
        <div><span className="fw-bold d-block text-dark">Tracionador</span> Otis SkyMotion</div>
        <div><span className="fw-bold d-block text-dark">Sensor Porta</span> Fotoelétrico</div>
        <div><span className="fw-bold d-block text-dark">Freio Safeties</span> Eletromecânico</div>
      </div>
    </div>
  );
}
