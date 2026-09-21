import { defineEventHandler, setResponseHeaders } from "h3";

export default defineEventHandler((event) => {
  if (event.method !== "OPTIONS" || !event.path.startsWith("/api/ebs/")) return;

  setResponseHeaders(event, {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Channel-Id"
  });
});
