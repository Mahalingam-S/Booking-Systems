import app from "./app";
import { logger } from "./lib/logger";

const port = 5000;

app.listen(port, () => {
  logger.info({ port }, "Server listening");
}).on("error", (err: any) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});
