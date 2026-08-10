import { Bell, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Brand from "./Brand";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/apiClient";
import PageErrorBoundary from "./PageErrorBoundary";
import UserAvatar from "./profile/UserAvatar";

export default function RoleLayout({ role, navigation }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage =
    navigation.find(({ path }) => location.pathname === path)?.label ||
    "Dashboard";
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const load = () =>
      api("/notifications")
        .then((data) => setUnread(data.unreadCount))
        .catch(() => {});
    load();
    window.addEventListener("notifications:updated", load);
    const timer = setInterval(load, 30000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("notifications:updated", load);
    };
  }, []);
  const signOut = () => {
    logout();
    navigate("/", { replace: true });
  };
  return (
    <div className="min-h-screen bg-slate-50">
      <button
        aria-label="Close navigation"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-950/70 transition-opacity duration-200 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-2rem))] max-w-full flex-col overflow-hidden bg-[#6E1423] text-white shadow-2xl transition-transform duration-200 lg:w-72 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-[#8A2436] px-6">
          <Brand light />
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <div className="border-b border-[#8A2436] px-5 py-5">
          <div className="flex items-center gap-3">
            <UserAvatar
              user={user}
              className="h-11 w-11 shrink-0 rounded-xl bg-gold-400 font-extrabold text-maroon-900 shadow-md"
            />
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="mt-0.5 text-sm font-medium text-white">
                {role === "admin"
                  ? "Admin Portal"
                  : `${role[0].toUpperCase()}${role.slice(1)} Portal`}
              </p>
            </div>
          </div>
        </div>
        <nav className="scrollbar-hide min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-200 ${isActive ? "bg-[#FFF9F7] text-[#6E1423] shadow-sm" : "text-white hover:bg-[#8A2436]"}`
              }
            >
              <Icon size={19} className="shrink-0" />
              <span>{label}</span>
              {label === "Notifications" && unread > 0 && (
                <span className="ml-auto rounded-full bg-gold-400 px-2 py-0.5 text-xs font-bold text-maroon-900">
                  {unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-[#8A2436] p-4">
          <button
            onClick={signOut}
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#8A2436]"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>
      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 flex min-h-20 items-center gap-3 border-b border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-6 lg:px-7">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-maroon-800 shadow-sm lg:hidden"
          >
            <Menu />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-gold-600 sm:text-xs sm:tracking-[0.18em]">
              {role} workspace
            </p>
            <h1 className="mt-0.5 whitespace-normal text-sm font-bold leading-5 text-slate-900 sm:text-base">
              {currentPage}
            </h1>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <NavLink
              to={`/${role}/notifications`}
              className="relative grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-maroon-200 hover:bg-maroon-50 hover:text-maroon-800"
            >
              <Bell size={19} />
              {unread > 0 && (
                <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
              )}
            </NavLink>
            <UserAvatar
              user={user}
              className="h-11 w-11 rounded-xl bg-maroon-800 font-bold text-white shadow-md ring-2 ring-maroon-100"
            />
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1600px] p-3 sm:p-5 md:p-7 lg:p-8">
          <PageErrorBoundary key={location.pathname}>
            <Outlet />
          </PageErrorBoundary>
        </main>
      </div>
    </div>
  );
}
