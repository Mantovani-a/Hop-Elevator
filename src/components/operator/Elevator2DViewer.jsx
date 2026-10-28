import React from 'react';

export default function Elevator2DViewer({ modelCode = 'GEN2-ROB', status = 'OK' }) {
  const isEmergency = status === 'EMERGENCY' || status === 'HIGH' || status === 'CRÍTICA';
  const isWarning = status === 'WARNING' || status === 'MEDIUM' || status === 'ATENÇÃO';

  const cableColor = isEmergency 
    ? 'var(--color-severity-critical)' 
    : isWarning 
      ? 'var(--color-severity-attention)' 
      : 'var(--color-primary-action)';

  return (
    <div 
      className="p-3" 
      style={{ 
        backgroundColor: 'var(--color-surface-soft)', 
        border: '1px solid var(--color-card-border)',
        borderRadius: 'var(--radius-md)',
        transition: 'background-color 0.2s ease, border-color 0.2s ease'
      }}
    >
      <div 
        className="d-flex justify-content-between align-items-center mb-3 pb-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <span className="small fw-semibold" style={{ color: 'var(--color-text-muted)' }}>
          DIAGRAMA TÉCNICO VETORIAL: <span style={{ color: 'var(--color-text)' }}>{modelCode}</span>
        </span>
        <span className={`badge ${isEmergency ? 'bg-danger' : isWarning ? 'bg-warning text-dark' : 'bg-success'}`}>
          {isEmergency ? 'ALERTA CRÍTICO' : isWarning ? 'ATENÇÃO' : 'OPERACIONAL'}
        </span>
      </div>

      <div 
        className="text-center py-2" 
        style={{ 
          backgroundColor: 'var(--color-background)', 
          borderRadius: 'var(--radius-sm)', 
          border: '1px solid var(--color-border)',
          transition: 'background-color 0.2s ease'
        }}
      >
        <svg viewBox="0 0 300 220" style={{ width: '100%', maxHeight: '210px' }}>
          {/* Caixa de Corrida (Torre) */}
          <rect 
            x="70" 
            y="10" 
            width="160" 
            height="200" 
            fill="var(--color-surface)" 
            stroke="var(--color-border)" 
            strokeWidth="1.5" 
            strokeDasharray="4 4" 
          />
          
          {/* Guias Laterais de Deslocamento */}
          <line x1="85" y1="10" x2="85" y2="210" stroke="var(--color-border)" strokeWidth="2.5" />
          <line x1="215" y1="10" x2="215" y2="210" stroke="var(--color-border)" strokeWidth="2.5" />

          {/* Motor de Tração no Topo */}
          <rect 
            x="115" 
            y="14" 
            width="70" 
            height="22" 
            rx="4" 
            fill="var(--color-primary-action)" 
            stroke="var(--color-primary-muted)" 
            strokeWidth="1.5" 
          />
          <text 
            x="150" 
            y="29" 
            fill="var(--color-on-primary)" 
            fontSize="8" 
            textAnchor="middle" 
            fontWeight="bold" 
            letterSpacing="0.5"
          >
            MOTOR SKYMOTION
          </text>

          {/* Cabos de Tração */}
          <line x1="135" y1="36" x2="135" y2="85" stroke={cableColor} strokeWidth="2.5" />
          <line x1="165" y1="36" x2="165" y2="85" stroke={cableColor} strokeWidth="2.5" />

          {/* Cabine do Elevador */}
          <rect 
            x="105" 
            y="85" 
            width="90" 
            height="75" 
            rx="3" 
            fill={isEmergency ? 'var(--color-severity-critical-soft)' : 'var(--color-surface-soft)'} 
            stroke={isEmergency ? 'var(--color-severity-critical)' : 'var(--color-primary-action)'} 
            strokeWidth="2" 
          />
          
          {/* Portas da Cabine */}
          <line x1="150" y1="85" x2="150" y2="160" stroke="var(--color-border)" strokeWidth="1.5" strokeDasharray="2 2" />
          <rect x="115" y="95" width="30" height="55" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1" />
          <rect x="155" y="95" width="30" height="55" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1" />
          <text 
            x="150" 
            y="128" 
            fill="var(--color-text)" 
            fontSize="10" 
            textAnchor="middle" 
            fontWeight="bold"
          >
            CABINE
          </text>

          {/* Contrapeso */}
          <rect 
            x="222" 
            y="105" 
            width="18" 
            height="65" 
            rx="2" 
            fill="var(--color-surface-hover)" 
            stroke="var(--color-border)" 
            strokeWidth="1.2" 
          />
          <text 
            x="231" 
            y="142" 
            fill="var(--color-text-muted)" 
            fontSize="7" 
            textAnchor="middle" 
            transform="rotate(-90 231 142)"
          >
            CONTRAPESO
          </text>

          {/* Sensores de Pavimento */}
          <circle cx="85" cy="50" r="3.5" fill="var(--color-severity-low)" />
          <circle cx="85" cy="120" r="3.5" fill={isEmergency ? "var(--color-severity-critical)" : "var(--color-severity-low)"} />
          <circle cx="85" cy="190" r="3.5" fill="var(--color-severity-low)" />
        </svg>
      </div>

      <div 
        className="d-flex justify-content-around text-center mt-3 pt-2 small"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <div>
          <span className="fw-bold d-block" style={{ color: 'var(--color-text)' }}>Otis SkyMotion</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Tracionador</span>
        </div>
        <div>
          <span className="fw-bold d-block" style={{ color: 'var(--color-text)' }}>Fotoelétrico</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sensor de Porta</span>
        </div>
        <div>
          <span className="fw-bold d-block" style={{ color: 'var(--color-text)' }}>Eletromecânico</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Freio Safeties</span>
        </div>
      </div>
    </div>
  );
}
