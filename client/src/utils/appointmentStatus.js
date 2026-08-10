export const AWAITING_FACULTY_UPDATE = "Awaiting Faculty Update";

export function isAwaitingFacultyUpdate(appointment, now = new Date()) {
  if (appointment?.status !== "Approved") return false;
  const endAt = new Date(appointment.endAt);
  const currentTime = now instanceof Date ? now : new Date(now);
  return (
    Number.isFinite(endAt.getTime()) &&
    Number.isFinite(currentTime.getTime()) &&
    currentTime.getTime() > endAt.getTime()
  );
}

export function getAppointmentDisplayStatus(appointment, now = new Date()) {
  return isAwaitingFacultyUpdate(appointment, now)
    ? AWAITING_FACULTY_UPDATE
    : appointment?.status || "Pending";
}
