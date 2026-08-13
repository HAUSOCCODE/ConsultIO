import DashboardOverview from "../../components/dashboard/DashboardOverview";

export default function StudentDashboard() {
  return (
    <DashboardOverview
      endpoint="/dashboard/student"
      recentKey="recentAppointments"
      recentTitle="Recent Appointments"
      recentLink={{ to: "/student/appointments", label: "View all" }}
      primaryAction={{ to: "/student/book", label: "Book Consultation" }}
      excludedStats={["assignedTasks"]}
      statLinks={{
        upcomingAppointments: "/student/appointments",
        pendingAppointments: "/student/appointments",
        completedConsultations: "/student/history",
        unreadNotifications: "/student/notifications",
      }}
      statGrid="student"
      summaryPageSize={4}
    />
  );
}
