import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../api/client";
import { ShellToastContext } from "./ShellToastContext";
import "./AppShell.css";

const ROLE_LABELS = {
  ADMIN: "Admin",
  CEO: "CEO",
  CTO: "CTO",
  HR: "HR",
  FINANCE: "Finance",
  TEAM_LEAD: "Team Lead",
  EMPLOYEE: "Employee",
};

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "fa-solid fa-table-cells-large", end: true },
  { to: "/tasks", label: "Tasks", icon: "fa-solid fa-list-check", badgeKey: "tasks" },
  { to: "/attendance", label: "Attendance", icon: "fa-solid fa-calendar-check" },
  { to: "/leaves", label: "Leaves", icon: "fa-solid fa-calendar-minus" },
  { to: "/reports", label: "Daily Reports", icon: "fa-solid fa-file-invoice" },
  { to: "/chat", label: "Chat", icon: "fa-solid fa-comments", badgeKey: "live" },
];

const PAGE_TITLES = {
  "/": "Dashboard",
  "/tasks": "Tasks",
  "/attendance": "Attendance",
  "/leaves": "Leaves",
  "/reports": "Daily Reports",
  "/chat": "Chat",
  "/payroll": "Payroll",
  "/employees": "Employees",
  "/roles": "Roles",
  "/permissions": "Permissions",
  "/settings": "Settings",
};

function NavItem({ to, label, icon, end, badge, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `nav-pill flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
          isActive ? "nav-pill-active" : "text-slate-300 hover:text-white"
        }`
      }
    >
      <i className={`${icon} text-sm w-5 text-center`}></i>
      <span>{label}</span>
      {badge}
    </NavLink>
  );
}

export default function AppShell() {
  const { user, logout, canSeeAllDepartments, isFinance, isHR, isAdmin, isCEO, isCTO, isTeamLead } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const toastTimerRef = useRef(null);
  const contentScrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/tasks/tasks/")
      .then(({ data }) => {
        if (cancelled) return;
        const tasks = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        setPendingTasksCount(tasks.filter((t) => t && t.status === "PENDING").length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  function showToast(message, type = "info") {
    setToast({ visible: true, message, type });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  useEffect(() => {
    contentScrollRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  const initial = (user?.username || "?").charAt(0).toUpperCase();
  const dateText = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const pageTitle = PAGE_TITLES[location.pathname] || "Dashboard";

  const closeMobile = () => setMobileOpen(false);

  return (
    <ShellToastContext.Provider value={showToast}>
      <div className="novu-shell h-screen relative flex overflow-hidden bg-canvas text-ink">
        {/* Mobile drawer backdrop */}
        {mobileOpen && (
          <div onClick={closeMobile} className="fixed inset-0 bg-black/50 z-30 lg:hidden" />
        )}

        <aside
          className={`fixed lg:relative top-0 left-0 h-screen w-[260px] bg-sidebar z-40 flex flex-col p-4 transition-transform duration-300 shrink-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="shrink-0 flex items-center justify-between px-2 py-3">
            <NavLink to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <img
                  src="/static/novulabs-mark.png"
                  alt="NovuLabs"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display font-extrabold text-lg text-white leading-none">NovuLabs</span>
                <span className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase mt-1">
                  Enterprise EMS
                </span>
              </div>
            </NavLink>
            <button onClick={closeMobile} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg transition" aria-label="Close menu">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <nav className="space-y-1 flex-1 min-h-0 overflow-y-auto mt-4">
            {NAV_ITEMS.map((item) => (
              <NavItem
                key={item.to}
                to={item.to}
                end={item.end}
                icon={item.icon}
                label={item.label}
                onClick={closeMobile}
                badge={
                  item.badgeKey === "live" ? (
                    <span className="ml-auto bg-mint/20 text-mint text-[10px] px-2 py-0.5 rounded-full font-bold">Live</span>
                  ) : item.badgeKey === "tasks" && pendingTasksCount > 0 ? (
                    <span className="ml-auto bg-amber/20 text-amber text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {pendingTasksCount}
                    </span>
                  ) : null
                }
              />
            ))}

            {(isFinance || isHR || isAdmin) && (
              <NavItem to="/payroll" icon="fa-solid fa-money-check-dollar" label="Payroll" onClick={closeMobile} />
            )}
            {(canSeeAllDepartments || isTeamLead) && (
              <NavItem to="/employees" icon="fa-solid fa-users" label="Employees" onClick={closeMobile} />
            )}
            {(isHR || isAdmin) && (
              <>
                <NavItem to="/roles" icon="fa-solid fa-user-tag" label="Roles" onClick={closeMobile} />
                <NavItem to="/permissions" icon="fa-solid fa-shield-halved" label="Permissions" onClick={closeMobile} />
              </>
            )}
          </nav>

          <div className="shrink-0 pt-3 border-t border-white/10 space-y-1">
            {(isHR || isAdmin || isCEO || isCTO) && (
              <NavItem to="/settings" icon="fa-solid fa-gear" label="Settings" onClick={closeMobile} />
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              <i className="fa-solid fa-right-from-bracket text-sm w-5 text-center"></i>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <div ref={contentScrollRef} className="flex-1 min-w-0 flex flex-col relative z-10 h-screen overflow-y-auto">
          <header className="bg-panel/95 backdrop-blur-sm sticky top-0 z-20 border-b border-line px-4 sm:px-6 py-3 flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-panel2 border border-line text-ink hover:bg-line transition shrink-0"
              aria-label="Open menu"
            >
              <i className="fa-solid fa-bars text-sm"></i>
            </button>

            <div className="hidden sm:block relative flex-1 max-w-md">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-xs"></i>
              <input
                placeholder={`Search ${pageTitle.toLowerCase()}…`}
                className="w-full bg-panel2 border border-line rounded-lg pl-9 pr-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-signal transition"
              />
            </div>

            <h1 className="sm:hidden text-base font-bold text-ink flex-1 truncate">{pageTitle}</h1>

            <div className="flex items-center gap-3 ml-auto shrink-0">
              <span className="hidden md:inline text-xs font-semibold text-muted uppercase tracking-wide">{dateText}</span>

              <button
                onClick={() => showToast("No new notifications", "info")}
                className="w-9 h-9 rounded-xl bg-panel2 border border-line text-ink hover:bg-line transition relative flex items-center justify-center"
                aria-label="Notifications"
              >
                <i className="fa-regular fa-bell text-sm"></i>
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-signal rounded-full"></span>
              </button>

              <button
                onClick={() => showToast("EMS v2.4 — need help? Contact HR/Admin.", "info")}
                className="hidden sm:flex w-9 h-9 rounded-xl bg-panel2 border border-line text-ink hover:bg-line transition items-center justify-center"
                aria-label="Help"
              >
                <i className="fa-regular fa-circle-question text-sm"></i>
              </button>

              <div className="flex items-center gap-2.5 pl-1">
                <div className="w-9 h-9 rounded-full bg-signal text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {initial}
                </div>
                <div className="hidden md:flex flex-col leading-tight">
                  <span className="text-xs font-bold text-ink">{user?.username}</span>
                  <span className="text-[10px] font-semibold text-signal">{ROLE_LABELS[user?.role] || user?.role}</span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>

          <footer className="mt-auto border-t border-line px-4 sm:px-8 py-5 text-xs text-muted flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>© 2026 NovuLabs Software Solutions. All rights reserved.</span>
            <span className="text-signal font-bold">EMS v2.4</span>
          </footer>
        </div>

        <div
          className={`fixed bottom-6 right-6 z-50 bg-panel shadow-xl border border-line px-5 py-3.5 rounded-2xl transition-all duration-300 flex items-center gap-3 max-w-sm ${
            toast.visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
          }`}
        >
          <i
            className={`fa-solid text-sm shrink-0 ${
              toast.type === "success"
                ? "fa-circle-check text-mint"
                : toast.type === "error"
                ? "fa-circle-xmark text-rose"
                : "fa-circle-info text-signal"
            }`}
          ></i>
          <span className="text-xs font-semibold text-ink whitespace-nowrap">{toast.message}</span>
        </div>
      </div>
    </ShellToastContext.Provider>
  );
}
