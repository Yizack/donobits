const TWITCH_EXTENSION_ID = "iczpztdlcdn2gck79hs41x3dzo27g0";

export const SITE = {
  name: "Donobits",
  domain: "donobits.yizack.com",
  twitch: {
    extension: {
      host: `https://${TWITCH_EXTENSION_ID}.ext-twitch.tv`,
      helper: "https://extension-files.twitch.tv/helper/v1/twitch-ext.min.js"
    }
  },
  host: import.meta.dev ? "http://localhost:5173" : "https://donobits.yizack.com",
  cdn: import.meta.dev ? "http://localhost:5173" : "https://cdn.yizack.com"
};
