import type { IncomingMessage, ServerResponse } from "http";
import app from "../artifacts/api-server/src/app";

export default (req: IncomingMessage, res: ServerResponse) => {
  // When Vercel rewrites /api/(.*) to /api/index.ts, Express sees req.url as /api/index.ts
  // This restores the original URL (e.g. /api/bookings/schedule) so Express routing works
  if (req.url === "/api/index.ts" || req.url === "/api") {
    const originalPath = req.headers["x-invoke-path"];
    if (typeof originalPath === "string") {
      req.url = encodeURI(originalPath) + (req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "");
    }
  }
  return app(req, res);
};
