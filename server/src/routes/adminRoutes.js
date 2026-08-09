import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  approveRegistration,
  changeAdminPassword,
  getAdminAppointments,
  getRegistration,
  getRegistrations,
  getUser,
  getUsers,
  rejectRegistration,
  resetUserPassword,
  updateUserStatus,
} from "../controllers/adminController.js";

const router = Router();
router.use(authenticate, authorize("admin"));
router.get("/registrations", getRegistrations);
router.get("/registrations/:id", getRegistration);
router.put("/registrations/:id/approve", approveRegistration);
router.put("/registrations/:id/reject", rejectRegistration);
router.get("/users", getUsers);
router.get("/users/:id", getUser);
router.put("/users/:id/reset-password", resetUserPassword);
router.put("/users/:id/status", updateUserStatus);
router.get("/appointments", getAdminAppointments);
router.put("/settings/password", changeAdminPassword);

export default router;
