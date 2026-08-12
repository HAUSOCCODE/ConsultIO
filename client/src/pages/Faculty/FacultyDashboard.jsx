import DashboardOverview from "../../components/dashboard/DashboardOverview";

export default function FacultyDashboard() {
  return (
    <DashboardOverview
      endpoint="/dashboard/faculty"
      recentKey="recentRequests"
      recentTitle="Recent Appointment Requests"
      recentLink={{ to: "/faculty/requests", label: "View all" }}
      statLinks={{
        todayAppointments: "/faculty/appointments",
        pendingRequests: "/faculty/requests",
        weeklyConsultations: "/faculty/appointments",
        completedConsultations: "/faculty/history",
        availableSchedules: "/faculty/availability",
      }}
      statGrid="faculty"
    />
  );
}
