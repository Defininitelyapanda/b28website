export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export function resizeGeometry(width: number, height: number, dx: number, dy: number, handle: ResizeHandle, angle = 0) {
  const radians = angle * Math.PI / 180;
  const localX = dx * Math.cos(radians) + dy * Math.sin(radians);
  const localY = -dx * Math.sin(radians) + dy * Math.cos(radians);
  const nextWidth = handle.includes("e") ? Math.max(24, width + localX) : handle.includes("w") ? Math.max(24, width - localX) : width;
  const nextHeight = handle.includes("s") ? Math.max(24, height + localY) : handle.includes("n") ? Math.max(24, height - localY) : height;
  const centerX = (nextWidth - width) / 2 * (handle.includes("w") ? -1 : 1);
  const centerY = (nextHeight - height) / 2 * (handle.includes("n") ? -1 : 1);
  return { width: nextWidth, height: nextHeight, left: centerX * Math.cos(radians) - centerY * Math.sin(radians) - (nextWidth - width) / 2, top: centerX * Math.sin(radians) + centerY * Math.cos(radians) - (nextHeight - height) / 2 };
}

export function rotationDelta(startX: number, startY: number, x: number, y: number, centerX: number, centerY: number) {
  const degrees = (Math.atan2(y - centerY, x - centerX) - Math.atan2(startY - centerY, startX - centerX)) * 180 / Math.PI;
  return ((degrees + 540) % 360) - 180;
}
