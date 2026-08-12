import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  createAvailability,
  deleteAvailability,
  getAvailableFaculty,
  getFacultyAvailability,
  getAvailabilityDetails,
  getMyAvailability,
  getAppointmentRequestSchedules,
  requestFacultyReschedule,
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
router.get(
  "/request-schedules",
  authenticate,
  authorize("faculty"),
  getAppointmentRequestSchedules,
);
router.get(
  "/:id/details",
  authenticate,
  authorize("faculty"),
  getAvailabilityDetails,
);
router.put(
  "/:id/appointments/:appointmentId/request-reschedule",
  authenticate,
  authorize("faculty"),
  requestFacultyReschedule,
);
router.post("/", authenticate, authorize("faculty"), createAvailability);
router.put("/:id", authenticate, authorize("faculty"), updateAvailability);
router.delete("/:id", authenticate, authorize("faculty"), deleteAvailability);

export default router;
