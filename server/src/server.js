import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

async function start() {
  await connectDatabase();
  app.listen(env.port, () =>
    console.log(`ConsultIO API listening on port ${env.port}`),
  );
}
start().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
