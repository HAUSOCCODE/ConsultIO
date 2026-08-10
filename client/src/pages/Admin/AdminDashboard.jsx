import DashboardOverview from "../../components/dashboard/DashboardOverview";

export default function AdminDashboard() {
  return (
    <DashboardOverview
      endpoint="/dashboard/admin"
      recentKey="recentRegistrations"
      recentTitle="Recent Registration Requests"
      recentLink={{ to: "/admin/registrations", label: "View all" }}
      statLinks={{
        pendingRegistrations: "/admin/registrations",
        unreadNotifications: "/admin/notifications",
      }}
    />
  );
}
