import "allcorns/env.ts";

export type MaybePromise<T> = T | PromiseLike<T>;

export function isPromise<T extends unknown>(
  value: T | PromiseLike<T>
): value is PromiseLike<T> {
  if (!value) {
    return false;
  }
  if (typeof value !== "object") {
    return false;
  }
  if (!("then" in value)) {
    return false;
  }
  return typeof value.then === "function";
}

export function not<
  Func extends (...args: unknown[]) => boolean | PromiseLike<boolean>
>(fn: (...args: Parameters<Func>) => ReturnType<Func>): Func {
  return <Func>((...args: Parameters<Func>) => {
    const ret: boolean | PromiseLike<boolean> = fn(...args);
    if (isPromise(ret)) {
      return ret.then((value) => !value);
    }
    return !ret;
  });
}
