import type { IncomingMessage, ServerResponse } from "http";
import app from "../artifacts/api-server/src/app";

export default (req: IncomingMessage, res: ServerResponse) => {
  // When Vercel rewrites /api/(.*) to /api/index.ts, Express sees req.url as /api/index.ts
  // This restores the original URL (e.g. /api/bookings/schedule) so Express routing works
  const urlPath = req.url?.split("?")[0];
  if (urlPath === "/api/index.ts" || urlPath === "/api") {
    const originalPath = req.headers["x-invoke-path"];
    if (typeof originalPath === "string") {
      const queryIndex = req.url!.indexOf("?");
      const queryString = queryIndex !== -1 ? req.url!.substring(queryIndex) : "";
      req.url = encodeURI(originalPath) + queryString;
    }
  }
  
  // Ensure the URL starts with /api so Express router can match it
  if (req.url && !req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? "" : "/") + req.url;
  }

  return app(req, res);
};
