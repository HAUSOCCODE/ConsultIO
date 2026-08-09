import Notification from "../models/Notification.js";

export async function getNotifications(req, res) {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100),
    Notification.countDocuments({ recipient: req.user.id, isRead: false }),
  ]);
  res.json({ notifications, unreadCount });
}

export async function markAllNotificationsRead(req, res) {
  await Notification.updateMany(
    { recipient: req.user.id, isRead: false },
    { isRead: true, readAt: new Date() },
  );
  res.json({ message: "All notifications marked as read." });
}

export async function markNotificationRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { isRead: true, readAt: new Date() },
    { new: true },
  );
  if (!notification)
    return res.status(404).json({ message: "Notification not found." });
  res.json({ notification });
}
