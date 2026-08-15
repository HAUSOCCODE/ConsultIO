import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { getPublicStats } from "../controllers/publicController.js";
import { chatWithPublicAi } from "../controllers/publicAiController.js";
const router = Router();
const publicAiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many AI Guide requests. Please wait a moment and try again.",
  },
});
router.post("/ai/chat", publicAiRateLimit, chatWithPublicAi);
router.get("/stats", getPublicStats);
export default router;
