
export function shallowEqualObjects<T extends Record<string, any>>(
  a: T,
  b: T,
): boolean {
  for (const key in a) {
    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
}

export type UpdaterFn<TValue> = (prev: TValue | null) => TValue | null;

export const isUpdaterFn = <TValue>(
  value: TValue | UpdaterFn<TValue> | null,
): value is UpdaterFn<TValue> => typeof value === 'function';


export function isValueChanged(oldValue: unknown, newValue: unknown) {
  if (oldValue === newValue) {
    return false;
  }

  if (typeof oldValue !== typeof newValue) {
    return true;
  }

  if (typeof oldValue === 'object' && oldValue !== null) {
    return !shallowEqualObjects(oldValue, newValue as object);
  }

  return true;
}

export function noop() {}
