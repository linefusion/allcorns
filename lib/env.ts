declare global {
  const Allcorns: {
    testing: boolean;
  };
}

const Allcorns = {
  testing: Deno.args.find((arg) => arg == "--test") ? true : false,
};

function log(...args: unknown[]) {
  return;
}

Deno.test(
  new Proxy(
    {
      name: "Allcorns",
      ignore: true,
      fn: () => {},
    } as any,
    {
      apply(target, thisArg, argArray) {
        log("apply", { target, thisArg, argArray });
        Allcorns.testing = true;
        return Reflect.apply(target, thisArg, argArray);
      },
      construct(target, argArray, newTarget) {
        log("construct", { target, argArray, newTarget });
        Allcorns.testing = true;
        return Reflect.construct(target, argArray, newTarget);
      },
      defineProperty(target, property, attributes) {
        log("defineProperty", { target, property, attributes });
        Allcorns.testing = true;
        return Reflect.defineProperty(target, property, attributes);
      },
      deleteProperty(target, property) {
        log("deleteProperty", { target, property });
        Allcorns.testing = true;
        return Reflect.deleteProperty(target, property);
      },
      get(target, property, receiver) {
        log("get", property, { target, property, receiver });
        Allcorns.testing = true;
        return Reflect.get(target, property, receiver);
      },
      getOwnPropertyDescriptor(target, property) {
        log("getOwnPropertyDescriptor", { target, property });
        Allcorns.testing = true;
        return Reflect.getOwnPropertyDescriptor(target, property);
      },
      getPrototypeOf(target) {
        log("getPrototypeOf", { target });
        Allcorns.testing = true;
        return Reflect.getPrototypeOf(target);
      },
      has(target, property) {
        log("has", { target, property });
        Allcorns.testing = true;
        return Reflect.has(target, property);
      },
      isExtensible(target) {
        log("isExtensible", { target });
        Allcorns.testing = true;
        return Reflect.isExtensible(target);
      },
      ownKeys(target) {
        log("ownKeys", { target });
        Allcorns.testing = true;
        return Reflect.ownKeys(target);
      },
      preventExtensions(target) {
        log("preventExtensions", { target });
        Allcorns.testing = true;
        return Reflect.preventExtensions(target);
      },
      set(target, property, value, receiver) {
        log("set", { target, property, value, receiver });
        Allcorns.testing = true;
        return Reflect.set(target, property, value, receiver);
      },
      setPrototypeOf(target, value) {
        log("setPrototypeOf", { target, value });
        Allcorns.testing = true;
        return Reflect.setPrototypeOf(target, value);
      },
    }
  ) as any
);

Object.defineProperty(globalThis, "Allcorns", {
  value: Allcorns,
});
