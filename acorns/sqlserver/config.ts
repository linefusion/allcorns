import { fetchTags } from "allcorns/tags.ts";
import { defineAcorn } from "allcorns/contracts/config.ts";
import { defineBuilds, createMatrix } from "allcorns/contracts/builds.ts";

const testTags = ["2019-latest"];

export async function fetchSqlServerTags() {
  let tags = Allcorns.testing
    ? testTags
    : await fetchTags("mcr.microsoft.com/mssql/server");

  tags = tags.filter((tag) => {
    const parts = tag.split("-");
    if (parts.length < 2) {
      return false;
    }

    if (parseInt(parts[0]) < 2019) {
      return false;
    }

    if (parts[1] !== "latest") {
      return false;
    }

    return true;
  });

  return tags;
}

export default defineAcorn(import.meta, async () => {
  const tags = await fetchSqlServerTags();

  const matrix = createMatrix({ tags });

  const builds = defineBuilds(
    ...matrix.map((values) => ({
      name: `sqlserver-${values.tags}`,
      tags: [values.tags],
      args: {
        build: {
          image: `mcr.microsoft.com/mssql/server:${values.tags}`,
        },
      },
    }))
  );

  console.log(builds);

  return {
    builds,
  };
});
