import React from 'react';
import Elevator2DViewer from './Elevator2DViewer';

/**
 * Visualizador técnico do elevador (substituição 2D para a Sprint 2 da Fase 7).
 * Atende às diretrizes acadêmicas com esquema vetorial leve e responsivo.
 */
export default function Elevator3DViewer({ diagnosis, severity }) {
  return (
    <div className="elevator-schematic-wrapper py-2">
      <Elevator2DViewer status={severity?.toUpperCase() || 'OK'} />
    </div>
  );
}
