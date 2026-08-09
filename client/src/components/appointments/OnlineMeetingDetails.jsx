export default function OnlineMeetingDetails({
  appointment,
  allowLink = false,
  actionLabel = "Open Meeting Link",
  emptyLinkText = "Not provided yet",
}) {
  if (appointment.consultationMode !== "Online") return null;

  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h3 className="mb-4 font-bold text-maroon-900">Online Meeting</h3>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Meeting Platform
          </dt>
          <dd className="mt-1 break-words text-sm text-slate-800">
            {appointment.meetingPlatform || "Meeting platform not provided"}
          </dd>
        </div>
        {allowLink && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Meeting Link
            </dt>
            <dd className="mt-1 break-all text-sm text-slate-800">
              {appointment.meetingLink || emptyLinkText}
            </dd>
          </div>
        )}
      </dl>
      {allowLink && appointment.meetingLink && (
        <a
          href={appointment.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-4 inline-flex"
        >
          {actionLabel}
        </a>
      )}
    </section>
  );
}
