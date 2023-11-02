import "allcorns/env.ts";

import {
  compare as semverCompare,
  parse as semverParse,
  isSemVer as semverIsSemVer,
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

export function expandSemVerTags(tag: string | SemVer) {
  if (typeof tag === "string") {
    if (!isSemVerLike) {
      throw new Error("Tag has invalid semver format.");
    }
    tag = $.semverParse($.inferSemVer(tag));
  }
  return [
    `${tag.major}`,
    `${tag.major}.${tag.minor}`,
    `${tag.major}.${tag.minor}.${tag.patch}`,
  ];
}

// TODO: make a function to return a smarter tag distribution, like:
/*
  [
    [ "14", "14.0", "14.0.0" ],
    [ "14", "14.1", "14.1.0" ],
    [ "14", "14.2", "14.2.0" ],
    [ "14", "14.3", "14.3.0" ],
    [ "14", "14.4", "14.4.0" ],
    [ "14", "14.5", "14.5.0" ],
    [ "14", "14.6", "14.6.0" ],
    [ "14", "14.7", "14.7.0" ],
    [ "14", "14.8", "14.8.0" ],
    [ "14", "14.9", "14.9.0" ],
    [ "15", "15.0", "15.0.0" ],
    [ "15", "15.1", "15.1.0" ],
    [ "15", "15.2", "15.2.0" ],
    [ "15", "15.3", "15.3.0" ],
    [ "15", "15.4", "15.4.0" ],
    [ "16", "16.0", "16.0.0" ]
  ]

  ->

  [
    [ "14.0", "14.0.0" ],
    [ "14.1", "14.1.0" ],
    [ "14.2", "14.2.0" ],
    [ "14.3", "14.3.0" ],
    [ "14.4", "14.4.0" ],
    [ "14.5", "14.5.0" ],
    [ "14.6", "14.6.0" ],
    [ "14.7", "14.7.0" ],
    [ "14.8", "14.8.0" ],
    [ "14", "14.9", "14.9.0" ],
    [ "15.0", "15.0.0" ],
    [ "15.1", "15.1.0" ],
    [ "15.2", "15.2.0" ],
    [ "15.3", "15.3.0" ],
    [ "15", "15.4", "15.4.0" ],
    [ "16", "16.0", "16.0.0" ]
  ]

  */
