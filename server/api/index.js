import app from "../src/app.js";
import { connectDatabase } from "../src/config/database.js";

export default async function handler(req, res) {
  try {
    await connectDatabase();
    return app(req, res);
  } catch (error) {
    console.error("Unable to initialize the ConsultIO API:", error.message);
    if (!res.headersSent)
      return res.status(500).json({ message: "Unable to start the API." });
    return undefined;
  }
}
