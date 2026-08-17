import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the FC26 career tracker definition", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>FC26 Career Console<\/title>/i);
  assert.match(html, /Manual career-mode tracking for FC26 console saves\./);
  assert.match(html, /No CareerMode\.xyz cloning/);
  assert.match(html, /Desktop web comes first/);
  assert.match(html, /SoFIFA-Assisted Data/);
  assert.match(html, /Scrape carefully or do not scrape\./);
  assert.match(html, /Feature Backlog/);
  assert.match(html, /MVP/);
  assert.match(html, /v1/);
  assert.match(html, /Later/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});

test("keeps product definition and starter cleanup in sync", async () => {
  const [page, layout, productDefinition] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/product-definition.md", import.meta.url), "utf8"),
  ]);

  assert.match(page, /FC26 Career Console/);
  assert.match(layout, /FC26 Career Console/);
  assert.match(productDefinition, /It is not a CareerMode\.xyz clone/);
  assert.match(productDefinition, /Desktop web is the primary MVP platform/);
  assert.match(productDefinition, /SoFIFA data is optional reference data/);

  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await assert.rejects(access(new URL("../app/_sites-preview/preview.css", import.meta.url)));
  await assert.rejects(access(new URL("../public/_sites-preview", templateRoot)));
});
