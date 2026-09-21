import { createWriteStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ZipArchive } from "archiver";
import { addServerHandler, createResolver, defineNuxtModule } from "nuxt/kit";
import type {} from "@nuxt/nitro-server/augments";

export default defineNuxtModule({
  meta: {
    name: "twitch-extension",
    configKey: "twitchExtension"
  },
  defaults: {
    helperScript: "https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js",
    pages: {
      dirname: "extension",
      routes: ["panel", "config"]
    },
    ebs: {
      dirname: "ebs"
    }
  },
  setup (options, nuxt) {
    nuxt.options.routeRules ||= {};

    // Twitch options
    if (nuxt.options.envName === "twitch") {
      nuxt.options.app.cdnURL = "./";
      nuxt.options.app.head.script ||= [];
      nuxt.options.app.head.script.push({ src: options.helperScript });

      // @ts-expect-error Nuxt Hub options
      nuxt.options.hub = false;
      // @ts-expect-error Nuxt UI options
      nuxt.options.ui ||= {};
      // @ts-expect-error Nuxt UI options
      nuxt.options.ui.colorMode = false;

      nuxt.options.experimental.entryImportMap = false;
      nuxt.options.experimental.payloadExtraction = false;
      nuxt.options.experimental.renderJsonPayloads = false;

      for (const page of options.pages.routes) {
        nuxt.options.routeRules[`/${page}`] = { proxy: `/${options.pages.dirname}/${page}` };
      }

      nuxt.options.nitro.prerender ||= {};
      nuxt.options.nitro.prerender.routes ||= [];
      nuxt.options.nitro.prerender.routes.push(...options.pages.routes.map(page => `/${page}`));
      nuxt.options.nitro.prerender.ignore ||= [];
      nuxt.options.nitro.prerender.ignore.push("/200.html", "/404.html");

      nuxt.hook("pages:extend", (pages) => {
        const buildPages = options.pages.routes.map(page => `/${options.pages.dirname}/${page}`);

        pages.splice(0, pages.length,
          ...pages.filter(page => buildPages.includes(page.path))
        );
      });

      nuxt.hook("nitro:build:public-assets", async (nitro) => {
        const files = options.pages.routes.map(page => page.replace("/" + options.pages.dirname + "/", "") + ".html");

        // Modify the built HTML files to extract the inline Nuxt config into separate files
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

        // Create a ZIP archive of the built public assets for the Twitch extension
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
      });
    }

    // Development options
    if (nuxt.options.envName === "development") {
      nuxt.options.app.head.script ||= [];
      nuxt.options.app.head.script.push({ src: options.helperScript });

      // Set up .html route rules for the Twitch extension local testing
      for (const page of options.pages.routes) {
        nuxt.options.routeRules[`/${page}.html`] = { proxy: `/${options.pages.dirname}/${page}` };
      }

    }

    // Production options
    if (nuxt.options.envName === "production") {
      nuxt.options.routeRules["/api/ebs/**"] = {
        headers: {
          "Access-Control-Allow-Origin": options.helperScript
        }
      };

      const resolver = createResolver(import.meta.url);
      addServerHandler({
        middleware: true,
        method: "options",
        handler: resolver.resolve("./runtime/server/middleware/ebs-preflight")
      });

      // In production, extend the pages to exclude the ones that are part of the Twitch extension.
      nuxt.hook("pages:extend", (pages) => {
        pages.splice(0, pages.length,
          ...pages.filter(page => !options.pages.routes.map(page => `/${options.pages.dirname}/${page}`).includes(page.path))
        );
      });
    }
  }
});
