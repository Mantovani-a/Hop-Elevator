<p align="center">
  <img src="src/assets/logos/hop-logo.png" alt="HOP" width="380">
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
| **HOP Control** | Lideranças e Operação | Central operacional com mapa, fila, técnicos, ficha detalhada de elevadores com modelo 3D, registro de ocorrências e indicadores. |
| **HOP Operator** | Técnicos de campo | Turno, fila priorizada, rota, diagnóstico técnico, representação 2D/3D interativa e fluxo de atendimento. |

## Fluxo integrado

**Cliente registra chamado no Client (ou Central abre)** → **HOP calcula a prioridade por risco** → **Control organiza e despacha técnico** → **Operator recebe rota e diagnóstico** → **atendimento é concluído** → **os três módulos refletem a resolução em tempo real**.

Todos os módulos leem e atualizam a mesma base operacional no navegador. O cenário principal de campo usa o operador João Carlos.

## Funcionalidades do MVP

- portal do cliente com status dos elevadores em tempo real e abertura assistida de chamados com triagem de risco;
- priorização por contexto operacional, passageiros presos, risco, local crítico (ex.: hospitais), condição do elevador, tempo e reincidência;
- recomendação e atribuição demonstrativa de técnico por proximidade e especialidade;
- ciclo completo do chamado, da abertura à resolução, com três ações operacionais no Operator;
- mapa operacional interativo da Grande São Paulo com OpenStreetMap e Leaflet, rota em tempo real, filtros e marcadores semânticos;
- diagnóstico preliminar/completo e representação 2D/3D interativa com Three.js e modelos vinculados por equipamento;
- ficha operacional de elevadores no HOP Control com resumo técnico, histórico em timeline expansível e visualizador 3D escopado;
- dashboards, filas, histórico e sincronização em tempo real entre os três módulos;
- turno e tema claro/escuro persistentes, com navegação lateral responsiva nos três módulos;
- restauração discreta dos dados originais para repetir a demonstração.

## Tecnologias

- React 19 e JavaScript;
- Three.js para renderização 3D wireframe e suporte a múltiplos formatos (.glb, .gltf, .fbx, .obj);
- Leaflet e OpenStreetMap (geolocalização operacional sem custos);
- HTML semântico e CSS responsivo;
- Bootstrap 5;
- Vite;
- APIs nativas do navegador (IndexedDB para armazenamento de modelos 3D por equipamento, `localStorage`, Geolocation, Web Audio e Pointer Events).

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
src/
├── assets/       # logos oficiais
├── components/   # componentes globais e dos dois módulos
├── context/      # tema da aplicação
├── data/         # mocks, estado compartilhado e mapa
├── hooks/        # assinaturas de estado e acessibilidade
├── pages/        # páginas e roteamento interno dos módulos
├── styles/       # tokens, estilos compartilhados e ajustes responsivos por módulo
└── utils/        # prioridade, despacho, fluxo e apresentação
```

Detalhes de arquitetura e manutenção estão em [DOCUMENTACAO_TECNICA.md](DOCUMENTACAO_TECNICA.md).

## Dados demonstrativos

Técnicos, clientes, ocorrências, endereços, coordenadas, códigos, diagnósticos, ETA e cidade são fictícios ou simulados para apresentação acadêmica. Não há backend, GPS em tempo real, IA ou especificações técnicas oficiais de equipamentos OTIS neste MVP.
