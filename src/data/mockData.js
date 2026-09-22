import { getProfilePhotoPath } from '../utils/profileAvatar.js';

export const technicians = [
  { id: 'TEC-001', name: 'Ana Ribeiro', status: 'disponível', specialty: 'Portas e acessos', region: 'Centro', distanceKm: 2.4, currentService: null },
  { id: 'TEC-002', name: 'Bruno Martins', status: 'em atendimento', specialty: 'Resgate e emergência', region: 'Zona Sul', distanceKm: 5.8, currentService: 'OCC-2026-001' },
  { id: 'TEC-003', name: 'Carla Mendes', status: 'em deslocamento', specialty: 'Sistemas elétricos', region: 'Zona Oeste', distanceKm: 8.1, currentService: 'OCC-2026-006' },
  { id: 'TEC-004', name: 'Diego Alves', status: 'disponível', specialty: 'Manutenção preventiva', region: 'Zona Norte', distanceKm: 3.7, currentService: null },
  { id: 'TEC-005', name: 'Elisa Nogueira', status: 'em atendimento', specialty: 'Comandos e painéis', region: 'Centro', distanceKm: 1.9, currentService: 'OCC-2026-004' },
  { id: 'TEC-006', name: 'Felipe Rocha', status: 'indisponível', specialty: 'Mecânica geral', region: 'Zona Leste', distanceKm: 12.6, currentService: null },
  { id: 'TEC-007', name: 'Gabriela Lima', status: 'disponível', specialty: 'Resgate e emergência', region: 'Zona Sul', distanceKm: 6.3, currentService: null },
  { id: 'TEC-008', name: 'Henrique Costa', status: 'disponível', specialty: 'Sistemas elétricos', region: 'ABC Paulista', distanceKm: 9.4, currentService: null },
  { id: 'TEC-009', name: 'Isabela Freitas', status: 'em atendimento', specialty: 'Portas e acessos', region: 'Zona Oeste', distanceKm: 4.6, currentService: 'OCC-2026-012' },
  { id: 'TEC-010', name: 'João Carlos', status: 'disponível', specialty: 'Resgate e manutenção preventiva', region: 'Zona Norte', distanceKm: 2.4, currentService: null },
  { id: 'TEC-011', name: 'Karen Oliveira', status: 'indisponível', specialty: 'Comandos e painéis', region: 'Centro', distanceKm: 10.8, currentService: null },
  { id: 'TEC-012', name: 'Lucas Barros', status: 'em deslocamento', specialty: 'Mecânica geral', region: 'Zona Leste', distanceKm: 5.1, currentService: 'OCC-2026-015' },
].map((technician) => ({
  ...technician,
  avatar: getProfilePhotoPath(technician.name, 'operators'),
}));

export const clients = [
  { id: 'CLI-001', name: 'Hospital Santa Helena', type: 'Hospital', address: 'Av. Paulista, 1450 — Bela Vista', contact: 'Mariana Alves' },
  { id: 'CLI-002', name: 'Edifício Nexus Corporate', type: 'Prédio comercial', address: 'R. Funchal, 520 — Vila Olímpia', contact: 'Rafael Siqueira' },
  { id: 'CLI-003', name: 'Condomínio Parque das Flores', type: 'Condomínio', address: 'R. das Acácias, 88 — Morumbi', contact: 'Sônia Matos' },
  { id: 'CLI-004', name: 'Hotel Horizonte Paulista', type: 'Hotel', address: 'Al. Santos, 960 — Jardins', contact: 'Carlos Tavares' },
  { id: 'CLI-005', name: 'Shopping Vila Central', type: 'Shopping', address: 'Av. Cruzeiro do Sul, 3100 — Santana', contact: 'Beatriz Campos' },
  { id: 'CLI-006', name: 'Hospital Infantil Bem-Estar', type: 'Hospital', address: 'R. Vergueiro, 2210 — Vila Mariana', contact: 'Dr. Paulo Neri' },
  { id: 'CLI-007', name: 'Centro Empresarial Atlas', type: 'Prédio comercial', address: 'Av. Rebouças, 2850 — Pinheiros', contact: 'Nádia Reis' },
  { id: 'CLI-008', name: 'Residencial Bosque Alto', type: 'Condomínio', address: 'R. Dona Tecla, 410 — Guarulhos', contact: 'Eduardo Viana' },
  { id: 'CLI-009', name: 'Hotel Estação Premium', type: 'Hotel', address: 'R. dos Timbiras, 540 — República', contact: 'Patrícia Luz' },
  { id: 'CLI-010', name: 'Shopping Pátio Leste', type: 'Shopping', address: 'Av. Aricanduva, 5555 — Aricanduva', contact: 'André Meireles' },
].map((client) => ({
  ...client,
  contactAvatar: getProfilePhotoPath(client.contact, 'clients'),
}));

const relTime = (minutesAgo, base = new Date()) =>
  new Date(base.getTime() - minutesAgo * 60 * 1000).toISOString();

const relDate = (daysAgo, base = new Date()) => {
  const d = new Date(base.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
};

export const createMockElevators = (now = new Date()) => [
  { id: 'ELV-001', identification: 'Torre A • Elevador 01', clientId: 'CLI-001', model: 'Linha hospitalar H-01', address: 'Av. Paulista, 1450 — Bloco A', status: 'operando', lastMaintenance: relDate(21, now) },
  { id: 'ELV-002', identification: 'Torre A • Elevador 02', clientId: 'CLI-001', model: 'Linha hospitalar H-01', address: 'Av. Paulista, 1450 — Bloco A', status: 'em atendimento', lastMaintenance: relDate(22, now) },
  { id: 'ELV-003', identification: 'Torre B • Elevador serviço', clientId: 'CLI-001', model: 'Carga assistida C-02', address: 'Av. Paulista, 1450 — Bloco B', status: 'operando', lastMaintenance: relDate(25, now) },
  { id: 'ELV-004', identification: 'Nexus • Cabine 01', clientId: 'CLI-002', model: 'Passageiros P-12', address: 'R. Funchal, 520 — Torre única', status: 'operando', lastMaintenance: relDate(28, now) },
  { id: 'ELV-005', identification: 'Nexus • Cabine 02', clientId: 'CLI-002', model: 'Passageiros P-12', address: 'R. Funchal, 520 — Torre única', status: 'parado', lastMaintenance: relDate(28, now) },
  { id: 'ELV-006', identification: 'Bloco Ipê • Elevador social', clientId: 'CLI-003', model: 'Residencial R-08', address: 'R. das Acácias, 88 — Bloco Ipê', status: 'operando', lastMaintenance: relDate(35, now) },
  { id: 'ELV-007', identification: 'Bloco Cedro • Elevador social', clientId: 'CLI-003', model: 'Residencial R-08', address: 'R. das Acácias, 88 — Bloco Cedro', status: 'atenção', lastMaintenance: relDate(35, now) },
  { id: 'ELV-008', identification: 'Horizonte • Elevador hóspedes 01', clientId: 'CLI-004', model: 'Passageiros P-10', address: 'Al. Santos, 960 — Lobby', status: 'operando', lastMaintenance: relDate(19, now) },
  { id: 'ELV-009', identification: 'Horizonte • Elevador hóspedes 02', clientId: 'CLI-004', model: 'Passageiros P-10', address: 'Al. Santos, 960 — Lobby', status: 'em atendimento', lastMaintenance: relDate(19, now) },
  { id: 'ELV-010', identification: 'Vila Central • Elevador panorâmico', clientId: 'CLI-005', model: 'Panorâmico V-04', address: 'Av. Cruzeiro do Sul, 3100 — Praça central', status: 'operando', lastMaintenance: relDate(23, now) },
  { id: 'ELV-011', identification: 'Vila Central • Elevador estacionamento', clientId: 'CLI-005', model: 'Passageiros P-14', address: 'Av. Cruzeiro do Sul, 3100 — Setor B', status: 'atenção', lastMaintenance: relDate(24, now) },
  { id: 'ELV-012', identification: 'Bem-Estar • Elevador 01', clientId: 'CLI-006', model: 'Linha hospitalar H-02', address: 'R. Vergueiro, 2210 — Ala norte', status: 'operando', lastMaintenance: relDate(17, now) },
  { id: 'ELV-013', identification: 'Bem-Estar • Elevador 02', clientId: 'CLI-006', model: 'Linha hospitalar H-02', address: 'R. Vergueiro, 2210 — Ala sul', status: 'operando', lastMaintenance: relDate(17, now) },
  { id: 'ELV-014', identification: 'Atlas • Cabine 01', clientId: 'CLI-007', model: 'Passageiros P-15', address: 'Av. Rebouças, 2850 — Torre A', status: 'parado', lastMaintenance: relDate(30, now) },
  { id: 'ELV-015', identification: 'Atlas • Cabine 02', clientId: 'CLI-007', model: 'Passageiros P-15', address: 'Av. Rebouças, 2850 — Torre A', status: 'operando', lastMaintenance: relDate(30, now) },
  { id: 'ELV-016', identification: 'Bosque Alto • Bloco 1', clientId: 'CLI-008', model: 'Residencial R-06', address: 'R. Dona Tecla, 410 — Bloco 1', status: 'operando', lastMaintenance: relDate(33, now) },
  { id: 'ELV-017', identification: 'Bosque Alto • Bloco 2', clientId: 'CLI-008', model: 'Residencial R-06', address: 'R. Dona Tecla, 410 — Bloco 2', status: 'operando', lastMaintenance: relDate(33, now) },
  { id: 'ELV-018', identification: 'Estação Premium • Social', clientId: 'CLI-009', model: 'Passageiros P-09', address: 'R. dos Timbiras, 540 — Recepção', status: 'atenção', lastMaintenance: relDate(26, now) },
  { id: 'ELV-019', identification: 'Pátio Leste • Elevador central', clientId: 'CLI-010', model: 'Passageiros P-16', address: 'Av. Aricanduva, 5555 — Átrio', status: 'operando', lastMaintenance: relDate(20, now) },
  { id: 'ELV-020', identification: 'Pátio Leste • Elevador garagem', clientId: 'CLI-010', model: 'Passageiros P-16', address: 'Av. Aricanduva, 5555 — Garagem G2', status: 'em atendimento', lastMaintenance: relDate(20, now) },
];

export const elevators = createMockElevators();

export const createMockOccurrences = (now = new Date()) => [
  { id: 'OCC-2026-001', elevatorId: 'ELV-002', clientId: 'CLI-001', address: 'Av. Paulista, 1450 — Bloco A', time: relTime(35, now), description: 'Passageiro preso entre o 4º e o 5º andar.', severity: 'crítica', status: 'em atendimento', technicianId: 'TEC-002', trappedPeople: 1, locationContext: 'Hospital com circulação assistencial contínua.' },
  { id: 'OCC-2026-002', elevatorId: 'ELV-005', clientId: 'CLI-002', address: 'R. Funchal, 520 — Torre única', time: relTime(18, now), description: 'Elevador parado no pavimento térreo sem passageiros.', severity: 'alta', status: 'aberta', technicianId: null, trappedPeople: 0, locationContext: 'Pico de entrada de colaboradores.' },
  { id: 'OCC-2026-003', elevatorId: 'ELV-007', clientId: 'CLI-003', address: 'R. das Acácias, 88 — Bloco Cedro', time: relTime(55, now), description: 'Porta fecha parcialmente e reabre em seguida.', severity: 'atenção', status: 'aberta', technicianId: null, trappedPeople: 0, locationContext: 'Condomínio residencial com segundo elevador disponível.' },
  { id: 'OCC-2026-004', elevatorId: 'ELV-009', clientId: 'CLI-004', address: 'Al. Santos, 960 — Lobby', time: relTime(75, now), description: 'Ruído metálico anormal durante a subida.', severity: 'alta', status: 'em atendimento', technicianId: 'TEC-005', trappedPeople: 0, locationContext: 'Hotel com alta movimentação no período da manhã.' },
  { id: 'OCC-2026-005', elevatorId: 'ELV-011', clientId: 'CLI-005', address: 'Av. Cruzeiro do Sul, 3100 — Setor B', time: relTime(125, now), description: 'Funcionamento parcial; chamada do piso G1 não responde.', severity: 'atenção', status: 'aberta', technicianId: null, trappedPeople: 0, locationContext: 'Shopping antes da abertura ao público.' },
  { id: 'OCC-2026-006', elevatorId: 'ELV-014', clientId: 'CLI-007', address: 'Av. Rebouças, 2850 — Torre A', time: relTime(45, now), description: 'Interrupção de energia e falha no retorno automático.', severity: 'crítica', status: 'em deslocamento', technicianId: 'TEC-003', trappedPeople: 0, locationContext: 'Edifício comercial iniciando expediente.' },
  { id: 'OCC-2026-007', elevatorId: 'ELV-018', clientId: 'CLI-009', address: 'R. dos Timbiras, 540 — Recepção', time: relTime(150, now), description: 'Painel de chamada apresenta resposta intermitente.', severity: 'baixa', status: 'aberta', technicianId: null, trappedPeople: 0, locationContext: 'Hotel com equipe local orientada.' },
  { id: 'OCC-2026-008', elevatorId: 'ELV-020', clientId: 'CLI-010', address: 'Av. Aricanduva, 5555 — Garagem G2', time: relTime(180, now), description: 'Porta da cabine não conclui o fechamento no G2.', severity: 'alta', status: 'em atendimento', technicianId: 'TEC-012', trappedPeople: 0, locationContext: 'Acesso de fornecedores antes da abertura.' },
  { id: 'OCC-2026-009', elevatorId: 'ELV-012', clientId: 'CLI-006', address: 'R. Vergueiro, 2210 — Ala norte', time: relTime(8, now), description: 'Parada inesperada com equipe clínica dentro da cabine.', severity: 'crítica', status: 'aberta', technicianId: null, trappedPeople: 3, locationContext: 'Hospital infantil; acesso prioritário à ala cirúrgica.' },
  { id: 'OCC-2026-010', elevatorId: 'ELV-006', clientId: 'CLI-003', address: 'R. das Acácias, 88 — Bloco Ipê', time: relTime(1440 + 120, now), description: 'Solicitação preventiva para verificar nivelamento no térreo.', severity: 'baixa', status: 'agendada', technicianId: 'TEC-004', trappedPeople: 0, locationContext: 'Visita acordada com a administração do condomínio.' },
  { id: 'OCC-2026-011', elevatorId: 'ELV-010', clientId: 'CLI-005', address: 'Av. Cruzeiro do Sul, 3100 — Praça central', time: relTime(110, now), completedAt: relTime(50, now), duration: '42 min', description: 'Ruído leve percebido na abertura da porta do 2º piso.', severity: 'baixa', status: 'resolvida', technicianId: 'TEC-004', trappedPeople: 0, locationContext: 'Ocorrência verificada após o fechamento.' },
  { id: 'OCC-2026-012', elevatorId: 'ELV-004', clientId: 'CLI-002', address: 'R. Funchal, 520 — Torre única', time: relTime(1440 + 180, now), description: 'Indicador de pavimento apagado no interior da cabine.', severity: 'atenção', status: 'em atendimento', technicianId: 'TEC-009', trappedPeople: 0, locationContext: 'Cabine operante; sinalização auxiliar disponível.' },
  { id: 'OCC-2026-013', elevatorId: 'ELV-015', clientId: 'CLI-007', address: 'Av. Rebouças, 2850 — Torre A', time: relTime(1440 + 240, now), completedAt: relTime(1440 + 180, now), duration: '45 min', description: 'Funcionamento parcial durante chamadas simultâneas.', severity: 'atenção', status: 'resolvida', technicianId: 'TEC-008', trappedPeople: 0, locationContext: 'Fluxo comercial moderado no momento do chamado.' },
  { id: 'OCC-2026-014', elevatorId: 'ELV-017', clientId: 'CLI-008', address: 'R. Dona Tecla, 410 — Bloco 2', time: relTime(1440 + 300, now), completedAt: relTime(1440 + 240, now), duration: '52 min', description: 'Porta com fechamento mais lento que o habitual.', severity: 'baixa', status: 'resolvida', technicianId: 'TEC-007', trappedPeople: 0, locationContext: 'Condomínio com acessibilidade prioritária.' },
  { id: 'OCC-2026-015', elevatorId: 'ELV-019', clientId: 'CLI-010', address: 'Av. Aricanduva, 5555 — Átrio', time: relTime(27, now), description: 'Oscilação no painel e reinício da cabine durante operação.', severity: 'alta', status: 'em deslocamento', technicianId: 'TEC-012', trappedPeople: 0, locationContext: 'Shopping em preparação para abertura.' },
  { id: 'OCC-2026-016', elevatorId: 'ELV-003', clientId: 'CLI-001', address: 'Av. Paulista, 1450 — Bloco B', time: relTime(220, now), completedAt: relTime(150, now), duration: '38 min', description: 'Solicitação preventiva após transporte de equipamento.', severity: 'baixa', status: 'resolvida', technicianId: 'TEC-001', trappedPeople: 0, locationContext: 'Elevador de serviço do hospital.' },
  { id: 'OCC-2026-017', elevatorId: 'ELV-008', clientId: 'CLI-004', address: 'Al. Santos, 960 — Lobby', time: relTime(280, now), completedAt: relTime(210, now), duration: '35 min', description: 'Interrupção breve de energia; operação restabelecida.', severity: 'atenção', status: 'resolvida', technicianId: 'TEC-005', trappedPeople: 0, locationContext: 'Gerador do hotel acionado normalmente.' },
  { id: 'OCC-2026-018', elevatorId: 'ELV-013', clientId: 'CLI-006', address: 'R. Vergueiro, 2210 — Ala sul', time: relTime(340, now), completedAt: relTime(260, now), duration: '48 min', description: 'Ruído anormal relatado durante viagem ao 6º andar.', severity: 'alta', status: 'resolvida', technicianId: 'TEC-008', trappedPeople: 0, locationContext: 'Uso hospitalar com rota alternativa disponível.' },
  { id: 'OCC-2026-019', elevatorId: 'ELV-016', clientId: 'CLI-008', address: 'R. Dona Tecla, 410 — Bloco 1', time: relTime(2880 + 120, now), description: 'Botão do 7º andar com resposta intermitente.', severity: 'baixa', status: 'agendada', technicianId: 'TEC-004', trappedPeople: 0, locationContext: 'Manutenção combinada para o período de menor uso.' },
  { id: 'OCC-2026-020', elevatorId: 'ELV-001', clientId: 'CLI-001', address: 'Av. Paulista, 1450 — Bloco A', time: relTime(2880 + 240, now), completedAt: relTime(2880 + 180, now), duration: '40 min', description: 'Desnível leve percebido na parada do 3º andar.', severity: 'atenção', status: 'resolvida', technicianId: 'TEC-008', trappedPeople: 0, locationContext: 'Área de internação com fluxo controlado.' },
  { id: 'OCC-2026-021', elevatorId: 'ELV-005', clientId: 'CLI-002', address: 'R. Funchal, 520 — Torre única', time: relTime(4320 + 120, now), completedAt: relTime(4320 + 60, now), duration: '55 min', description: 'Porta com falha após objeto bloquear o sensor.', severity: 'alta', status: 'resolvida', technicianId: 'TEC-009', trappedPeople: 0, locationContext: 'Equipe predial isolou a cabine até a chegada técnica.' },
  { id: 'OCC-2026-022', elevatorId: 'ELV-018', clientId: 'CLI-009', address: 'R. dos Timbiras, 540 — Recepção', time: relTime(4320 + 300, now), completedAt: relTime(4320 + 240, now), duration: '1h 10min', description: 'Elevador parado temporariamente no 9º andar.', severity: 'alta', status: 'resolvida', technicianId: 'TEC-006', trappedPeople: 0, locationContext: 'Hóspedes direcionados ao segundo elevador.' },
  { id: 'OCC-2026-023', elevatorId: 'ELV-007', clientId: 'CLI-003', address: 'R. das Acácias, 88 — Bloco Cedro', time: relTime(5760 + 120, now), completedAt: relTime(5760 + 60, now), duration: '28 min', description: 'Passageiro preso por aproximadamente quatro minutos.', severity: 'crítica', status: 'resolvida', technicianId: 'TEC-002', trappedPeople: 1, locationContext: 'Porteiro manteve contato com o passageiro durante o apoio.' },
  { id: 'OCC-2026-024', elevatorId: 'ELV-011', clientId: 'CLI-005', address: 'Av. Cruzeiro do Sul, 3100 — Setor B', time: relTime(5760 + 300, now), completedAt: relTime(5760 + 240, now), duration: '1h 05min', description: 'Solicitação preventiva para inspeção antes de evento.', severity: 'baixa', status: 'resolvida', technicianId: 'TEC-001', trappedPeople: 0, locationContext: 'Evento programado para o fim de semana.' },
  { id: 'OCC-2026-025', elevatorId: 'ELV-020', clientId: 'CLI-010', address: 'Av. Aricanduva, 5555 — Garagem G2', time: relTime(7200 + 120, now), completedAt: relTime(7200 + 60, now), duration: '50 min', description: 'Falha de comunicação no painel externo do G1.', severity: 'atenção', status: 'resolvida', technicianId: 'TEC-003', trappedPeople: 0, locationContext: 'Cabine permaneceu fora de operação durante a verificação.' },
];

export const occurrences = createMockOccurrences();


export const getClientById = (clientId) => clients.find((client) => client.id === clientId);
export const getElevatorById = (elevatorId) => elevators.find((elevator) => elevator.id === elevatorId);
export const getTechnicianById = (technicianId) => technicians.find((technician) => technician.id === technicianId);
