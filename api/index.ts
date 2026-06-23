import type { IncomingMessage, ServerResponse } from "http";
import app from "../artifacts/api-server/src/app";

export default (req: IncomingMessage, res: ServerResponse) => {
  // When Vercel rewrites /api/(.*) to /api/index.ts, Express sees req.url as /api/index.ts
  // This restores the original URL (e.g. /api/bookings/schedule) so Express routing works
  const originalPath = req.headers["x-invoke-path"];
  if (typeof originalPath === "string" && req.url) {
    const queryIndex = req.url.indexOf("?");
    const queryString = queryIndex !== -1 ? req.url.substring(queryIndex) : "";
    req.url = encodeURI(originalPath) + queryString;
  }
  return app(req, res);
};
