import {
  expandSemVerTags,
  fetchSemVerTags,
  isFullSemVer,
} from "allcorns/tags.ts";
import { defineAcorn } from "allcorns/contracts/config.ts";
import { defineBuilds, createMatrix } from "allcorns/contracts/builds.ts";

const testTags = [
  {
    tag: "6.0.0",
    version: {
      major: 6,
      minor: 0,
      patch: 0,
      prerelease: [],
      build: [],
    },
  },
];

export async function fetchRedisTags() {
  const tags = Allcorns.testing
    ? testTags
    : (await fetchSemVerTags("redis")).filter((tag) => {
        return (
          isFullSemVer(tag.tag) &&
          tag.version.major >= 7 &&
          tag.version.minor >= 2 &&
          !tag.version.prerelease.length &&
          !tag.version.build.length
        );
      });

  return tags.map((tag) => tag.tag);
}

export default defineAcorn(import.meta, async () => {
  const redisTags = await fetchRedisTags();

  const matrix = createMatrix({ redisTag: redisTags });
  const builds = defineBuilds(
    ...matrix.map((values) => ({
      name: `redis-${values.redisTag}`,
      tags: expandSemVerTags(values.redisTag, redisTags, true),
      args: {
        build: {
          image: `redis:${values.redisTag}`,
        },
      },
    }))
  );

  return {
    builds,
  };
});
