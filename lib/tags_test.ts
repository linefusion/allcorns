import { fetchTags, inferSemVer } from "allcorns/tags.ts";
import { stub } from "https://deno.land/std@0.204.0/testing/mock.ts";
import { assertEquals } from "https://deno.land/std@0.204.0/assert/assert_equals.ts";

Deno.test("tags test", async () => {
  const mock = stub(globalThis, "fetch", function (input, init) {
    if (typeof input == "object" && "pathname" in input) {
      if (input.pathname == "/v2/directus/directus/tags/list") {
        return Promise.resolve(
          new Response(JSON.stringify({ tags: ["10.0.0"] }))
        );
      }
    }

    return Promise.resolve(new Response(""));
  });

  try {
    const tags = await fetchTags("directus/directus");
    assertEquals(tags, ["10.0.0"]);
  } finally {
    mock.restore();
  }

  assertEquals(inferSemVer("10"), "10.0.0");
});
