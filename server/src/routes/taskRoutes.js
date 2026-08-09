import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  completeTask,
  createTask,
  getTasks,
} from "../controllers/taskController.js";
const router = Router();
router.use(authenticate, authorize("student", "faculty"));
router.get("/", getTasks);
router.post("/", authorize("faculty"), createTask);
router.put("/:id/complete", authorize("student"), completeTask);
export default router;
