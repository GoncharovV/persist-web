import React from 'react';

import { LocalStorageOptions, LocalStorageStore } from '../core';


const emptyOptions = {};

export type UseLocalStorageStoreOptions<TValue = string> = LocalStorageOptions<TValue>;

export function useLocalStorageStore<TValue = string>(
  key: string,
  options: UseLocalStorageStoreOptions<TValue> = emptyOptions,
) {
  const [storage] = React.useState(() => new LocalStorageStore(key, options));

  // getSnapshot result must be same to avoid infinite rerenders
  // (in case if value is an object)
  // But React.useRef does not allow to provide callback for initialization
  // so just make "ref" with state hook
  const [valueRef] = React.useState(() => ({ current: storage.getCurrentValue() }));

  React.useEffect(() => {
    storage.patchOptions(options);
  }, [storage, options]);

  const value = React.useSyncExternalStore(
    React.useCallback((notify) => {
      return storage.subscribe((newValue) => {
        valueRef.current = newValue;
        notify();
      });
    }, [storage, valueRef]),
    () => valueRef.current,
    () => valueRef.current,
  );

  return [value, storage.setValue] as const;
}
