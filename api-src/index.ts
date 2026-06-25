import type { IncomingMessage, ServerResponse } from "http";
import app from "../artifacts/api-server/src/app";


export default (req: IncomingMessage, res: ServerResponse) => {
  // Use WHATWG URL API
  const host = req.headers.host || "localhost";
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const parsedUrl = new URL(req.url || "", `${protocol}://${host}`);
  
  const vpath = parsedUrl.searchParams.get("vpath");
  if (vpath) {
    parsedUrl.pathname = "/api/" + vpath;
    parsedUrl.searchParams.delete("vpath");
    req.url = parsedUrl.pathname + parsedUrl.search;
  } else if (req.url && !req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? "" : "/") + req.url;
  }

  return app(req, res);
};
