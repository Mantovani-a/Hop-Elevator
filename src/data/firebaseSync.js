import { ref, set, onValue } from 'firebase/database';
import { database, isFirebaseConfigured } from '../config/firebase.js';

const STATE_NODE_PATH = 'hop_operation_state';

let isReceivingRemote = false;
let isInitialized = false;
let isConnectedToRealtime = false;
const statusListeners = new Set();

const notifyStatus = () => {
  const status = {
    configured: isFirebaseConfigured,
    connected: isConnectedToRealtime && isFirebaseConfigured,
  };
  statusListeners.forEach((listener) => {
    try {
      listener(status);
    } catch (err) {
      console.warn('HOP: Erro ao notificar ouvinte de status do Firebase:', err);
    }
  });
};

/**
 * Inscreve um componente para receber atualizações de status da sincronização.
 * @param {(status: { configured: boolean, connected: boolean }) => void} callback
 * @returns {() => void} unsubscribe
 */
export const subscribeSyncStatus = (callback) => {
  statusListeners.add(callback);
  callback({
    configured: isFirebaseConfigured,
    connected: isConnectedToRealtime && isFirebaseConfigured,
  });
  return () => statusListeners.delete(callback);
};

/**
 * Inicializa a escuta em tempo real do Firebase Realtime Database.
 * @param {{ onRemoteStateReceived: (remoteState: Object) => void }} options
 */
export const initFirebaseRealtimeSync = ({ onRemoteStateReceived, onInitialSeedNeeded }) => {
  if (!isFirebaseConfigured || !database || isInitialized) return;
  isInitialized = true;

  try {
    // Monitora o status de conexão com os servidores do Firebase
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snap) => {
      isConnectedToRealtime = snap.val() === true;
      notifyStatus();
    });

    // Monitora atualizações do estado operacional do HOP
    const stateRef = ref(database, STATE_NODE_PATH);
    onValue(stateRef, (snapshot) => {
      if (!snapshot.exists()) {
        if (typeof onInitialSeedNeeded === 'function') {
          onInitialSeedNeeded();
        }
        return;
      }
      const remoteData = snapshot.val();
      if (!remoteData || typeof remoteData !== 'object') return;

      isReceivingRemote = true;
      try {
        onRemoteStateReceived(remoteData);
      } finally {
        // Libera a trava logo após o ciclo de atualização síncrona
        setTimeout(() => {
          isReceivingRemote = false;
        }, 50);
      }
    }, (error) => {
      console.warn('HOP: Erro na sincronização remota do Firebase:', error);
    });
  } catch (err) {
    console.warn('HOP: Falha ao inicializar listeners do Firebase:', err);
  }
};

/**
 * Transmite o estado operacional atual para todos os aparelhos conectados.
 * @param {Object} state
 */
export const broadcastOperationState = async (state) => {
  if (!isFirebaseConfigured || !database || isReceivingRemote) return;

  try {
    const stateRef = ref(database, STATE_NODE_PATH);
    await set(stateRef, state);
  } catch (error) {
    console.warn('HOP: Falha ao propagar estado para o Firebase:', error);
  }
};

/**
 * Restaura o estado da sessão no Firebase para os dados iniciais do mock.
 * @param {Object} initialState
 */
export const resetRemoteOperationState = async (initialState) => {
  if (!isFirebaseConfigured || !database) return;

  try {
    const stateRef = ref(database, STATE_NODE_PATH);
    await set(stateRef, initialState);
  } catch (error) {
    console.warn('HOP: Falha ao resetar estado remoto no Firebase:', error);
  }
};
