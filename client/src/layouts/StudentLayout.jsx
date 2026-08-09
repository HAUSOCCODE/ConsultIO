import {
  Bell,
  CalendarDays,
  Clock3,
  LayoutDashboard,
  UserRound,
} from "lucide-react";
import RoleLayout from "../components/RoleLayout";
const navigation = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/student/dashboard" },
  { icon: CalendarDays, label: "Book Consultation", path: "/student/book" },
  {
    icon: CalendarDays,
    label: "My Appointments",
    path: "/student/appointments",
  },
  { icon: Clock3, label: "Consultation History", path: "/student/history" },
  { icon: Bell, label: "Notifications", path: "/student/notifications" },
  { icon: UserRound, label: "Profile", path: "/student/profile" },
];
export default function StudentLayout() {
  return <RoleLayout role="student" navigation={navigation} />;
}
