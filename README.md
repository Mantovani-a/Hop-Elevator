<p align="center">
  <img src="public/hop-logo.png" alt="HOP" width="380">
</p>

# HOP — ecossistema de atendimento a elevadores

HOP é um MVP acadêmico criado para o Challenge FIAP em parceria com a OTIS. A proposta conecta clientes de estabelecimentos, a operação centralizada e técnicos de campo em um único fluxo demonstrativo para registrar, priorizar, despachar e acompanhar ocorrências de elevadores. O projeto não representa um produto oficial implantado pela OTIS.

<div align="center">
  <h2>Equipe</h2>
  <p>
    Davi Rabelo<br>
    Enzo Mitev<br>
    Felipe Domingues<br>
    Marcris Filho<br>
    Nicolas Mantovani
  </p>
</div>

## O problema

Falhas de elevadores têm contextos e riscos diferentes — de funcionamento parcial a passageiros presos. Organizar informações, prioridade, equipe e acompanhamento em interfaces desconectadas aumenta o tempo de resposta e reduz a visibilidade operacional para a empresa e para o cliente.

## A solução

| Módulo | Público | Visão principal |
| --- | --- | --- |
| **HOP Client** | Clientes e Estabelecimentos | Monitoramento de elevadores em tempo real, abertura guiada de chamados com triagem de risco e acompanhamento de status. |
| **HOP Control** | Lideranças e Operação | Central operacional com mapa, fila, técnicos, equipes, ficha detalhada de elevadores com esquema técnico 2D, relatórios A4 e indicadores. |
| **HOP Operator** | Técnicos de campo | Turno, fila priorizada, rota, diagnóstico técnico, representação esquemática 2D interativa e fluxo de atendimento. |

## Fluxo integrado

**Cliente registra chamado no Client (ou Central abre)** → **HOP calcula a prioridade por risco** → **Control organiza e despacha técnico/equipe** → **Operator recebe rota e diagnóstico** → **atendimento é concluído** → **os três módulos refletem a resolução em tempo real**.

Todos os módulos leem e atualizam a mesma base operacional no navegador. O cenário principal de campo usa o operador João Carlos.

## Funcionalidades do MVP

- portal do cliente com status dos elevadores em tempo real e abertura assistida de chamados com triagem de risco;
- priorização por contexto operacional, passageiros presos, risco, local crítico (ex.: hospitais), condição do elevador, tempo e reincidência;
- recomendação e atribuição demonstrativa de técnico ou equipe por proximidade e especialidade;
- ciclo completo do chamado, da abertura à resolução, com fluxo de atendimento e solicitação de peças no Operator;
- mapa operacional interativo da Grande São Paulo com OpenStreetMap e Leaflet, rota em tempo real, filtros e marcadores semânticos;
- diagnóstico preliminar/completo e representação esquemática 2D vetorial com inspeção de subsistemas e regiões do elevador;
- ficha operacional de elevadores no HOP Control com resumo técnico, histórico em timeline expansível, esquema técnico 2D e impressão de relatórios;
- dashboards, filas, histórico e sincronização nativa em tempo real entre abas dos três módulos;
- controle de turno e tema claro/escuro persistentes, com navegação lateral responsiva nos três módulos;
- restauração discreta dos dados originais para repetir a demonstração.

## Tecnologias

- React 19 e JavaScript (ESM);
- SVG vetorial responsivo para representação esquemática 2D dos subsistemas do elevador;
- Leaflet e OpenStreetMap (geolocalização operacional sem custos);
- HTML semântico e CSS responsivo com Design Tokens;
- Bootstrap 5;
- Vite 7;
- APIs nativas do navegador (`BroadcastChannel` e `localStorage` para sincronização em tempo real, Geolocation, Web Audio e Pointer Events);
- PlantUML para modelagem de Diagrama de Classes e Diagrama de Sequência (`docs/diagramas/`).

O mapa utiliza Leaflet com tiles públicos e oficiais do OpenStreetMap, sem necessidade de chaves de API pagas ou cartão de crédito.

## Como executar

Requer Node.js e npm instalados.

```bash
npm install
npm run dev
```

Para validar a versão de produção:

```bash
npm run build
npm run preview
```

## Estrutura resumida

```text
docs/
└── diagramas/        # diagramas UML de classes e sequência (.puml)
public/               # favicon, logo pública e diretórios de avatares
src/
├── assets/logos/     # logos oficiais dos módulos e apresentação
├── components/
│   ├── client/       # componentes exclusivos do HOP Client
│   ├── control/      # componentes exclusivos do HOP Control
│   ├── elevator/     # visualizador técnico 2D e inspeção de regiões (compartilhado)
│   ├── operator/     # componentes exclusivos do HOP Operator
│   └── *.jsx         # componentes globais (Modal, Sidebar, LeafletMap, etc.)
├── context/          # tema da aplicação e contexto técnico de regiões do elevador
├── data/             # mocks, estado compartilhado, sincronização e mapa
├── hooks/            # assinaturas de estado, foco e tela cheia
├── pages/            # páginas e roteamento interno dos módulos
├── styles/           # tokens, estilos compartilhados e ajustes responsivos por módulo
└── utils/            # prioridade, despacho, equipes, turno, triagem e relatórios
tests/                # testes automatizados de regras operacionais e relatórios
```

Detalhes de arquitetura e manutenção estão em [DOCUMENTACAO_TECNICA.md](DOCUMENTACAO_TECNICA.md).

## Dados demonstrativos

Técnicos, clientes, ocorrências, endereços, coordenadas, códigos, diagnósticos, ETA e cidade são fictícios ou simulados para apresentação acadêmica. Não há backend externo obrigatório, GPS comercial pago, IA ou especificações técnicas oficiais de equipamentos OTIS neste MVP.
