import assert from "node:assert/strict";
import test from "node:test";
import { contentPath } from "../../lib/content-url.ts";

test("maps every CMS content type to its public destination", () => {
  assert.equal(contentPath("page", "press"), "/press");
  assert.equal(contentPath("project", "new-film"), "/work/new-film");
  assert.equal(contentPath("article", "field-notes"), "/journal/field-notes");
  assert.equal(contentPath("service", "production"), "/services#production");
  assert.equal(contentPath("team", "director"), "/about#director");
});
