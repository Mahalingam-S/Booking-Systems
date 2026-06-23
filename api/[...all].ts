import type { IncomingMessage, ServerResponse } from "http";
import app from "../artifacts/api-server/src/app";

export default (req: IncomingMessage, res: ServerResponse) => {
  // Ensure req.url starts with /api so Express router can match it if Vercel strips it
  if (req.url && !req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? "" : "/") + req.url;
  }

  return app(req, res);
};
