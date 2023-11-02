import "allcorns/env.ts";

import { fetchSemVerTags, isFullSemVer } from "allcorns/tags.ts";
import { defineAcorn } from "allcorns/contracts/config.ts";
import { defineBuilds, createMatrix } from "allcorns/contracts/builds.ts";

const testTags = [
  {
    tag: "10.7.1",
    version: {
      major: 10,
      minor: 7,
      patch: 1,
      prerelease: [],
      build: [],
    },
  },
];

export async function fetchDirectusTags() {
  const tags = Allcorns.testing
    ? testTags
    : (await fetchSemVerTags("directus/directus")).filter((tag) => {
        return (
          isFullSemVer(tag.tag) &&
          tag.version.major >= 10 &&
          !tag.version.prerelease.length &&
          !tag.version.build.length
        );
      });

  return tags.map((tag) => tag.tag);
}

export default defineAcorn(import.meta, async () => {
  const directusTags = await fetchDirectusTags();

  const args = createMatrix({ directusTag: directusTags });
  const builds = defineBuilds(
    ...args.map((args) => ({
      name: `directus-${args.directusTag}`,
      tags: [args.directusTag],
      args: {
        build: {
          image: `directus/directus:${args.directusTag}`,
        },
      },
    }))
  );

  return {
    builds,
  };
});
