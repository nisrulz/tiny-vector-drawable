// ---------------------------------------------------------------------------
// TaskQueue: runs async tasks with a concurrency limit.
// Optimization is CPU-heavy and single-threaded, so running a bounded number
// of items at a time keeps the UI responsive when many files are dropped at
// once (a bare loop would start every task in the same tick).
// ---------------------------------------------------------------------------
export class TaskQueue {
  constructor(concurrency = 2) {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new Error(`concurrency must be a positive integer, got ${concurrency}`);
    }
    this.concurrency = concurrency;
    this._queue = [];
    this._active = 0;
  }

  get pending() {
    return this._queue.length + this._active;
  }

  // Adds a task; resolves/rejects when the task finishes.
  enqueue(task) {
    return new Promise((resolve, reject) => {
      this._queue.push({ task, resolve, reject });
      this._drain();
    });
  }

  // Drops queued (not yet started) tasks. In-flight tasks keep running.
  clear() {
    const dropped = this._queue.splice(0);
    for (const entry of dropped) entry.resolve();
    return dropped.length;
  }

  _drain() {
    while (this._active < this.concurrency && this._queue.length > 0) {
      const { task, resolve, reject } = this._queue.shift();
      this._active += 1;
      Promise.resolve()
        .then(task)
        .then(resolve, reject)
        .finally(() => {
          this._active -= 1;
          this._drain();
        });
    }
  }
}
