import "allcorns/env.ts";

import {
  compare as semverCompare,
  parse as semverParse,
  isSemVer as semverIsSemVer,
  format as semverFormat,
} from "https://deno.land/std@0.200.0/semver/mod.ts";
import { SemVer } from "https://deno.land/std@0.200.0/semver/types.ts";
import { RegistryClientV2 } from "https://deno.land/x/docker_registry_client@v0.4.1/registry-client-v2.ts";

export const $ = {
  fetchTags,
  isSemVerLike,
  isSemVer,
  fetchSemVerTags,
  semverCompare,
  semverParse,
  semverIsSemVer,
  semverFormat,
  RegistryClientV2,
  tryParseSemVer,
  inferSemVer,
};

/**
 * TODO:
 *  Eventually replace this with something that returns both the tag
 *  and the architectures that the tag supports to automatically infer
 *  which platforms the Acorn image should support.
 * */
export async function fetchTags(name: string, registry?: string) {
  const client = new $.RegistryClientV2({ name });
  const { tags } = await client.listTags();
  return tags.sort();
}

export function isSemVerLike(value: string) {
  try {
    return !!$.semverParse($.inferSemVer(value));
  } catch {
    return false;
  }
}
export function isFullSemVer(value: string) {
  try {
    return !!$.semverParse(value);
  } catch {
    return false;
  }
}

export function isSemVer<T extends unknown>(
  value: T | SemVer
): value is SemVer {
  return $.semverIsSemVer(value);
}

export function inferSemVer(tag: string) {
  if ($.tryParseSemVer(tag)) {
    return tag;
  } else if ($.tryParseSemVer(`${tag}.0`)) {
    return `${tag}.0`;
  } else if ($.tryParseSemVer(`${tag}.0.0`)) {
    return `${tag}.0.0`;
  }
  return tag;
}

export function tryParseSemVer(tag: string): SemVer | false {
  try {
    return $.semverParse(tag);
  } catch {
    return false;
  }
}

// TODO: return 1 semver with many associated tags, like "version 10.0.0" -> "10, 10.0, 10.0.0"
export async function fetchSemVerTags(name: string, registry?: string) {
  const tags = await $.fetchTags(name, registry);
  return tags
    .filter($.isSemVerLike)
    .map((tag) => ({
      tag,
      version: $.semverParse(inferSemVer(tag)),
    }))
    .sort((a, b) => $.semverCompare(a.version, b.version));
}

export function expandSemVerTags(
  tag: string | SemVer,
  tags: string[] = [],
  withLatest = false
) {
  if (typeof tag === "string") {
    if (!isSemVerLike) {
      throw new Error("Tag has invalid semver format.");
    }
    tag = $.semverParse($.inferSemVer(tag));
  }

  const list: string[] = [];

  if (tags && tags?.length > 0) {
    const versions = Array.from(
      new Set(
        tags
          .filter($.isSemVerLike)
          .map($.inferSemVer)
          .map($.semverParse)
          .map((version) => ({
            ...version,
            toString() {
              return $.semverFormat(version, "full");
            },
          }))
      )
    )
      .sort($.semverCompare)
      .reverse();

    let latest = true;
    const existingTags = new Set();

    for (const version of versions) {
      const current = [
        `${version.major}`,
        `${version.major}.${version.minor}`,
        `${version.major}.${version.minor}.${version.patch}`,
      ];

      if ($.semverCompare(version, tag) !== 0) {
        latest = false;
        for (const tag of current) {
          existingTags.add(tag);
        }
        continue;
      }

      for (const tag of current) {
        if (!existingTags.has(tag)) {
          list.push(tag);
        }
      }

      if (withLatest && latest) {
        list.push("latest");
      }
      break;
    }
  } else {
    list.push(`${tag.major}`);
    list.push(`${tag.major}.${tag.minor}`);
    list.push(`${tag.major}.${tag.minor}.${tag.patch}`);
    if (withLatest) {
      list.push("latest");
    }
  }

  return list;
}
