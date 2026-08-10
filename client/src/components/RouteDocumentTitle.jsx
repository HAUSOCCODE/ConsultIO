import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const titles = {
  "/": "ConsultIO | HAU School of Computing",
  "/get-started": "Get Started | ConsultIO",
  "/student/login": "Student Login | ConsultIO",
  "/student/register": "Student Register | ConsultIO",
  "/student": "Student Dashboard | ConsultIO",
  "/student/dashboard": "Student Dashboard | ConsultIO",
  "/student/book": "Book Consultation | ConsultIO",
  "/student/appointments": "My Appointments | ConsultIO",
  "/student/history": "Consultation History | ConsultIO",
  "/student/notifications": "Notifications | ConsultIO",
  "/student/profile": "Student Profile | ConsultIO",
  "/faculty/login": "Faculty Login | ConsultIO",
  "/faculty/register": "Faculty Register | ConsultIO",
  "/faculty": "Faculty Dashboard | ConsultIO",
  "/faculty/dashboard": "Faculty Dashboard | ConsultIO",
  "/faculty/appointments": "My Appointments | ConsultIO",
  "/faculty/requests": "Appointment Requests | ConsultIO",
  "/faculty/history": "Consultation History | ConsultIO",
  "/faculty/availability": "Manage Availability | ConsultIO",
  "/faculty/notifications": "Notifications | ConsultIO",
  "/faculty/profile": "Faculty Profile | ConsultIO",
  "/admin/login": "Admin Login | ConsultIO",
  "/admin/register": "Get Started | ConsultIO",
  "/admin": "Admin Dashboard | ConsultIO",
  "/admin/dashboard": "Admin Dashboard | ConsultIO",
  "/admin/users": "User Management | ConsultIO",
  "/admin/registrations": "User Management | ConsultIO",
  "/admin/consultations": "Consultation Overview | ConsultIO",
  "/admin/appointments": "Appointments Management | ConsultIO",
  "/admin/reports": "Reports & Analytics | ConsultIO",
  "/admin/notifications": "Notifications | ConsultIO",
  "/admin/logs": "Admin Dashboard | ConsultIO",
  "/admin/settings": "System Settings | ConsultIO",
};

export default function RouteDocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalizedPath =
      pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
    document.title = titles[normalizedPath] || "Page Not Found | ConsultIO";
  }, [pathname]);

  return null;
}
