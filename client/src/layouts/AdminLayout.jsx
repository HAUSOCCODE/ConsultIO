import {
  BarChart3,
  CalendarDays,
  FileBarChart,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import RoleLayout from "../components/RoleLayout";
const navigation = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: Users, label: "User Management", path: "/admin/users" },
  {
    icon: BarChart3,
    label: "Consultation Overview",
    path: "/admin/consultations",
  },
  {
    icon: CalendarDays,
    label: "Appointments Management",
    path: "/admin/appointments",
  },
  { icon: FileBarChart, label: "Reports & Analytics", path: "/admin/reports" },
  { icon: ScrollText, label: "Audit Logs", path: "/admin/logs" },
  { icon: Settings, label: "System Settings", path: "/admin/settings" },
];
export default function AdminLayout() {
  return <RoleLayout role="admin" navigation={navigation} />;
}
