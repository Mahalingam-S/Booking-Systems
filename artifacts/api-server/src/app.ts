import express, { type Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import type { IncomingMessage, ServerResponse } from "http";
import router from "./routes";
import { logger } from "./lib/logger";

import path from "path";

const app: Express = express();

const loggingMiddleware = (pinoHttp as any)({
  logger,
  serializers: {
    req(req: IncomingMessage & { id?: string | number }) {
      return {
        id: req.id,
        method: req.method,
        url: req.url?.split("?")[0],
      };
    },
    res(res: ServerResponse) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

app.use(loggingMiddleware);
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve static files from the frontend's build folder
const publicPath = path.resolve(process.cwd(), "artifacts/lab-booking/dist");
app.use(express.static(publicPath));

// Handle SPA routing for any non-API routes
app.use((req: any, res: any, next: any) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(publicPath, "index.html"));
});

// JSON Error Handler for API routes
app.use((err: any, req: any, res: any, next: any) => {
  console.error("API Error:", err);
  if (req.path.startsWith("/api")) {
    res.status(500).json({ error: err.message || "Internal Server Error" });
  } else {
    next(err);
  }
});

export default app;
