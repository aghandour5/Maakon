export interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  loadedAt: number | null;
}

export class AdminResource<T> {
  private state: ResourceState<T> = {
    data: null,
    loading: false,
    refreshing: false,
    error: null,
    loadedAt: null,
  };
  private listeners = new Set<() => void>();
  private current?: { controller: AbortController; promise: Promise<void> };
  constructor(
    private fetchData: (signal: AbortSignal) => Promise<T>,
    private now = Date.now,
  ) {}
  snapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(change: Partial<ResourceState<T>>) {
    this.state = { ...this.state, ...change };
    this.listeners.forEach((listener) => listener());
  }
  invalidate() {
    this.current?.controller.abort();
    this.current = undefined;
    this.update({ loadedAt: null, loading: false, refreshing: false });
  }
  load(force = false): Promise<void> {
    if (this.current) return this.current.promise;
    if (
      !force &&
      this.state.loadedAt !== null &&
      this.now() - this.state.loadedAt < 30_000
    )
      return Promise.resolve();
    const controller = new AbortController();
    const promise = Promise.resolve()
      .then(() => this.fetchData(controller.signal))
      .then((data) => {
        if (!controller.signal.aborted)
          this.update({ data, loadedAt: this.now(), error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const failure =
          error instanceof Error ? error : new Error(String(error));
        this.update({ error: failure });
        throw failure;
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          this.current = undefined;
          this.update({ loading: false, refreshing: false });
        }
      });
    this.current = { controller, promise };
    this.update({
      loading: this.state.data === null,
      refreshing: this.state.data !== null,
      error: null,
    });
    return promise;
  }
}

// Multiple resources can discover the same session failure concurrently.
export function oncePerSession<T>(notify: (value: T) => void) {
  let sent = false;
  return (value: T) => {
    if (!sent) {
      sent = true;
      notify(value);
    }
  };
}
export function refreshResources(
  resources: Record<string, { load: (force: boolean) => Promise<void> }>,
) {
  const entries = Object.entries(resources);
  return Promise.allSettled(
    entries.map(([, resource]) => resource.load(true)),
  ).then((results) =>
    results.flatMap((r, i) =>
      r.status === "rejected"
        ? [
            `${entries[i][0]}: ${r.reason instanceof Error ? r.reason.message : r.reason}`,
          ]
        : [],
    ),
  );
}
