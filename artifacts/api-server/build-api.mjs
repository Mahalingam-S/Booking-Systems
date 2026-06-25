import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import fs from "node:fs";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

async function buildApi() {
  const apiDir = path.resolve(artifactDir, "../../api");
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir);
  }

  await esbuild({
    entryPoints: [path.resolve(artifactDir, "../../api-src/index.ts")],
    platform: "node",
    bundle: true,
    format: "esm",
    outdir: apiDir,
    logLevel: "info",
    external: [
      "express",
      "cors",
      "mongoose",
      "pino",
      "pino-http",
      "google-auth-library",
      "nodemailer",
      "dotenv"
    ],
    sourcemap: "linked",
    plugins: [
      esbuildPluginPino({ transports: ["pino-pretty"] })
    ],
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
  });
}

buildApi().catch((err) => {
  console.error(err);
  process.exit(1);
});
