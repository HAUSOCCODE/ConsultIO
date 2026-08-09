import {
  Bell,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  History,
  LayoutDashboard,
  UserRound,
} from "lucide-react";
import RoleLayout from "../components/RoleLayout";
const navigation = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/faculty/dashboard" },
  {
    icon: CalendarDays,
    label: "My Appointments",
    path: "/faculty/appointments",
  },
  {
    icon: ClipboardList,
    label: "Appointment Requests",
    path: "/faculty/requests",
  },
  { icon: History, label: "Consultation History", path: "/faculty/history" },
  {
    icon: CalendarClock,
    label: "Manage Availability",
    path: "/faculty/availability",
  },
  { icon: Bell, label: "Notifications", path: "/faculty/notifications" },
  { icon: UserRound, label: "Profile", path: "/faculty/profile" },
];
export default function FacultyLayout() {
  return <RoleLayout role="faculty" navigation={navigation} />;
}
