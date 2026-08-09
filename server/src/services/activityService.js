import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";
export const logActivity = (
  action,
  actor,
  targetType,
  targetId,
  details = {},
) =>
  AuditLog.create({
    action,
    actor: actor || undefined,
    targetType,
    targetId,
    details,
  }).catch(console.error);
export const notify = (recipient, type, title, message, relatedEntityId) =>
  Notification.create({
    recipient,
    type,
    title,
    message,
    relatedEntityId,
  }).catch(console.error);
