import { createWriteStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ZipArchive } from "archiver";
import { addServerHandler, createResolver, defineNuxtModule, hasNuxtModule } from "nuxt/kit";
import type { ModuleOptions, NuxtTwitchExtensionOptions } from "./types.ts";
import type {} from "@nuxt/nitro-server/augments";

export type { ModuleOptions, NuxtTwitchExtensionOptions };

export default defineNuxtModule<NuxtTwitchExtensionOptions>({
  meta: {
    name: "twitch-extension",
    configKey: "twitchExtension"
  },
  defaults: {
    helperScript: "https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js",
    clientId: "",
    filename: "extension.zip",
    pages: {
      dirname: "extension"
    },
    ebs: {
      dirname: "ebs"
    }
  },
  moduleDependencies (nuxt) {
    if (nuxt.options.envName === "twitchExtension") {
      if (hasNuxtModule("@nuxt/ui")) {
        // @ts-expect-error Nuxt UI options
        nuxt.options.ui ||= {};
        // @ts-expect-error Nuxt UI Color Mode
        nuxt.options.ui.colorMode = false;
      }

      if (hasNuxtModule("@nuxthub/core")) {
        // @ts-expect-error Nuxt Hub options
        nuxt.options.hub = false;
      }
    }
    return {};
  },
  setup (options, nuxt) {
    nuxt.options.routeRules ||= {};
    const extensionBuildPaths: string[] = [];
    const extensionPages: string[] = [];

    nuxt.hook("pages:extend", (pages) => {
      extensionBuildPaths.push(
        ...pages.filter(page => page.path.startsWith(`/${options.pages.dirname}/`)).map(page => page.path)
      );
      extensionPages.push(
        ...extensionBuildPaths.map(path => path.split(`/${options.pages.dirname}/`)[1])
      );
    });

    // Twitch options
    if (nuxt.options.envName === "twitchExtension") {
      nuxt.options.app.cdnURL = nuxt.options.runtimeConfig.app.cdnURL = "./";
      nuxt.options.app.head.script ||= [];
      nuxt.options.app.head.script.push({ src: options.helperScript });

      nuxt.options.experimental.entryImportMap = false;
      nuxt.options.experimental.payloadExtraction = false;
      nuxt.options.experimental.renderJsonPayloads = false;

      nuxt.options.nitro.prerender ||= {};
      nuxt.options.nitro.prerender.ignore ||= [];
      nuxt.options.nitro.prerender.ignore.push("/200.html", "/404.html");

      nuxt.hook("pages:extend", (pages) => {
        nuxt.options.routeRules ||= {};
        for (const page of extensionPages) {
          nuxt.options.routeRules[`/${page}`] = { proxy: `/${options.pages.dirname}/${page}` };
        }

        nuxt.options.nitro.prerender ||= {};
        nuxt.options.nitro.prerender.routes ||= [];
        nuxt.options.nitro.prerender.routes.push(...extensionPages.map(page => `/${page}`));

        pages.splice(0, pages.length,
          ...pages.filter(page => extensionBuildPaths.includes(page.path))
        );
      });

      nuxt.options.vite ||= {};
      nuxt.options.vite.build ||= {};
      nuxt.options.vite.build.rolldownOptions ||= {};
      nuxt.options.vite.build.rolldownOptions.output = {
        codeSplitting: {
          groups: [{ name: "vendor", test: /node_modules[\\/]/ }]
        }
      };

      nuxt.hook("nitro:build:public-assets", async (nitro) => {
        const files = extensionPages.map(page => page + ".html");

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
        const archivePath = resolve(nitro.options.output.dir, options.filename);
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
      for (const page of extensionPages) {
        nuxt.options.routeRules[`/${page}.html`] = { proxy: `/${options.pages.dirname}/${page}` };
      }
    }

    // Production options
    if (nuxt.options.envName === "production" && !nuxt.options._prepare) {
      options.clientId ||= process.env.NUXT_TWITCH_EXTENSION_CLIENT_ID;

      if (!options.clientId) {
        throw new Error("Twitch Extension Client ID is required for production.");
      }

      nuxt.options.routeRules["/api/ebs/**"] = {
        headers: {
          "Access-Control-Allow-Origin": `https://${options.clientId}.ext-twitch.tv`
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
          ...pages.filter(page => !extensionPages.map(page => `/${options.pages.dirname}/${page}`).includes(page.path))
        );
      });
    }
  }
});
