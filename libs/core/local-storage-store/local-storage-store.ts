import { Subscribable } from '../base';
import { isUpdaterFn, isValueChanged, noop, UpdaterFn } from '../utils';


const isSSR = typeof window === 'undefined';

const storageArea = !isSSR ? window.localStorage : null;

export type LocalStorageParser<TValue> = (data: string | null) => TValue | null;
export type LocalStorageSerializer<TValue> = (data: TValue | null) => string;

export type Subscriber<TValue> = (value: TValue | null) => void;

export interface LocalStorageOptions<TValue> {
  /**
   * @throws
   * 
   * Used to transform value from string (or null) to the derivative type you need
   * 
   * Parsers may **throw errors**. This feature is suitable for validation.
   * If value in _LocalStorage_ seems to be invalid, throw an error while parsing
   * 
   * @example
   * ```ts
   * import { z } from 'zod';
   * ...
   * parser: z.coerce.number().parse
   * ```
   * 
   * @default 
   * 
   * JSON.parse with null check
   */
  parser?: LocalStorageParser<TValue>;
  serializer?: LocalStorageSerializer<TValue>;

  defaultValue?: TValue | null;

  throwOnError?: boolean;

  /**
   * #### NOTE:
   * Callback argument cannot be typed as `Error` here,
   * cause we don't really know what you may throw
   * 
   * For example, `zod` throws `ZodError`, but since `zod@4` `ZodError` no longer 
   * extends Error
   */
  onError?: (error: unknown) => void;
}

const defaultParser: LocalStorageParser<unknown> = (data) => {
  if (!data) {
    return null;
  }

  return JSON.parse(data);
};

/**
 * TODO: Translate
 * 
 * При изменении LocalStorage, браузер отправит event во все ДРУГИЕ вкладки
 *
 * В текущую вкладку событие не отправляется.
 * Чтобы обеспечить синхронизацию значений внутри одной страницы, самостоятельно создаем event
 */
function dispatchStorageEvent(key: string, newValue: string | null, oldValue: string | null) {
  window.dispatchEvent(
    new StorageEvent('storage', { key, oldValue, storageArea, newValue }),
  );
}


const defaultOptions: Required<LocalStorageOptions<any>> = {
  parser: defaultParser,
  serializer: JSON.stringify,

  defaultValue: null,

  throwOnError: false,
  onError: noop,
};

export class LocalStorageStore<TValue = string> extends Subscribable<Subscriber<TValue>> {

  private options: Required<LocalStorageOptions<TValue>> = defaultOptions;

  constructor(
    private readonly key: string,
    options: LocalStorageOptions<TValue> = {},
  ) {
    super();
    this.patchOptions(options);
    this.bindMethods();

    if (isSSR) return;

    this.setDefaultValue();
  }

  private bindMethods() {
    this.getCurrentValue = this.getCurrentValue.bind(this);
    this.clearValue = this.clearValue.bind(this);
    this.setValue = this.setValue.bind(this);
    this.patchOptions = this.patchOptions.bind(this);
  }

  private setDefaultValue() {
    const { defaultValue, serializer } = this.options;

    try {
      const isNoValue = localStorage.getItem(this.key) === null;

      if (isNoValue && defaultValue !== null) {
        const serialized = serializer(defaultValue);

        localStorage.setItem(this.key, serialized);
        dispatchStorageEvent(this.key, serialized, null);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  public patchOptions(options: Partial<LocalStorageOptions<TValue>>) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  public getCurrentValue(): TValue | null {
    if (isSSR) return this.options.defaultValue;

    try {
      const stored = localStorage.getItem(this.key);
      const parsed = this.options.parser(stored);

      return parsed;
    } catch (error) {
      this.handleError(error);

      return null;
    }
  }


  public setValue(valueOrUpdater: TValue | UpdaterFn<TValue> | null): boolean {
    if (isSSR) return false;

    if (valueOrUpdater === null) {
      return this.clearValue();
    }

    try {
      const serializedOldValue = localStorage.getItem(this.key);

      const newValue = isUpdaterFn(valueOrUpdater)
        ? valueOrUpdater(this.options.parser(serializedOldValue))
        : valueOrUpdater;

      const serializedNewValue = this.options.serializer(newValue);

      localStorage.setItem(this.key, serializedNewValue);
      dispatchStorageEvent(this.key, serializedNewValue, serializedOldValue);

      return true;
    } catch (error) {
      this.handleError(error);

      return false;
    }
  }

  public clearValue() {
    if (isSSR) return false;

    const oldValue = localStorage.getItem(this.key);

    localStorage.removeItem(this.key);

    dispatchStorageEvent(this.key, null, oldValue);

    return true;
  }

  private handleError(error: unknown) {
    this.options.onError(error);

    if (this.options.throwOnError) {
      throw error;
    }
  }

  private handleStorageChange = (event: StorageEvent) => {
    if (event.key !== this.key || event.storageArea !== storageArea) return;

    try {
      const isChanged = isValueChanged(event.oldValue, event.newValue);

      if (!isChanged) {
        return;
      }

      const parsed = this.options.parser(event.newValue);

      this.notifyListeners(parsed);
    } catch (error: unknown) {
      this.handleError(error);
    }
  };

  protected onSubscribe(): void {
    // Subscribe to real DOM event only one time
    if (this.listeners.size === 1) {
      window.addEventListener('storage', this.handleStorageChange);
    }
  }

  protected onUnsubscribe(): void {
    if (!this.hasListeners()) {
      window.removeEventListener('storage', this.handleStorageChange);
    }
  }

}
