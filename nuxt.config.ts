import icons from "./app/icons.ts";
import { SITE } from "./shared/utils/site.ts";

export default defineNuxtConfig({
  modules: [
    "@nuxt/ui",
    "@nuxt/icon",
    "nuxt-ui-colors-no-inline",
    "@nuxthub/core"
  ],

  $development: {
    app: {
      head: {
        script: [
          { src: SITE.twitch.extension.helper }
        ]
      }
    },

    routeRules: {
      "/panel.html": { proxy: "/extension/panel" },
      "/config.html": { proxy: "/extension/config" }
    }
  },

  $env: {
    twitch: {
      modules: [
        "./modules/twitch/bundle-extension"
      ],

      ui: {
        colorMode: false,
        prose: true
      },

      app: {
        cdnURL: "./",
        head: {
          htmlAttrs: {
            class: "dark"
          },
          script: [
            { src: SITE.twitch.extension.helper }
          ]
        }
      },

      routeRules: {
        "/panel": { proxy: "/extension/panel" },
        "/config": { proxy: "/extension/config" }
      },

      hub: false,

      experimental: {
        entryImportMap: false,
        payloadExtraction: false,
        renderJsonPayloads: false
      },

      nitro: {
        prerender: {
          routes: ["/panel", "/config"],
          ignore: ["/200.html", "/404.html"]
        }
      },

      vite: {
        $client: {
          build: {
            rolldownOptions: {
              output: {
                codeSplitting: false
              }
            }
          }
        }
      }
    }
  },

  $production: {
    nitro: {
      preset: "cloudflare-module",
      experimental: {
        websocket: true
      }
    }
  },

  devtools: { enabled: true },

  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "Donobits",
      htmlAttrs: {
        lang: "en"
      }
    }
  },

  css: [
    "~/assets/css/ui.tailwind.css"
  ],

  ui: {
    colorMode: true,
    fonts: true,
    theme: {
      colors: ["primary", "error", "bits100"]
    },
    colors: {
      primary: "amber",
      neutral: "zinc",
      bits100: "purple"
    }
  },

  runtimeConfig: {},

  routeRules: {
    "/api/donoclip/**": {
      headers: {
        "Access-Control-Allow-Origin": SITE.twitch.extension.host,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      }
    }
  },

  features: {
    inlineStyles: false
  },

  experimental: {
    typedPages: true
  },

  compatibilityDate: "2026-09-16",

  nitro: {
    prerender: {
      autoSubfolderIndex: false,
      crawlLinks: false
    }
  },

  hub: {
    blob: true
  },

  icon: {
    mode: "css",
    provider: "none",
    clientBundle: {
      icons
    },
    customCollections: [
      { prefix: "twitch", dir: "./app/assets/icons" }
    ]
  }
});
