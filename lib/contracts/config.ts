import "allcorns/env.ts";

import { MaybePromise } from "../utils.ts";
import { Build } from "./builds.ts";

export type Acorn = {
  builds: Build[];
};

export type AcornConfigFunction = () => MaybePromise<Acorn>;

export interface AcornConfigBuilder {
  meta: ImportMeta;
  (): MaybePromise<Acorn>;
}

export function defineAcorn(meta: ImportMeta, fn: AcornConfigFunction) {
  return Object.assign(fn, { meta });
}
