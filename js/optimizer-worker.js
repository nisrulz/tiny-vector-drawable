import { optimizeVectorDrawable } from './optimizer.js';

const pending = [];
let running = false;

self.addEventListener('message', ({ data }) => {
  if (data.type === 'clear') {
    pending.length = 0;
    return;
  }
  if (data.type !== 'optimize') return;
  pending.push(data);
  runNext();
});

async function runNext() {
  if (running || pending.length === 0) return;
  running = true;
  const job = pending.shift();
  self.postMessage({ type: 'started', id: job.id, token: job.token });

  try {
    const optimized = await optimizeVectorDrawable(job.xml, { pretty: job.pretty });
    self.postMessage({ type: 'done', id: job.id, token: job.token, optimized });
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    self.postMessage({
      type: 'error',
      id: job.id,
      token: job.token,
      error: message.slice(0, 500),
    });
  } finally {
    running = false;
    setTimeout(runNext, 0);
  }
}
