type AnyCallback = (...args: any) => any;

export class Subscribable<TListener extends AnyCallback> {

  protected listeners = new Set<TListener>();

  constructor() {
    this.subscribe = this.subscribe.bind(this);
  }

  public subscribe(listener: TListener): () => void {
    this.listeners.add(listener);

    this.onSubscribe();

    return () => {
      this.listeners.delete(listener);
      this.onUnsubscribe();
    };
  }

  protected notifyListeners(...params: Parameters<TListener>) {
    this.listeners.forEach((listener) => listener(...params));
  }

  public hasListeners(): boolean {
    return this.listeners.size > 0;
  }

  public clearAllListeners() {
    this.listeners.clear();

    this.onUnsubscribe();
  }

  protected onSubscribe() {
    // For inheritance
  }

  protected onUnsubscribe() {
    // For inheritance
  }

}
