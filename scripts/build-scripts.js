import { build } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function buildContentScripts() {
  console.log("Bundling contentScript.ts -> dist/content.js (IIFE)...");
  await build({
    configFile: false,
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "src"),
      },
    },
    build: {
      emptyOutDir: false,
      outDir: path.resolve(rootDir, "dist"),
      lib: {
        entry: path.resolve(rootDir, "src/content/contentScript.ts"),
        name: "TrackAuditContent",
        formats: ["iife"],
        fileName: () => "content.js",
      },
    },
  });

  console.log("Bundling runtimeInspector.ts -> dist/runtime-injected.js (IIFE)...");
  await build({
    configFile: false,
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "src"),
      },
    },
    build: {
      emptyOutDir: false,
      outDir: path.resolve(rootDir, "dist"),
      lib: {
        entry: path.resolve(rootDir, "src/content/runtimeInspector.ts"),
        name: "TrackAuditRuntime",
        formats: ["iife"],
        fileName: () => "runtime-injected.js",
      },
    },
  });

  console.log("Standalone scripts compiled successfully!");
}

buildContentScripts().catch((err) => {
  console.error("Build content scripts failed:", err);
  process.exit(1);
});
