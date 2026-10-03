import assert from "node:assert/strict";
import test from "node:test";
import { isProjectUpload, parseYouTubeFeed } from "../../lib/youtube-feed.ts";

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
  <entry><yt:videoId>abcdefghijk</yt:videoId><title>New Film &amp; Story</title><link rel="alternate" href="https://www.youtube.com/watch?v=abcdefghijk"/><published>2026-10-03T12:00:00+00:00</published><media:description>A Kenyan story.</media:description></entry>
  <entry><yt:videoId>lmnopqrstuv</yt:videoId><title>New Film Trailer</title><link rel="alternate" href="https://www.youtube.com/watch?v=lmnopqrstuv"/><published>2026-10-02T12:00:00+00:00</published><media:description>Coming soon.</media:description></entry>
  <entry><yt:videoId>12345678901</yt:videoId><title>A short clip</title><link rel="alternate" href="https://www.youtube.com/shorts/12345678901"/><published>2026-10-01T12:00:00+00:00</published><media:description></media:description></entry>
</feed>`;

test("parses YouTube's Atom upload feed", () => {
  const uploads = parseYouTubeFeed(feed);
  assert.equal(uploads.length, 3);
  assert.equal(uploads[0].title, "New Film & Story");
  assert.equal(uploads[0].videoId, "abcdefghijk");
});

test("keeps full uploads and excludes trailers and Shorts", () => {
  const projects = parseYouTubeFeed(feed).filter(isProjectUpload);
  assert.deepEqual(projects.map((project) => project.videoId), ["abcdefghijk"]);
});
