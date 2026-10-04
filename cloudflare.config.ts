import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "b28-entertainment-platform",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-04",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    env: {
      ASSETS: bindings.assets(),
      NEXT_PUBLIC_SITE_URL: bindings.text("https://b28-entertainment-platform.tonniekye.workers.dev"),
      CMS_DB: bindings.d1({ name: "b28-cms" }),
      CMS_MEDIA: bindings.r2({ name: "b28-media" }),
    },
  }),
});
