import * as esbuild from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

const outdir = "dist";

const buildOptions: esbuild.BuildOptions = {
  entryPoints: [
    { in: "src/background.ts", out: "background" },
    { in: "src/options/options.ts", out: "options" },
  ],
  bundle: true,
  format: "iife",
  target: "firefox115",
  outdir,
  logLevel: "info",
};

const staticFiles: ReadonlyArray<readonly [string, string]> = [
  ["src/manifest.json", `${outdir}/manifest.json`],
  ["src/options/options.html", `${outdir}/options.html`],
  ["src/options/options.css", `${outdir}/options.css`],
  ["src/_locales", `${outdir}/_locales`],
];

async function copyStaticFiles(): Promise<void> {
  await Promise.all(
    staticFiles.map(([from, to]) => cp(from, to, { recursive: true })),
  );
}

async function prepareOutputDirectory(): Promise<void> {
  await rm(outdir, { recursive: true, force: true });
  await mkdir(outdir, { recursive: true });
}

const watch = process.argv.includes("--watch");

await prepareOutputDirectory();

if (watch) {
  const context = await esbuild.context({
    ...buildOptions,
    plugins: [
      {
        name: "copy-static-files",
        setup(build) {
          build.onEnd(copyStaticFiles);
        },
      },
    ],
  });
  await context.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(buildOptions);
  await copyStaticFiles();
}
