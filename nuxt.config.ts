import icons from "./app/icons.ts";

export default defineNuxtConfig({
  modules: [
    "./modules/twitch-extension",
    "@nuxt/ui",
    "@nuxt/icon",
    "nuxt-ui-colors-no-inline",
    "@nuxthub/core"
  ],

  $development: {
    ui: {
      prose: true
    }
  },

  $env: {
    twitchExtension: {
      ui: {
        prose: true
      }
    }
  },

  $production: {
    nitro: {
      preset: "cloudflare-durable",
      experimental: {
        websocket: true
      }
    }
  },

  devtools: { enabled: false },

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

  colorMode: {
    preference: "dark",
    fallback: "dark"
  },

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

  runtimeConfig: {
    twitchExtension: {
      clientId: "",
      secret: ""
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
