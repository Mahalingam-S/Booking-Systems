import type { IncomingMessage, ServerResponse } from "http";
import app from "../artifacts/api-server/src/app";

export default (req: IncomingMessage, res: ServerResponse) => {
  console.log(`[Vercel API] Incoming request: ${req.url}, Method: ${req.method}`);
  
  if (req.url && !req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? "" : "/") + req.url;
  }

  return app(req, res);
};
