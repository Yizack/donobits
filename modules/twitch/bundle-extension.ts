import { createWriteStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ZipArchive } from "archiver";
import { defineNuxtModule } from "nuxt/kit";
import type {} from "@nuxt/nitro-server/augments";

const EXTENSION_PAGES = ["/extension/panel", "/extension/config"];

export default defineNuxtModule({
  hooks: {
    "pages:extend": (pages) => {
      const buildPages = EXTENSION_PAGES;

      pages.splice(0, pages.length,
        ...pages.filter(page => buildPages.includes(page.path))
      );
    },
    "nitro:build:public-assets": async (nitro) => {
      const files = EXTENSION_PAGES.map(page => page.replace("/extension/", "") + ".html");

      for (const file of files) {
        const htmlPath = resolve(nitro.options.output.publicDir, file);
        let html = await readFile(htmlPath, "utf8");
        const match = html.match(/<script>window\.__NUXT__=.*?<\/script>/s);
        if (!match) continue;

        const inlineScript = match[0];
        const scriptContent = inlineScript
          .replace(/^<script>/, "")
          .replace(/<\/script>$/, "");

        const configFile = file.replace(".html", "-nuxt-config.js");
        const configPath = resolve(nitro.options.output.publicDir, configFile);

        await writeFile(configPath, scriptContent, "utf8");

        html = html.replace(
          inlineScript,
          `<script src="./${configFile}"></script>`
        );

        await writeFile(htmlPath, html, "utf8");
      }

      const archive = new ZipArchive();
      const archivePath = resolve(nitro.options.output.dir, "extension.zip");
      const archiveOutput = createWriteStream(archivePath);

      await new Promise<void>((finish, fail) => {
        archiveOutput.once("close", finish);
        archiveOutput.once("error", fail);
        archive.once("error", fail);
        archive.pipe(archiveOutput);
        archive.directory(nitro.options.output.publicDir, false);
        void archive.finalize();
      });
    }
  }
});
