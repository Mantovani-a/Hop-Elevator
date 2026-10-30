import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker, isMainThread, parentPort, BroadcastChannel } from 'node:worker_threads';
import { setTimeout as delay } from 'node:timers/promises';

// Separate in-memory browser contexts exercise the real store and channel
// without reading or changing the demonstration data in the user's browser.
if (!isMainThread) {
  const values = new Map();
  globalThis.window = Object.assign(new EventTarget(), {
    BroadcastChannel,
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
    setInterval,
    clearInterval,
  });

  const { getOperationSnapshot, subscribeOperationState, updateOperationOccurrence } = await import('../src/data/operationStore.js');
  subscribeOperationState(() => {
    parentPort.postMessage({
      type: 'update',
      state: getOperationSnapshot(),
      persisted: JSON.parse(values.get('hop-shared-operation-v5')),
    });
  });
  parentPort.on('message', ({ id, description }) => {
    updateOperationOccurrence(id, (occurrence) => ({ ...occurrence, description }));
  });
  parentPort.postMessage({ type: 'ready', state: getOperationSnapshot() });
} else {
  const waitForMessage = (worker, predicate) => new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      worker.off('message', onMessage);
      worker.off('error', onError);
      worker.off('exit', onExit);
    };
    const onMessage = (message) => {
      if (!predicate(message)) return;
      cleanup();
      resolve(message);
    };
    const onError = (error) => { cleanup(); reject(error); };
    const onExit = (code) => onError(new Error(`Sync context exited before delivering an update (${code})`));
    const timer = setTimeout(() => onError(new Error('Timed out waiting for realtime synchronization')), 5000);
    worker.on('message', onMessage);
    worker.once('error', onError);
    worker.once('exit', onExit);
  });

  test('operational updates synchronize both ways, persist and notify listeners without a visual badge', async (t) => {
    const workers = [new Worker(new URL(import.meta.url)), new Worker(new URL(import.meta.url))];
    t.after(() => Promise.all(workers.map((worker) => worker.terminate())));
    const [first, second] = await Promise.all(workers.map((worker) => waitForMessage(worker, (message) => message.type === 'ready')));
    const occurrence = first.state.occurrences[0];
    assert.ok(second.state.occurrences.some((item) => item.id === occurrence.id));

    for (const [sender, receiver, description] of [
      [workers[0], workers[1], 'Validação de sincronização: Control para Client'],
      [workers[1], workers[0], 'Validação de sincronização: Client para Operator'],
    ]) {
      const received = waitForMessage(receiver, (message) => message.type === 'update'
        && message.state.occurrences.some((item) => item.id === occurrence.id && item.description === description));
      sender.postMessage({ id: occurrence.id, description });
      const message = await received;
      const synced = message.state.occurrences.find((item) => item.id === occurrence.id);
      assert.equal(synced.description, description);
      assert.equal(synced.workflowStatus, occurrence.workflowStatus);
      assert.equal(message.persisted.occurrences.find((item) => item.id === occurrence.id).description, description);
      // The existing transport suppresses echoes for 50 ms after reception.
      await delay(60);
    }
  });
}
