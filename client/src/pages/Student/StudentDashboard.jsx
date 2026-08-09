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
    />
  );
}
