import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const action = process.argv[2];
const productionUrl = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
  ? process.env.NEXT_PUBLIC_SITE_URL
  : "https://b28website.tonniekye.workers.dev";

let cli;
let args;
if (action === "build") {
  const packageFile = require.resolve("vite/package.json");
  cli = path.join(path.dirname(packageFile), "bin", "vite.js");
  args = ["build"];
} else if (action === "deploy") {
  const deployModule = fileURLToPath(
    import.meta.resolve("@vinext/cloudflare/internal/deploy"),
  );
  cli = path.join(path.dirname(deployModule), "cli.js");
  args = ["deploy"];
} else {
  throw new Error("Expected vinext action: build or deploy");
}

rmSync(path.join(process.cwd(), ".next"), { recursive: true, force: true });
const result = spawnSync(process.execPath, [cli, ...args], {
  env: { ...process.env, NEXT_PUBLIC_SITE_URL: productionUrl },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
