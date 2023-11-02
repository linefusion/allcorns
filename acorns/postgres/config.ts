import {
  expandSemVerTags,
  fetchSemVerTags,
  inferSemVer,
} from "allcorns/tags.ts";
import { defineAcorn } from "allcorns/contracts/config.ts";
import { defineBuilds, createMatrix } from "allcorns/contracts/builds.ts";

const testTags = [
  {
    tag: "16.0",
    version: {
      major: 16,
      minor: 0,
      patch: 0,
      prerelease: [],
      build: [],
    },
  },
];

export async function fetchPostgresTags() {
  const tags = Allcorns.testing
    ? testTags
    : (await fetchSemVerTags("postgres")).filter((tag) => {
        return (
          tag.version.major >= 16 &&
          !tag.version.build.length &&
          !tag.version.prerelease.length
        );
      });

  const unique = new Map();
  for (const tag of tags) {
    unique.set(inferSemVer(tag.tag), tag.tag);
  }

  return Array.from(unique.values());
}

export default defineAcorn(import.meta, async () => {
  const postgresTags = await fetchPostgresTags();

  const matrix = createMatrix({ postgresTag: postgresTags });

  const builds = defineBuilds(
    ...matrix.map((values) => ({
      name: `postgres-${values.postgresTag}`,
      tags: expandSemVerTags(values.postgresTag),
      args: {
        build: {
          image: `postgres:${values.postgresTag}`,
        },
      },
    }))
  );

  return {
    builds,
  };
});
