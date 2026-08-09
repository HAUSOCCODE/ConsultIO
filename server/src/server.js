import mongoose from "mongoose";
import app from "./app.js";
import { env, validateEnv } from "./config/env.js";
import { ensureAdmin } from "./controllers/authController.js";

async function start() {
  validateEnv();
  await mongoose.connect(env.mongoUri);
  // One-time compatibility migration: only fill fields absent from the initial schema.
  await mongoose.model("User").updateMany(
    {
      role: { $in: ["student", "faculty"] },
      registrationStatus: { $exists: false },
    },
    [
      {
        $set: {
          registrationStatus: {
            $cond: ["$isApproved", "Approved", "Pending"],
          },
          accountStatus: { $cond: ["$isActive", "Active", "Inactive"] },
        },
      },
    ],
  );
  await mongoose
    .model("User")
    .updateMany(
      { role: "admin", registrationStatus: { $exists: false } },
      { $set: { registrationStatus: "Approved", accountStatus: "Active" } },
    );
  await ensureAdmin();
  app.listen(env.port, () =>
    console.log(`ConsultIO API listening on port ${env.port}`),
  );
}
start().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
