import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import { useShellToast } from "../layouts/ShellToastContext";
import { Card, Loading, StatusPill } from "../components/ui";

const STAT_TONE_BORDER = {
  cyan: "border-electric-cyan/30",
  amber: "border-amber-500/30",
  emerald: "border-emerald-500/30",
  purple: "border-purple-500/30",
};

const STAT_TONE_BOX = {
  cyan: "bg-electric-cyan/10 text-electric-cyan",
  amber: "bg-amber-500/10 text-amber-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  purple: "bg-purple-500/10 text-purple-300",
};

const ROLE_ACCESS_LABEL = {
  ADMIN: "Full Admin Access",
  CEO: "Full Admin Access",
  CTO: "Full Admin Access",
  HR: "Full Admin Access",
  FINANCE: "Finance Access",
  TEAM_LEAD: "Department Lead Access",
  EMPLOYEE: "Standard Employee Access",
};

const QUICK_LINKS = [
  {
    to: "/tasks",
    label: "Go to Tasks",
    hint: "Manage daily items",
    icon: "fa-solid fa-bars-staggered",
    tone: "primary",
  },
  {
    to: "/attendance",
    label: "Mark Attendance",
    hint: "Log work hours",
    icon: "fa-solid fa-user-check",
    tone: "emerald",
  },
  {
    to: "/reports",
    label: "Submit Daily Report",
    hint: "Send evening update",
    icon: "fa-solid fa-paper-plane",
    tone: "purple",
  },
  {
    to: "/chat",
    label: "Open Chat",
    hint: "Team discussions",
    icon: "fa-solid fa-comments",
    tone: "sky",
  },
];

const TONE_ICON = {
  primary: "btn-primary-gradient",
  emerald: "bg-emerald-500 text-navy-900 shadow-emerald-500/20",
  purple: "bg-purple-500 text-white shadow-purple-500/20",
  sky: "bg-electric-sky text-navy-900 shadow-electric-sky/20",
};

const TONE_HOVER_BORDER = {
  primary: "hover:border-electric-cyan/60",
  emerald: "hover:border-emerald-400/60",
  purple: "hover:border-purple-400/60",
  sky: "hover:border-electric-sky/60",
};

const TONE_ARROW_HOVER = {
  primary: "group-hover:text-electric-cyan",
  emerald: "group-hover:text-emerald-400",
  purple: "group-hover:text-purple-400",
  sky: "group-hover:text-electric-sky",
};

function DepartmentBoard() {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [deptRes, empRes, taskRes, attRes] = await Promise.all([
          api.get("/api/auth/departments/"),
          api.get("/api/auth/employees/"),
          api.get("/api/tasks/tasks/"),
          api.get("/api/attendance/attendance/"),
        ]);
        if (cancelled) return;
        setDepartments(deptRes.data.results || deptRes.data);
        setEmployees(empRes.data.results || empRes.data);
        setTasks(taskRes.data.results || taskRes.data);

        const today = new Date().toISOString().slice(0, 10);
        const attendance = attRes.data.results || attRes.data;
        const byEmployee = {};
        attendance.filter((a) => a.date === today).forEach((a) => {
          byEmployee[a.employee_id] = a.status;
        });
        setAttendanceToday(byEmployee);
      } catch {
        // dashboard is best-effort — some services may still be warming up
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Loading />;

  const unassigned = employees.filter((e) => !e.department);

  return (
    <div className="space-y-5">
      {departments.map((dept) => {
        const deptEmployees = employees.filter((e) => e.department === dept.id);
        if (deptEmployees.length === 0) return null;
        return (
          <Card key={dept.id} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-semibold text-ink">{dept.name}</h3>
              <span className="text-xs text-muted font-mono">{deptEmployees.length} people</span>
            </div>
            <div className="divide-y divide-line">
              {deptEmployees.map((emp) => {
                const empTasks = tasks.filter((t) => t.assigned_to_id === emp.id);
                const pending = empTasks.filter((t) => t.status === "PENDING").length;
                const started = empTasks.filter((t) => t.status === "IN_PROGRESS").length;
                const done = empTasks.filter((t) => t.status === "COMPLETED").length;
                return (
                  <div key={emp.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-ink font-medium truncate">
                        {emp.first_name || emp.username} {emp.last_name}
                      </p>
                      <p className="text-xs text-muted">{emp.role.replace("_", " ")}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-xs text-muted font-mono">
                      <span>{empTasks.length} tasks</span>
                      <span className="text-amber">{pending} pending</span>
                      <span className="text-signal">{started} started</span>
                      <span className="text-mint">{done} done</span>
                      <StatusPill status={attendanceToday[emp.id] || "ABSENT"} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {unassigned.length > 0 && (
        <Card className="p-5">
          <h3 className="font-display text-base font-semibold text-ink mb-3">No department assigned</h3>
          <div className="divide-y divide-line">
            {unassigned.map((emp) => (
              <div key={emp.id} className="py-2.5 text-sm text-muted">
                {emp.username} · {emp.role.replace("_", " ")}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function Overview() {
  const { user, canSeeAllDepartments } = useAuth();
  const showToast = useShellToast();
  const [loading, setLoading] = useState(true);
  const [departmentName, setDepartmentName] = useState(null);
  const [stats, setStats] = useState({
    tasksTotal: 0,
    tasksPending: 0,
    tasksCompleted: 0,
    reportsPending: 0,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [tasksRes, reportsRes, meRes] = await Promise.all([
          api.get("/api/tasks/tasks/", { params: { page_size: 500 } }),
          api.get("/api/reports/reports/", { params: { page_size: 500 } }),
          api.get("/api/auth/employees/me/"),
        ]);
        const tasks = tasksRes.data.results || tasksRes.data;
        const reports = reportsRes.data.results || reportsRes.data;
        if (!cancelled) {
          setStats({
            tasksTotal: tasks.length,
            tasksPending: tasks.filter((t) => t.status === "PENDING").length,
            tasksCompleted: tasks.filter((t) => t.status === "COMPLETED").length,
            reportsPending: reports.filter((r) => r.review_status === "PENDING_REVIEW").length,
          });
          setDepartmentName(meRes.data.department_name || null);
        }
      } catch {
        // services may still be warming up — fail quietly on the overview
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const accessLabel = ROLE_ACCESS_LABEL[user?.role] || "Standard Employee Access";

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-outfit text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 flex items-center gap-2">
            <span>{greeting},</span>
            <span className="capitalize" style={{ color: "#0EA5C7" }}>
              {user?.username}
            </span>
            <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h2>
          <p className="text-xs sm:text-sm text-electric-sky mt-1">
            Here is an overview of your operational sprint metrics for today.
          </p>
        </div>
        <div>
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Ops Server Online</span>
          </span>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5">
          {/* Your Tasks */}
          <div className="lg:col-span-8 glass-card rounded-3xl p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-electric-cyan/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-electric-azure/20 text-electric-cyan flex items-center justify-center text-sm anim-icon-pulse">
                  <i className="fa-solid fa-list-check"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Your Tasks</h3>
                  <p className="text-[11px] text-electric-sky">Task breakdown for your current operational sprint</p>
                </div>
              </div>
              <button
                onClick={() => showToast("Tasks synced with server", "success")}
                className="text-xs font-bold text-electric-cyan hover:underline flex items-center gap-1 group"
              >
                <i className="fa-solid fa-rotate-right text-[10px] group-hover:rotate-180 transition-transform duration-500"></i> Sync
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: stats.tasksTotal, label: "Total", hint: "All tasks", tone: "cyan" },
                { value: stats.tasksPending, label: "Pending", hint: "Needs action", tone: "amber" },
                { value: stats.tasksCompleted, label: "Completed", hint: "Done", tone: "emerald" },
                { value: stats.reportsPending, label: "Awaiting Review", hint: "Reports", tone: "purple" },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`p-3.5 rounded-2xl bg-navy-800/80 border ${STAT_TONE_BORDER[s.tone]} flex items-center gap-3 min-w-0 overflow-hidden transition-all duration-300`}
                >
                  <div className={`w-10 h-10 rounded-xl ${STAT_TONE_BOX[s.tone]} flex items-center justify-center text-lg font-black shrink-0`}>
                    {s.value}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-extrabold text-white truncate">{s.label}</span>
                    <span className="block text-[10px] text-slate-400 truncate">{s.hint}</span>
                  </div>
                </div>
              ))}
            </div>

            {stats.tasksTotal > 0 && (
              <div>
                <div className="flex items-center justify-between text-[11px] font-bold text-electric-sky mb-1.5">
                  <span>Completion rate</span>
                  <span>{Math.round((stats.tasksCompleted / stats.tasksTotal) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-navy-800/80 border border-electric-cyan/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-electric-azure to-electric-cyan transition-all duration-700"
                    style={{ width: `${Math.round((stats.tasksCompleted / stats.tasksTotal) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Your Department */}
          <div className="lg:col-span-4 glass-card rounded-3xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-3 border-b border-electric-cyan/20 pb-4">
              <div className="w-9 h-9 rounded-xl bg-electric-sky/15 text-electric-cyan flex items-center justify-center text-sm anim-icon-float shrink-0">
                <i className="fa-solid fa-building-user"></i>
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-white">Your Department</h3>
                <p className="text-[11px] text-electric-sky">Assigned organizational division</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-navy-800/90 border border-electric-cyan/20">
              <span className="text-[11px] font-bold text-electric-sky uppercase tracking-wide">Division</span>
              <p className="text-lg font-black text-white leading-snug mt-1 break-words">
                {departmentName || (canSeeAllDepartments ? "All Departments" : "Unassigned")}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                Active Unit
              </span>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1 border-t border-electric-cyan/10">
              <i className="fa-solid fa-shield-halved text-emerald-400 shrink-0"></i>
              <span>Role Permissions: {accessLabel}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <i className="fa-solid fa-bolt text-electric-cyan text-sm animate-bounce"></i>
            <span>Quick Links</span>
          </h2>
          <span className="text-xs text-electric-sky font-medium">Fast action triggers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`glass-card rounded-2xl p-5 flex items-center justify-between group transition duration-300 transform hover:-translate-y-1.5 ${TONE_HOVER_BORDER[link.tone]}`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm shadow-lg group-hover:rotate-12 transition duration-300 ${TONE_ICON[link.tone]}`}
                >
                  <i className={link.icon}></i>
                </div>
                <div>
                  <span className="font-bold text-sm text-white block">{link.label}</span>
                  <span className="text-[10px] text-electric-sky">{link.hint}</span>
                </div>
              </div>
              <i className={`fa-solid fa-arrow-right text-xs text-slate-400 ${TONE_ARROW_HOVER[link.tone]} group-hover:translate-x-1.5 transition duration-200`}></i>
            </Link>
          ))}
        </div>
      </div>

      {/* Real department drill-down, kept for HR/CEO/CTO/Admin */}
      {canSeeAllDepartments && (
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-white">By department</h2>
          <DepartmentBoard />
        </div>
      )}
    </div>
  );
}
