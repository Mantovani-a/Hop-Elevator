# Documentação técnica — HOP Front-end

## 1. Visão geral

O HOP é uma aplicação React de página única. `src/main.jsx` inicializa o React, importa Bootstrap e os estilos, e envolve a aplicação com `ThemeProvider`. `src/App.jsx` lê o fragmento da URL (`window.location.hash`) e escolhe Home, About (`/sobre`), Control, Operator ou Client.

Os três módulos operacionais são apresentações diferentes da mesma operação. A fonte compartilhada fica em `src/data/operationStore.js`; páginas obtêm um snapshot estável por `useOperationState` e gravam alterações pelas funções do store. Assim, o chamado inserido no Client ou no Control é o mesmo objeto atribuído e concluído no Operator.

## 2. Estrutura real

```text
docs/diagramas/
├── diagrama_classes.puml     # modelo de classes do domínio HOP
└── diagrama_sequencia.puml   # fluxo temporal ponta a ponta
public/assets/profiles/
├── operators/                # fotos públicas dos técnicos
├── leadership/               # fotos públicas das lideranças
└── clients/                  # fotos públicas dos responsáveis
src/
├── App.jsx
├── main.jsx
├── assets/logos/             # logos oficiais dos módulos e apresentação
├── components/
│   ├── client/               # shell, cards, timeline e fluxo de suporte do Client
│   ├── control/              # shell, mapa, detalhes, equipes, peças e relatórios do Control
│   ├── elevator/             # visualizador esquemático 2D e inspeção de regiões (compartilhado)
│   ├── operator/             # shell, fila, rota, turno, conclusão e diagnóstico do Operator
│   └── componentes compartilhados (sidebar, logo, mapa, badge, tema, notificações e modais)
├── context/
│   ├── ThemeContext.jsx
│   └── ElevatorModelContext.jsx
├── data/
│   ├── mockData.js
│   ├── operationStore.js, operationStatus.js e realtimeSync.js
│   ├── notificationStore.js
│   ├── operatorData.js, controlData.js e clientData.js
│   ├── elevatorRegions.js e technicalIntelligence.js
│   └── geoCoordinates.js
├── hooks/
│   ├── useOperationState.js
│   ├── useDialogFocus.js
│   └── useFullscreen.js
├── pages/
│   ├── HomePage.jsx, AboutPage.jsx, ClientPage.jsx, ControlPage.jsx e OperatorPage.jsx
│   ├── client/               # visões internas do Client
│   ├── control/              # visões internas do Control
│   └── operator/             # visões internas do Operator
├── styles/
│   ├── tokens.css            # tokens claros/escuros, inclusive do mapa
│   ├── global.css            # base, tipografia, formulários e acessibilidade
│   ├── components.css        # cards, badges, shells e cabeçalhos compartilhados
│   ├── control.css, operator.css, client.css e about.css
│   └── map.css               # desenho e interação visual do mapa
└── utils/
    ├── priorityScore.js
    ├── dispatchRecommendation.js
    ├── occurrenceTeam.js
    ├── shiftSchedule.js
    ├── operatorWorkflow.js
    ├── clientSupport.js
    ├── controlReports.js, partRequestReport.js e reportPrint.js
    └── presentation.js
tests/
├── controlReports.test.mjs
├── occurrenceTeam.test.mjs
├── partRequestReport.test.mjs
└── shiftSchedule.test.mjs
```

## 3. Arquivos importantes

| Arquivo | Responsabilidade | Alterar quando |
| --- | --- | --- |
| `src/main.jsx` | Inicialização, providers e CSS global | adicionar provider ou folha global |
| `src/App.jsx` | Seleção do módulo pela hash | adicionar módulo/rota raiz |
| `src/data/operationStore.js` | estado único, status, persistência e reset | mudar o contrato compartilhado |
| `src/data/realtimeSync.js` | sincronização instantânea entre abas via `BroadcastChannel` | alterar estratégia de sincronia em tempo real |
| `src/hooks/useOperationState.js` | assinatura React do store | alterar a estratégia de leitura |
| `src/data/mockData.js` | técnicos, clientes, elevadores e ocorrências base | manter dados demonstrativos |
| `src/utils/priorityScore.js` | pontuação e classificação | revisar pesos de prioridade |
| `src/utils/dispatchRecommendation.js` | recomendação de técnico e sugestão de equipe | revisar despacho demonstrativo |
| `src/components/LeafletMap.jsx` | mapa operacional em tempo real com OpenStreetMap | alterar renderização e interação do mapa |
| `src/components/ModuleSidebar.jsx` | estrutura lateral comum aos três módulos | alterar logo, perfil ou comportamento base dos menus |
| `src/components/ProfileAvatar.jsx` | foto pública com fallback para iniciais | alterar renderização, acessibilidade ou tamanhos dos avatares |
| `src/components/elevator/ElevatorModelViewer.jsx` | esquema técnico 2D e inspeção de regiões | alterar representação técnica do elevador |
| `src/data/geoCoordinates.js` | coordenadas geográficas de SP e traçado de rotas | atualizar posições de clientes e técnicos |
| `src/context/ThemeContext.jsx` | tema, sistema e persistência | alterar estratégia de tema |
| `src/styles/tokens.css` | design tokens claros/escuros | alterar identidade visual |
| `src/styles/components.css` | estruturas visuais compartilhadas | alterar cards, badges, shells ou cabeçalhos comuns |

## 4. Rotas reais

O projeto usa hash routing nativo; não há React Router. `App.jsx` escolhe o módulo e cada página raiz interpreta seus caminhos internos.

### Gerais

- `#/` — seleção das experiências;
- `#/sobre` — apresentação institucional e técnica da solução;
- `#/client` — HOP Client;
- `#/control` — HOP Control;
- `#/operator` — HOP Operator.

### Control

- `#/control/occurrences`, `/technicians`, `/elevators`, `/preventives`, `/analytics`.

### Operator

- `#/operator/occurrences`, `/history`, `/profile`;
- `#/operator/occurrence/:id` — detalhe;
- `#/operator/service/:id` — rota, diagnóstico e atendimento.

### Client

- `#/client/elevators`, `/calls`, `/profile`;
- `#/client/support/:elevatorId` — fluxo curto de suporte;
- `#/client/call/:id` — acompanhamento.

Para criar uma página interna, crie o componente, importe-o na página raiz do módulo, acrescente a condição de rota e inclua o link no shell correspondente.

## 5. Componentes e layouts

- `HopLogo` centraliza as logos oficiais, aceita `variant`, `size` e `className` e resolve a logo especial do turno.
- `ThemeToggle`, `StatusBadge`, `MetricCard` e `FeedbackMessage` são compartilháveis.
- `ModuleSidebar` contém a estrutura visual compartilhada; `ClientShell`, `ControlShell` e `OperatorShell` configuram itens, perfil e cabeçalho de cada módulo.
- `ControlOperationsMap` monta marcadores com geolocalização e entrega-os ao `LeafletMap`.
- `RouteMap` usa o mesmo `LeafletMap` e as coordenadas de `geoCoordinates.js` para traçar a rota do Operator.
- `ElevatorModelViewer` e `Elevator2DViewer` (em `src/components/elevator/`) expõem o diagrama vetorial técnico (máquina de tração, polias, cabos, freios safeties, quadro de controle, guias, contrapeso, cabine, portas, sensores e amortecedores) e a lista interativa de regiões inspecionadas.
- `OperatorShiftClosed` e `OperatorShiftLanding` apresentam a experiência de controle de turno e registro de ponto do operador João Carlos.
- `ClientSupportFlow` controla as etapas do formulário assistido do cliente, gerando o payload por `src/utils/clientSupport.js`.
- `useDialogFocus` posiciona o foco, mantém Tab no diálogo, fecha com Escape e devolve o foco ao elemento anterior.

Ao criar um componente, mantenha uma responsabilidade clara, receba dados por props, use HTML semântico e estilize com tokens. Estado que interessa apenas ao componente fica local; ocorrências compartilhadas sempre passam pelo store.

## 6. Estado compartilhado e sincronização em tempo real

`operationStore.js` mantém um cache de snapshot e uma representação JSON. `useOperationState` usa `useSyncExternalStore`, que exige que o snapshot permaneça referencialmente estável enquanto nada mudou. Essa combinação evita cascatas de renderização e eventos repetidos.

Uma gravação:

1. lê o snapshot atual;
2. ignora a operação se ocorrências, preventivas e turno não mudaram;
3. atualiza o cache antes do armazenamento;
4. grava uma vez no `localStorage`;
5. dispara `hop-operation-updated` uma vez;
6. transmite o estado atualizado via `BroadcastChannel` (`broadcastOperationState` em `src/data/realtimeSync.js`) para sincronização imediata entre abas abertas no navegador.

A assinatura escuta o evento de janela `hop-operation-updated`, o evento nativo `storage` e o canal `BroadcastChannel` (`hop_realtime_sync`), permitindo demonstrar Cliente, Central e Operador simultaneamente sem depender de servidores externos ou chaves de API.

## 7. localStorage

| Chave | Conteúdo |
| --- | --- |
| `hop-shared-operation-v5` | versão, horário, estado/eventos de turno do Operator, preventivas e lista única de ocorrências |
| `hop-theme` | `light` ou `dark` |

O estado é lido na inicialização do hook e gravado apenas pelas funções públicas de `operationStore.js`. Não edite o JSON manualmente durante a aplicação aberta.

“Restaurar dados de demonstração” chama `resetOperationState`, recria os mocks e propaga o estado inicial para todas as abas abertas. A preferência de tema é preservada.

## 8. Mock data

`src/data/mockData.js` contém as coleções `technicians`, `clients`, `elevators` e `occurrences`, além de buscas por ID. Os arquivos `clientData.js`, `operatorData.js` e `controlData.js` enriquecem esses registros para a apresentação de cada módulo. Diagnósticos, ETA e histórico rápido do Operator ficam em `operatorData.js`. Coordenadas ficam em `geoCoordinates.js`.

### Adicionar técnico

1. Adicione um objeto em `technicians` com ID único, nome, status, especialidade, região, distância e atendimento atual.
2. Acrescente uma posição para o mesmo ID em `technicianGeoPositions`.
3. Se o técnico for atribuído a um mock, use esse mesmo ID em `technicianId`.

João Carlos é `TEC-010`. Seu perfil de Operator é derivado em `operatorData.js`; ali ficam ID de funcionário, turno, especialidades e localização demonstrativa. Nome, região, especialidade, status inicial e distância vêm do registro `TEC-010` em `mockData.js`.

### Adicionar cliente

Adicione o estabelecimento em `clients` com ID único, nome, tipo, região/endereço e dados já usados pelo objeto existente. Depois inclua o ID em `establishmentCityPositions`. Para torná-lo o cliente demonstrativo principal, altere `clientUser.clientId` em `clientData.js`.

### Adicionar elevador

Adicione em `elevators` um ID, identificação, `clientId` existente, modelo demonstrativo, endereço, status e última manutenção. Para personalização no Client, acrescente a apresentação em `elevatorPresentation`, dentro de `clientData.js`.

### Adicionar ocorrência

Adicione em `occurrences` um ID e referências válidas de elevador/cliente/técnico, horário ISO, descrição, gravidade inicial, status e passageiros presos. Metadados de diagnóstico/rota podem ser colocados em `operatorOccurrenceMetadata`. No uso da aplicação, prefira `addOperationOccurrence`; ela preserva a fonte única e notifica todos os módulos.

## 9. Prioridade

`calculatePriority`, em `priorityScore.js`, começa em 5 pontos e considera passageiros presos, risco à vida, hospital/instalação crítica, elevador parado ou falha parcial, tempo aberto e reincidência. O resultado é limitado a 0–100 e inclui motivos legíveis.

Classificação: 0–29 baixa, 30–54 atenção, 55–79 alta e 80–100 crítica. Alterar um peso afeta ordenação no Operator e fila/indicadores do Control; portanto mantenha os limites coerentes com os tokens de gravidade.

## 10. Despacho, equipes e status

`recommendTechnician` filtra apenas disponíveis e ordena por uma pontuação demonstrativa: menor distância, especialidade aderente e bônus de região. Resgate recebe maior peso quando há passageiro preso. Para ocorrências que exigem ou recomendam atuação conjunta, `suggestOccurrenceTeam` e `occurrenceTeam.js` gerenciam a composição da equipe (líder responsável e técnicos de apoio).

Status internos, centralizados em `OPERATION_STATUS`, preservam compatibilidade com registros antigos. O fluxo visual principal é:

`Técnico atribuído` → `Em deslocamento` → `Em manutenção` → `Resolvido` (com suporte ao estado `Aguardando peça` e retomada de atendimento).

### Turno do Operator

`operatorShiftActive` e `shiftEvents`, no mesmo estado de `operationStore.js`, são gerenciados por `updateOperatorShift`, `registerOperatorShiftEvent` e `shiftSchedule.js`. `OperatorPage.jsx` oculta shell e conteúdo operacional quando o turno está encerrado e renderiza `OperatorShiftClosed.jsx`; iniciar o turno restaura a interface sem perder ocorrências ou histórico. O Control interpreta João Carlos como indisponível enquanto o turno estiver encerrado.

## 11. Mapa operacional e geolocalização

O mapa operacional utiliza **Leaflet** com tiles oficiais do **OpenStreetMap** (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`), 100% livre, público e sem marca d'água.

`LeafletMap.jsx` renderiza a malha geográfica da Grande São Paulo com suporte nativo a tema claro e escuro (via filtro CSS nos tiles), marcadores semânticos em SVG para cada categoria de cliente (Hospitais, Shoppings, Hotéis, Condomínios e Prédios Comerciais), status dots ao vivo para técnicos e escudos de alerta com pulso para ocorrências críticas.

`geoCoordinates.js` centraliza as latitudes e longitudes dos estabelecimentos e técnicos pela cidade. `buildGeoRoute(start, end)` calcula a rota ao longo dos eixos viários. O Operator (`RouteMap.jsx`) enquadra a rota automaticamente (`map.fitBounds`) e oferece suporte a geolocalização do navegador (`navigator.geolocation`).

## 12. Visualização Esquema Técnico 2D e Regiões do Elevador

O ecossistema HOP disponibiliza visualização técnica 2D esquemática vetorial (`Elevator2DViewer.jsx`) e inspeção estruturada de regiões (`ElevatorModelViewer.jsx`), alimentadas pelas definições de subsistemas em `src/data/elevatorRegions.js` e traduções em `src/utils/modelNameTranslator.js` via `ElevatorModelContext.jsx`:

- **No HOP Operator (`OperatorServicePage.jsx`):** o técnico visualiza o diagrama vetorial responsivo a temas claro/escuro e inspeciona as regiões suspeitas apontadas pela triagem.
- **No HOP Control (`ControlElevatorDetailModal.jsx`):** a ficha operacional do elevador apresenta três abas (**Resumo**, **Histórico** em timeline expansível e **Esquema 2D**) além de exportação de relatório para impressão A4.

## 13. Logos e Fotos de Perfil

As logos oficiais ficam em `public/hop-logo.png` e `src/assets/logos/`. Mantendo os mesmos nomes, podem ser substituídas sem alterar imports.

`ProfileAvatar.jsx` é o único componente responsável por fotos de pessoas. Ele recebe nome, caminho, categoria e tamanho (`sm`, `md` ou `lg`), mantém as iniciais como fallback e oculta a imagem quando o arquivo público não carrega. As fotos ficam em `public/assets/profiles/operators`, `leadership` ou `clients`.

## 14. Design system e tema

`tokens.css` define cores, espaços, raios, sombras e superfícies do mapa. Marca: `#252D7A`, `#3F5BD8`, `#F8FAFC`, `#D8DEE8`, `#1E293B`. Gravidade: `#2EC4B6`, `#EAB308`, `#F59E0B`, `#DC2626`.

O seletor `[data-theme="dark"]` sobrescreve somente tokens, inclusive os `--map-*`, sem duplicar folhas de componentes. `ThemeContext` usa o valor salvo; sem valor manual, respeita `prefers-color-scheme`.

`global.css` guarda a base transversal. `components.css` concentra as estruturas compartilhadas: `.app-card`, `.section-heading`, badges, métricas e shells laterais. `control.css`, `operator.css`, `client.css` e `about.css` contêm as regras específicas de cada experiência; `map.css` contém exclusivamente a representação do mapa.

## 15. Onde eu altero cada coisa?

| Quero alterar | Onde mexer |
| --- | --- |
| Logos | `public/hop-logo.png`, `src/assets/logos/` e `src/components/HopLogo.jsx` |
| Fotos de perfil e fallback | `public/assets/profiles/`, `src/components/ProfileAvatar.jsx` e `src/utils/profileAvatar.js` |
| Cor principal / dark mode / tokens | `src/styles/tokens.css` |
| Card, badge, shell ou cabeçalho compartilhado | `src/styles/components.css` |
| João Carlos | `src/data/mockData.js` (`TEC-010`) e `src/data/operatorData.js` |
| Técnicos, clientes, elevadores, ocorrências | `src/data/mockData.js` |
| Prioridade | `src/utils/priorityScore.js` |
| Despacho e equipes | `src/utils/dispatchRecommendation.js` e `src/utils/occurrenceTeam.js` |
| Status compartilhados / reset | `src/data/operationStore.js` e `src/data/realtimeSync.js` |
| Turno e ponto do Operator | `src/utils/shiftSchedule.js`, `src/pages/OperatorPage.jsx`, `src/components/operator/OperatorShiftPanel.jsx` |
| Fluxo de atendimento do Operator | `src/utils/operatorWorkflow.js`, `src/pages/OperatorPage.jsx`, `src/pages/operator/OperatorServicePage.jsx` |
| Cidade, pontos e rota | `src/data/geoCoordinates.js` |
| Interação visual do mapa | `src/components/LeafletMap.jsx` e `src/styles/map.css` |
| Esquema técnico 2D e regiões | `src/components/elevator/ElevatorModelViewer.jsx`, `src/components/elevator/Elevator2DViewer.jsx`, `src/data/elevatorRegions.js` |
| Ficha de elevadores (Control) | `src/components/control/ControlElevatorDetailModal.jsx` e `src/pages/control/ControlElevators.jsx` |
| Relatórios para impressão A4 | `src/utils/controlReports.js`, `src/utils/partRequestReport.js` e `src/utils/reportPrint.js` |
| Diagramas UML (Fase 7) | `docs/diagramas/diagrama_classes.puml` e `docs/diagramas/diagrama_sequencia.puml` |
| Estrutura comum das sidebars | `src/components/ModuleSidebar.jsx` e `src/styles/components.css` |
| Itens dos menus Client/Operator/Control | respectivos `src/components/*/*Shell.jsx` |
| Home e Apresentação | `src/pages/HomePage.jsx` e `src/pages/AboutPage.jsx` |
| Tema e persistência | `src/context/ThemeContext.jsx` |

## 16. Build, testes e deploy

```bash
npm install
npm run dev
npm run build
npm run preview
node --test tests/*.test.mjs
```

O build gera `dist/`. Para deploy estático (ex.: Vercel), publique o conteúdo dessa pasta e configure o host para servir `index.html`. Como as rotas usam hash, não é necessário rewrite de URLs internas. Não há backend obrigatório, variáveis secretas ou serviços externos pagos.
