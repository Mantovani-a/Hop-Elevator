/**
 * Definições compartilhadas das regiões técnicas do elevador — fonte única de verdade
 * para o painel esquemático 2D e inspeção de subsistemas.
 *
 * Cada região possui:
 *  - id:        chave interna usada nos arrays de suspectedRegions
 *  - label:     nome legível exibido para a operação e o técnico
 *  - meshNames: identificadores técnicos dos componentes traduzidos por modelNameTranslator
 */
export const elevatorRegions = [
  { id: 'machine', label: 'Máquina de Tração', meshNames: ['Maquinario_Elevador', 'Apoio_Tração', 'Ponte_Tração1'] },
  { id: 'pulleys', label: 'Polias', meshNames: ['Polia_Tração', 'Polia_Tração2', 'Polia_Contrapeso'] },
  { id: 'belts', label: 'Cabos', meshNames: ['Corda', 'Corda2', 'Cabo_Contrapeso'] },
  { id: 'governor', label: 'Freio de Emergência', meshNames: ['FreioDeEmergencia1', 'FreioDeEmergencia2'] },
  { id: 'control', label: 'Quadro de Controle', meshNames: ['Sistema de Controle', 'Maquina_Controle', 'Painel de Controle_Superior', 'Painel de Controle_Inferior'] },
  { id: 'rails', label: 'Guias do Elevador', meshNames: ['Trilhos_Guias1', 'Trilhos_Guias2', 'Trilhos_Guias3'] },
  { id: 'counterweight', label: 'Contrapeso', meshNames: ['Contrapeso', 'Apoio_Contrapeso', 'Trilhos_Guia_Contrapeso1', 'Trilhos_Guia_Contrapeso2', 'Trilhos_Guia_Contrapeso3'] },
  { id: 'cabin', label: 'Cabine', meshNames: ['Elevador'] },
  { id: 'doorOperator', label: 'Operador de Portas', meshNames: ['Operador_Portas'] },
  { id: 'doors', label: 'Portas', meshNames: ['Porta1', 'Porta2'] },
  { id: 'sensors', label: 'Sensores', meshNames: ['Letreiro1', 'Letreiro2'] },
  { id: 'buffers', label: 'Amortecedores', meshNames: ['Amortecedor_Elevador', 'Amortecedor_Contrapeso'] },
  { id: 'base', label: 'Poço', meshNames: ['Poço_Pit'] },
];
