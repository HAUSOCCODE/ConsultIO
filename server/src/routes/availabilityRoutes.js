import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createAvailability,
  deleteAvailability,
  getAvailableFaculty,
  getFacultyAvailability,
  getMyAvailability,
  updateAvailability,
} from "../controllers/availabilityController.js";

const router = Router();
router.get("/faculty", authenticate, authorize("student"), getAvailableFaculty);
router.get(
  "/faculty/:facultyId",
  authenticate,
  authorize("student", "faculty"),
  getFacultyAvailability,
);
router.get("/mine", authenticate, authorize("faculty"), getMyAvailability);
router.post("/", authenticate, authorize("faculty"), createAvailability);
router.put("/:id", authenticate, authorize("faculty"), updateAvailability);
router.delete("/:id", authenticate, authorize("faculty"), deleteAvailability);

export default router;
