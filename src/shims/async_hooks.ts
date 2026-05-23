export class AsyncLocalStorage<T = any> {
  getStore(): T | undefined {
    return undefined;
  }
  run<R>(store: T, callback: () => R): R {
    return callback();
  }
  exit<R>(callback: () => R): R {
    return callback();
  }
  enterWith(store: T): void {
    // no-op for browser environment
  }
}
