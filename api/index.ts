import type { IncomingMessage, ServerResponse } from "http";
import app from "../artifacts/api-server/src/app";
import { parse } from "url";

export default (req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = parse(req.url || "", true);
  
  if (parsedUrl.query.vpath) {
    let newPath = "/api/" + parsedUrl.query.vpath;
    delete parsedUrl.query.vpath;
    
    // Reconstruct query string
    const queryKeys = Object.keys(parsedUrl.query);
    if (queryKeys.length > 0) {
      const searchParams = new URLSearchParams();
      for (const key of queryKeys) {
        const val = parsedUrl.query[key];
        if (Array.isArray(val)) {
          val.forEach(v => searchParams.append(key, v));
        } else if (val) {
          searchParams.append(key, val);
        }
      }
      newPath += "?" + searchParams.toString();
    }
    
    req.url = newPath;
  } else if (req.url && !req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? "" : "/") + req.url;
  }

  return app(req, res);
};
