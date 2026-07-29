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
  { to: "/", label: "Dashboard", icon: "fa-solid fa-chart-pie", end: true, hover: "group-hover:rotate-12" },
  { to: "/tasks", label: "Tasks", icon: "fa-solid fa-list-check", badgeKey: "tasks", hover: "group-hover:-translate-y-0.5" },
  { to: "/attendance", label: "Attendance", icon: "fa-solid fa-user-clock", hover: "group-hover:rotate-45" },
  { to: "/leaves", label: "Leaves", icon: "fa-solid fa-calendar-minus", hover: "group-hover:-rotate-12" },
  { to: "/reports", label: "Daily Reports", icon: "fa-solid fa-file-invoice", hover: "group-hover:translate-x-0.5" },
  { to: "/chat", label: "Chat", icon: "fa-solid fa-comments", badgeKey: "live", hover: "" },
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

export default function AppShell() {
  const { user, logout, canSeeAllDepartments, isFinance, isHR, isAdmin, isTeamLead } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Light theme was removed from the post-login app shell — always dark.
  const isDarkMode = true;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/tasks/tasks/")
      .then(({ data }) => {
        if (cancelled) return;
        const tasks = data.results || data;
        setPendingTasksCount(tasks.filter((t) => t.status === "PENDING").length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const contentScrollRef = useRef(null);

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

  // ---- Trailing-ring cursor: dot glued to the pointer, ring eases in behind it.
  // (The animated background canvas/particles were removed.)
  useEffect(() => {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let targetX = mouseX;
    let targetY = mouseY;

    function onMouseMove(e) {
      if (!e || typeof e.clientX !== "number") return;
      targetX = e.clientX;
      targetY = e.clientY;
      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      }
    }
    window.addEventListener("mousemove", onMouseMove);

    let frameId;
    function render() {
      mouseX += (targetX - mouseX) * 0.08;
      mouseY += (targetY - mouseY) * 0.08;
      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      }
      frameId = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  const initial = (user?.username || "?").charAt(0).toUpperCase();
  const hour = new Date().getHours();
  const dateText = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const pageTitle = PAGE_TITLES[location.pathname] || "Dashboard";

  return (
    <ShellToastContext.Provider value={showToast}>
      <div
        className={`novu-shell ${isDarkMode ? "dark" : ""} h-screen relative flex overflow-hidden selection:bg-electric-cyan selection:text-navy-900`}
        style={{
          background: "#ffffff",
          color: "#0f172a",
        }}
      >
        <div ref={cursorRingRef} className="custom-cursor-ring" />
        <div ref={cursorDotRef} className="custom-cursor-dot" />

        {/* Mobile drawer backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-navy-900/80 backdrop-blur-md z-30 lg:hidden"
          />
        )}

        <aside
          className={`app-sidebar content-light fixed lg:relative top-0 left-0 h-screen w-72 glass-card border-r border-slate-200 z-40 flex flex-col p-5 transition-transform duration-300 shrink-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="shrink-0">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <NavLink to="/" className="flex items-center gap-3.5 group">
                <div className="relative w-10 h-10 flex items-center justify-center anim-icon-float transition-transform duration-300 group-hover:scale-110">
                  <img
                    src="/novulabs-mark.png"
                    alt="Novu Labs"
                    className="w-full h-full object-contain drop-shadow-[0_2px_6px_rgba(28,115,201,0.25)]"
                  />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-outfit font-black text-xl tracking-tight text-slate-900 leading-none">Novu</span>
                    <span className="font-outfit font-black text-xl tracking-tight text-blue-600 leading-none">Labs</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-1">EMS</span>
                </div>
              </NavLink>
              <button onClick={() => setMobileOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-700 rounded-xl transition" aria-label="Close menu">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
          </div>

            <nav className="space-y-1.5 flex-1 min-h-0 overflow-y-auto mt-6 -mx-1 px-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `nav-pill flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition group ${
                      isActive ? "nav-pill-active" : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                    }`
                  }
                >
                  <i className={`${item.icon} text-sm w-5 text-center transition-transform group-hover:scale-125 ${item.hover || ""}`}></i>
                  <span>{item.label}</span>
                  {item.badgeKey === "live" && (
                    <span className="ml-auto bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-bold">Live</span>
                  )}
                  {item.badgeKey === "tasks" && (
                    <span className="ml-auto bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{pendingTasksCount}</span>
                  )}
                </NavLink>
              ))}

              {(isFinance || isHR || isAdmin) && (
                <NavLink
                  to="/payroll"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `nav-pill flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition group ${
                      isActive ? "nav-pill-active" : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                    }`
                  }
                >
                  <i className="fa-solid fa-money-check-dollar text-sm w-5 text-center transition-transform group-hover:scale-125"></i>
                  <span>Payroll</span>
                </NavLink>
              )}

              {(canSeeAllDepartments || isTeamLead) && (
                <NavLink
                  to="/employees"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `nav-pill flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition group ${
                      isActive ? "nav-pill-active" : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                    }`
                  }
                >
                  <i className="fa-solid fa-users text-sm w-5 text-center transition-transform group-hover:scale-125"></i>
                  <span>Employees</span>
                </NavLink>
              )}

              {(isHR || isAdmin) && (
                <>
                  <NavLink
                    to="/roles"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `nav-pill flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition group ${
                        isActive ? "nav-pill-active" : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                      }`
                    }
                  >
                    <i className="fa-solid fa-user-tag text-sm w-5 text-center transition-transform group-hover:scale-125"></i>
                    <span>Roles</span>
                  </NavLink>
                  <NavLink
                    to="/permissions"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `nav-pill flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition group ${
                        isActive ? "nav-pill-active" : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                      }`
                    }
                  >
                    <i className="fa-solid fa-shield-halved text-sm w-5 text-center transition-transform group-hover:scale-125"></i>
                    <span>Permissions</span>
                  </NavLink>
                  <NavLink
                    to="/settings"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `nav-pill flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition group ${
                        isActive ? "nav-pill-active" : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                      }`
                    }
                  >
                    <i className="fa-solid fa-gear text-sm w-5 text-center transition-transform group-hover:scale-125"></i>
                    <span>Settings</span>
                  </NavLink>
                </>
              )}
            </nav>

          <div className="shrink-0 pt-4 border-t border-slate-200">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-electric-azure to-electric-cyan text-navy-900 font-extrabold flex items-center justify-center text-sm shadow-md shrink-0">
                  {initial}
                </div>
                <div className="leading-tight min-w-0">
                  <span className="block text-xs font-extrabold text-slate-900 truncate">{user?.username}</span>
                  <span className="block text-[10px] font-bold text-slate-500">{ROLE_LABELS[user?.role] || user?.role}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition shrink-0" title="Logout">
                <i className="fa-solid fa-right-from-bracket text-xs"></i>
              </button>
            </div>
          </div>
        </aside>

        <div ref={contentScrollRef} className="content-light flex-1 min-w-0 flex flex-col relative z-10 h-screen overflow-y-auto">
          <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"
                aria-label="Open menu"
              >
                <i className="fa-solid fa-bars text-sm"></i>
              </button>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span>{pageTitle}</span>
                </h1>
                <p className="text-[11px] text-slate-500 hidden sm:block">{dateText}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <button
                onClick={() => showToast("No new notifications", "info")}
                className="anim-icon-wiggle p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition relative group"
              >
                <i className="fa-regular fa-bell text-sm"></i>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping"></span>
              </button>
            </div>
          </header>

          <main className="bg-white flex-1 p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>

          <footer className="bg-white mt-auto border-t border-slate-200 px-4 sm:px-8 py-5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>© 2026 NovuLabs Software Solutions. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span className="text-blue-600 font-bold">EMS v2.4</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>Enterprise Core</span>
            </div>
          </footer>
        </div>

        <div
          className={`fixed bottom-6 right-6 z-50 bg-white shadow-xl border border-slate-200 px-5 py-3.5 rounded-2xl transition-all duration-300 flex items-center gap-3 max-w-sm ${
            toast.visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
          }`}
        >
          <i
            className={`fa-solid text-sm shrink-0 ${
              toast.type === "success"
                ? "fa-circle-check text-emerald-500"
                : toast.type === "error"
                ? "fa-circle-xmark text-rose-500"
                : "fa-circle-info text-blue-600"
            }`}
          ></i>
          <span className="text-xs font-extrabold text-slate-900 whitespace-nowrap">{toast.message}</span>
        </div>
      </div>
    </ShellToastContext.Provider>
  );
}
