export const SITE = {
  name: "Donobits",
  domain: "donobits.yizack.com",
  twitch: {
    extension: {
      products: ["AUDIO"]
    }
  },
  host: import.meta.dev ? "http://localhost:5173" : "https://donobits.yizack.com",
  cdn: import.meta.dev ? "http://localhost:5173" : "https://cdn.yizack.com"
};
