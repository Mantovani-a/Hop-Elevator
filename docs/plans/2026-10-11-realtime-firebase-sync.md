# Realtime Multi-Device Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

Implementação de sincronização em tempo real entre múltiplos dispositivos físicos (Notebook, Tablet e Smartphone) para os módulos HOP Control, HOP Operator e HOP Client utilizando **Firebase Realtime Database**.

---

## 1. Contexto e Objetivos

* **Problema:** A aplicação atual utiliza `localStorage` e eventos nativos do navegador (`window.addEventListener('storage')`) para manter o estado operacional entre abas. Dispositivos físicos distintos (como um notebook rodando Control e um tablet rodando Operator) possuem storages isolados e não sincronizam entre si.
* **Meta:** Habilitar sincronização instantânea (<100ms) entre múltiplos dispositivos utilizando o deploy estático já existente na Vercel, sem necessidade de construir ou manter um backend complexo do zero.
* **Público e Cenário:** Demonstração do MVP do 1º ano da faculdade, com 3 telas simultâneas interagindo em tempo real.

---

## 2. Registro de Decisões (Decision Log)

| Decisão | Alternativas Avaliadas | Justificativa |
| :--- | :--- | :--- |
| **Firebase Realtime Database** | 1. Backend REST/Node.js/Postgres<br>2. Mini relay WebSocket local<br>3. P2P WebRTC / PeerJS | Funciona diretamente no Vercel; zero servidores para gerenciar; configuração mínima (~30 linhas de ponte); evita a "bola de neve" de um backend tradicional no 1º ano. |
| **Ponte desacoplada no `operationStore.js`** | Reescrever hooks dos componentes | O front-end já possui um ponto único de verdade (`operationStore.js`). Criar uma ponte mantém 100% dos componentes e telas inalterados. |
| **Fallback resiliente para `localStorage`** | Dependência exclusiva de nuvem | Se houver oscilação de rede no local da apresentação, o aplicativo continua operando com dados locais sem crash. |

---

## 3. Arquitetura e Contrato de Dados

### 3.1 Nó do Firebase Realtime Database
```json
{
  "hop_session": {
    "version": 5,
    "updatedAt": "2026-10-11T16:00:00.000Z",
    "operatorShiftActive": true,
    "occurrences": [ ... ]
  }
}
```

### 3.2 Regras de Segurança do Firebase (Leitura e Escrita Públicas para o MVP)
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

---

## 4. Tarefas de Implementação (Bite-Sized Tasks)

### Tarefa 1: Instalação da Dependência do Firebase
* **Ação:** Instalar o pacote oficial do Firebase no projeto.
* **Comando:** `npm install firebase`
* **Critério de Aceite:** `firebase` listado em `dependencies` no `package.json`.

### Tarefa 2: Configuração e Variáveis de Ambiente
* **Arquivo:** `.env.example` e `.env.local`
* **Arquivo:** `src/config/firebase.js`
* **Ação:** 
  * Criar modelo com chaves `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID`.
  * Inicializar a instância do app Firebase e exportar o objeto `database` (`getDatabase(app)`).
  * Incluir tratamento caso as variáveis não estejam preenchidas (modo offline gracioso).
* **Critério de Aceite:** App inicializa sem erros mesmo se as credenciais ainda não estiverem configuradas.

### Tarefa 3: Criação do Módulo de Sincronização (`src/data/firebaseSync.js`)
* **Arquivo:** `src/data/firebaseSync.js`
* **Ação:**
  * Implementar `initFirebaseSync({ onRemoteUpdate, getLocalState })`.
  * Implementar `broadcastStateToFirebase(state)`.
  * Implementar proteção contra eco (*loop guard* / *isApplyingRemote* flag).
  * Implementar função para resetar a sessão remota (`resetRemoteSession(initialState)`).
* **Critério de Aceite:** Teste de envio e escuta no nó `hop_session`.

### Tarefa 4: Integração com `src/data/operationStore.js`
* **Arquivo:** `src/data/operationStore.js`
* **Ação:**
  * Conectar `broadcastStateToFirebase` dentro de `writeOperationState`.
  * Expor função `applyRemoteOperationState(remoteState)` para receber dados da nuvem e disparar `hop-operation-updated`.
  * Atualizar `resetOperationState` para propagar o reset via `resetRemoteSession`.
* **Critério de Aceite:** Modificações disparadas no store local transmitem para o Firebase, e dados recebidos do Firebase atualizam a interface sem loop infinito.

### Tarefa 5: Indicador Visual de Conexão em Tempo Real
* **Arquivo:** `src/components/RealtimeStatusBadge.jsx` (ou integração no cabeçalho/sidebar existente)
* **Ação:**
  * Adicionar indicador discreto (bolinha verde "Sincronizado" / cinza "Modo Local") para que os apresentadores tenham certeza visual de que os aparelhos estão conversando.
* **Critério de Aceite:** Indicador visível no topo da página ou sidebar.

### Tarefa 6: Validação e Teste Multidispositivo
* **Ação:**
  * Testar abrindo duas janelas simultâneas (uma normal e uma anônima).
  * No Control: despachar técnico -> verificar se no Operator o status muda na hora.
  * No Client: abrir novo chamado de emergência -> verificar se aparece na fila do Control e do Operator.
  * No Operator: concluir atendimento -> verificar se aparece como resolvido no mapa e nas métricas do Control.
  * Testar o botão "Restaurar dados de demonstração" e confirmar que reseta ambos os lados.
* **Critério de Aceite:** 100% dos fluxos sincronizando em menos de 1 segundo.

### Tarefa 7: Documentação e Deploy na Vercel
* **Ação:**
  * Atualizar `DOCUMENTACAO_TECNICA.md` com a nova arquitetura de sincronização.
  * Documentar como configurar as variáveis de ambiente no painel da Vercel (`Settings > Environment Variables`).
* **Critério de Aceite:** Instruções passo a passo para o time subir para o Vercel.

---

## 5. Plano de Rollback e Segurança

* Se por qualquer motivo o Firebase falhar durante um teste, a flag `isFirebaseActive` desativa a sincronização e o app opera normalmente com o `localStorage` nativo, garantindo que nada da apresentação seja interrompido.
