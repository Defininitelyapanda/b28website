import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");

// Hosting volumes are mounted only after the build finishes. Keep prerendering
// on the checkout filesystem even when the host injects runtime CMS paths.
const result = spawnSync(process.execPath, [nextCli, "build"], {
  env: { ...process.env, B28_BUILD_PHASE: "1" },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
