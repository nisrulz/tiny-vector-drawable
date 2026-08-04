// ---------------------------------------------------------------------------
// Item: the domain model for one uploaded drawable. Pure data + state machine,
// with no DOM dependencies so it can be unit-tested in Node.
// ---------------------------------------------------------------------------
export const STATUS = Object.freeze({
  QUEUED: 'queued',
  OPTIMIZING: 'optimizing',
  DONE: 'done',
  ERROR: 'error',
});

export class Item {
  constructor({ id, name, original, sourceBytes = 0 }) {
    this.id = id;
    this.name = name;
    this.original = original;
    this.sourceBytes = sourceBytes;
    this.optimized = null;
    this.error = null;
    this.token = 0; // bumped on reset(); stale optimize results are dropped
    this._status = STATUS.QUEUED;
  }

  get status() {
    return this._status;
  }

  isPending() {
    return this._status === STATUS.QUEUED || this._status === STATUS.OPTIMIZING;
  }

  markOptimizing() {
    this._status = STATUS.OPTIMIZING;
  }

  succeed(optimized) {
    this.optimized = optimized;
    this.error = null;
    this._status = STATUS.DONE;
  }

  fail(message) {
    this.error = message;
    this.optimized = null;
    this._status = STATUS.ERROR;
  }

  reset() {
    this.optimized = null;
    this.error = null;
    this.token += 1;
    this._status = STATUS.QUEUED;
  }
}

export function summarizeItems(items) {
  const summary = { pending: 0, successful: 0, failed: 0 };
  for (const item of items) {
    if (item.isPending()) summary.pending += 1;
    else if (item.status === STATUS.DONE) summary.successful += 1;
    else summary.failed += 1;
  }
  return summary;
}
