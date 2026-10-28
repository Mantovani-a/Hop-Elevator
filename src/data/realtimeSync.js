const CHANNEL_NAME = 'hop_realtime_sync';

let channel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch (err) {
    console.warn('HOP: BroadcastChannel indisponivel:', err);
  }
}

let isReceiving = false;

export function subscribeSyncStatus(callback) {
  if (typeof callback === 'function') {
    callback({ connected: true, mode: 'local-realtime' });
  }
  return () => {};
}

export function initRealtimeSync({ onRemoteStateReceived }) {
  if (!channel) return;

  channel.onmessage = (event) => {
    if (event.data?.type === 'STATE_SYNC' && event.data.state) {
      isReceiving = true;
      try {
        if (typeof onRemoteStateReceived === 'function') {
          onRemoteStateReceived(event.data.state);
        }
      } finally {
        setTimeout(() => {
          isReceiving = false;
        }, 50);
      }
    }
  };
}

export function broadcastOperationState(state) {
  if (!channel || isReceiving) return;
  try {
    channel.postMessage({ type: 'STATE_SYNC', state });
  } catch (err) {
    console.warn('HOP: Erro na sincronizacao entre abas:', err);
  }
}

export function resetRemoteOperationState(initialState) {
  broadcastOperationState(initialState);
}
