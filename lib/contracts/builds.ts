import "allcorns/env.ts";

import { _common } from "https://deno.land/std@0.204.0/path/_common/common.ts";

export type Build = {
  name: string;
  root?: string;
  acornfile?: string;
  tags: string[];
  // registry?: string;
  args?: Record<string, any>;
};

export type BuildArgs<T extends object> = {
  [K in keyof T]: T[K] extends readonly [...any] | [...any]
    ? T[K][number]
    : T[K];
};

export function createMatrix<const T extends object>(
  matrix: T
): BuildArgs<T>[] {
  if (typeof matrix !== "object") {
    throw new Error("Matrix must be an object");
  }

  matrix = Object.fromEntries(
    Object.entries(matrix).map(([key, value]) => [
      key,
      Array.isArray(value) ? value : [value],
    ])
  ) as T;

  const entries = Object.entries(matrix);
  if (entries.length === 0) {
    return [] as BuildArgs<T>[];
  }

  function* expandMatrix<T>(items: T[][]): Generator<T[]> {
    const others = items.length > 1 ? expandMatrix(items.slice(1)) : [[]];
    for (const other of others) {
      for (const head of items.at(0)!) {
        yield [head, ...other];
      }
    }
  }

  const keys = Object.keys(matrix);
  const values = Object.values(matrix);

  const builds = [...expandMatrix(values)].map((args) => {
    const build: Record<string, unknown> = {};
    for (const index in args) {
      build[keys[index]] = args[index];
    }
    return build;
  });

  return builds as BuildArgs<T>[];
}

export function defineBuilds(...builds: Build[]) {
  const tagRegistry: Record<string, boolean> = {};
  builds = builds.map((build) => {
    if (!build.tags?.length) {
      throw new Error("Invalid build tags");
    }

    for (const tag of build.tags) {
      if (tagRegistry[tag]) {
        throw new Error(
          `Duplicate build tag "${tag}" in Acorn "${
            build.name
          }".\n${Deno.inspect(builds)}`
        );
      }
    }

    if (typeof build.args !== "object" || Array.isArray(build.args)) {
      throw new Error(`Invalid build args format.`);
    }

    for (const tag of build.tags) {
      tagRegistry[tag] = true;
    }

    return {
      name: build.name,
      tags: build.tags,
      root: build.root || "./root",
      acornfile: build.acornfile || "./Acornfile",
      // registry: build.registry || "docker.io",
      args: build.args || {},
    };
  });

  return builds;
}
