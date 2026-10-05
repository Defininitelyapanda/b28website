import assert from "node:assert/strict";
import test from "node:test";
import { resizeGeometry, rotationDelta } from "../../lib/transform-geometry.ts";

test("edge handles change only their own dimension", () => {
  assert.deepEqual(resizeGeometry(200, 100, 30, 40, "e"), { width: 230, height: 100, left: 0, top: 0 });
  assert.deepEqual(resizeGeometry(200, 100, 30, 40, "s"), { width: 200, height: 140, left: 0, top: 0 });
  assert.deepEqual(resizeGeometry(200, 100, 30, 40, "nw"), { width: 170, height: 60, left: 30, top: 40 });
});
test("resizing a rotated element keeps the opposite edge anchored", () => {
  const resized = resizeGeometry(200, 100, 0, 20, "e", 90);
  assert.equal(resized.width, 220); assert.equal(resized.height, 100);
  assert.ok(Math.abs(resized.left + 10) < 0.001); assert.ok(Math.abs(resized.top - 10) < 0.001);
  assert.equal(resizeGeometry(200, 100, -500, 0, "e").width, 24);
});
test("rotation handles cross the angle boundary without a 360 degree jump", () => {
  assert.equal(rotationDelta(1, 0, 0, 1, 0, 0), 90);
  assert.ok(Math.abs(rotationDelta(-10, 1, -10, -1, 0, 0)) < 12);
});
