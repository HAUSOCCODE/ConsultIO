import Task from "../models/Task.js";
import Appointment from "../models/Appointment.js";
import { logActivity, notify } from "../services/activityService.js";

export async function getTasks(req, res) {
  const query =
    req.user.role === "student"
      ? { student: req.user.id }
      : { faculty: req.user.id };
  const tasks = await Task.find(query)
    .populate("student faculty", "name email")
    .populate("appointment", "subject startAt")
    .sort({ createdAt: -1 });
  res.json({ tasks });
}

export async function createTask(req, res) {
  const appointment = await Appointment.findOne({
    _id: req.body.appointmentId,
    faculty: req.user.id,
  });
  if (!appointment)
    return res.status(404).json({ message: "Consultation not found." });
  const task = await Task.create({
    student: appointment.student,
    faculty: req.user.id,
    appointment: appointment.id,
    title: req.body.title,
    description: req.body.description,
    dueAt: req.body.dueAt || undefined,
  });
  await Promise.all([
    notify(
      appointment.student,
      "task",
      "New Action Item Assigned",
      task.title,
      task.id,
    ),
    logActivity("task_assigned", req.user.id, "Task", task.id),
  ]);
  res.status(201).json({ message: "Follow-up action item assigned.", task });
}

export async function completeTask(req, res) {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, student: req.user.id, status: "Pending" },
    { status: "Completed" },
    { new: true },
  );
  if (!task)
    return res.status(404).json({ message: "Pending task not found." });
  await Promise.all([
    notify(
      task.faculty,
      "task",
      "Action Item Completed",
      `${req.user.name} completed an action item.`,
      task.id,
    ),
    logActivity("task_completed", req.user.id, "Task", task.id),
  ]);
  res.json({ message: "Task marked as completed.", task });
}
