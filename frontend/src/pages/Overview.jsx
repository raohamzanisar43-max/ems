import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import { useShellToast } from "../layouts/ShellToastContext";
import { Card, Loading, StatusPill } from "../components/ui";

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
  { to: "/tasks", label: "Go to Tasks", hint: "Manage daily items", icon: "fa-solid fa-bars-staggered", materialIcon: "task_alt" },
  { to: "/attendance", label: "Mark Attendance", hint: "Log work hours", icon: "fa-solid fa-user-check", materialIcon: "co_present" },
  { to: "/reports", label: "Submit Daily Report", hint: "Send evening update", icon: "fa-solid fa-paper-plane", materialIcon: "summarize" },
  { to: "/chat", label: "Open Chat", hint: "Team discussions", icon: "fa-solid fa-comments", materialIcon: "chat" },
];

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
        const depts = Array.isArray(deptRes.data?.results) ? deptRes.data.results : (Array.isArray(deptRes.data) ? deptRes.data : []);
        const emps = Array.isArray(empRes.data?.results) ? empRes.data.results : (Array.isArray(empRes.data) ? empRes.data : []);
        const tsks = Array.isArray(taskRes.data?.results) ? taskRes.data.results : (Array.isArray(taskRes.data) ? taskRes.data : []);
        const atts = Array.isArray(attRes.data?.results) ? attRes.data.results : (Array.isArray(attRes.data) ? attRes.data : []);

        setDepartments(depts);
        setEmployees(emps);
        setTasks(tsks);

        const today = todayStr();
        const byEmployee = {};
        atts.filter((a) => a && a.date === today).forEach((a) => {
          byEmployee[a.employee_id] = a.status;
        });
        setAttendanceToday(byEmployee);
      } catch {
        // Dashboard is best-effort.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
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
                      <p className="text-sm text-ink font-medium truncate">{emp.first_name || emp.username} {emp.last_name}</p>
                      <p className="text-xs text-muted">{String(emp.role || "").replace("_", " ")}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-xs text-muted font-mono">
                      <span>{empTasks.length} tasks</span>
                      <span className="text-amber">{pending} pending</span>
                      <span className="text-signal">{started} started</span>
                      <span className="text-mint">{done} done</span>
                      <StatusPill status={attendanceToday[emp.id] || (["ADMIN", "CEO", "CTO"].includes(emp.role) ? "PRESENT" : "ABSENT")} />
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
                {emp.username} · {String(emp.role || "").replace("_", " ")}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function FlipStatTile({ to, icon, kicker, label, value, backLabel, tone = "primary", onClick }) {
  const toneMap = {
    primary: {
      iconBg: "bg-signal/10",
      icon: "text-signal",
      badge: "bg-signal/10 text-signal",
      hover: "group-hover:border-signal",
      back: "bg-signal/10 border-signal text-signal",
    },
    warning: {
      iconBg: "bg-amber/10",
      icon: "text-amber",
      badge: "bg-amber/10 text-amber",
      hover: "group-hover:border-amber",
      back: "bg-amber/10 border-amber text-amber",
    },
    success: {
      iconBg: "bg-mint/10",
      icon: "text-mint",
      badge: "bg-mint/10 text-mint",
      hover: "group-hover:border-mint",
      back: "bg-mint/10 border-mint text-mint",
    },
  };
  const t = toneMap[tone] || toneMap.primary;

  const content = (
    <div
      className="group perspective-[1000px] h-32 cursor-pointer"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(e); } : undefined}
    >
      <div className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        <div className={`absolute inset-0 bg-panel border border-line shadow-sm p-4 rounded-xl flex flex-col justify-between [backface-visibility:hidden] ${t.hover} transition-colors`}>
          <div className="flex justify-between items-start mb-3">
            <div className={`p-2 rounded-lg ${t.iconBg}`}>
              <i className={`${icon} ${t.icon} text-sm`}></i>
            </div>
            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${t.badge}`}>{kicker}</span>
          </div>
          <p className="text-sm text-ink font-semibold">{label}</p>
        </div>

        <div className={`absolute inset-0 p-4 rounded-xl flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] border ${t.back}`}>
          <h4 className={`font-display text-4xl font-black leading-none ${t.icon}`}>{value}</h4>
          {backLabel && <span className="mt-2 text-xs font-semibold uppercase tracking-wide opacity-80">{backLabel}</span>}
        </div>
      </div>
    </div>
  );

  return to ? <Link to={to} className="block focus:outline-none">{content}</Link> : content;
}

function QuickLink({ link }) {
  return (
    <Link
      to={link.to}
      className="group flex items-center p-4 rounded-lg bg-panel border border-line hover:border-signal hover:bg-signal/5 transition-all shadow-sm"
    >
      <div className="w-10 h-10 rounded-lg bg-panel2 flex items-center justify-center group-hover:bg-signal group-hover:text-white transition-colors mr-4">
        <i className={`${link.icon} text-muted group-hover:text-white`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-ink group-hover:text-signal transition-colors">{link.label}</h4>
        <p className="text-[12px] text-muted mt-0.5">{link.hint}</p>
      </div>
      <i className="fa-solid fa-arrow-right text-xs text-muted group-hover:text-signal group-hover:translate-x-1 transition-transform"></i>
    </Link>
  );
}

export default function Overview() {
  const { user, canSeeAllDepartments } = useAuth();
  const showToast = useShellToast();
  const [loading, setLoading] = useState(true);
  const [departmentName, setDepartmentName] = useState(null);
  const [stats, setStats] = useState({
    tasksTotal: 0,
    tasksCompleted: 0,
    reportsTotal: 0,
    leavesTotal: 0,
    attendanceThisMonth: 0,
  });
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceBusy, setAttendanceBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [tasksResult, reportsResult, leavesResult, attendanceResult, meResult] = await Promise.allSettled([
          api.get("/api/tasks/tasks/", { params: { page_size: 500 } }),
          api.get("/api/reports/reports/", { params: { page_size: 1 } }),
          api.get("/api/leaves/leaves/", { params: { page_size: 1 } }),
          api.get("/api/attendance/attendance/", { params: { page_size: 100 } }),
          api.get("/api/auth/employees/me/"),
        ]);

        const tasksData = tasksResult.status === "fulfilled" ? tasksResult.value.data : null;
        const reportsData = reportsResult.status === "fulfilled" ? reportsResult.value.data : null;
        const leavesData = leavesResult.status === "fulfilled" ? leavesResult.value.data : null;
        const attendanceData = attendanceResult.status === "fulfilled" ? attendanceResult.value.data : null;
        const meData = meResult.status === "fulfilled" ? meResult.value.data : null;

        const tasks = Array.isArray(tasksData?.results) ? tasksData.results : (Array.isArray(tasksData) ? tasksData : []);
        const attendanceRows = Array.isArray(attendanceData?.results)
          ? attendanceData.results
          : (Array.isArray(attendanceData) ? attendanceData : []);

        const today = todayStr();
        const monthPrefix = today.slice(0, 7);
        const mine = attendanceRows.filter((a) => a && a.employee_id === user?.id);
        const todayRow = mine.find((a) => a.date === today) || null;

        if (!cancelled) {
          setStats({
            tasksTotal: tasks.length,
            tasksCompleted: tasks.filter((t) => t && t.status === "COMPLETED").length,
            reportsTotal: typeof reportsData?.count === "number" ? reportsData.count : 0,
            leavesTotal: typeof leavesData?.count === "number" ? leavesData.count : 0,
            attendanceThisMonth: mine.filter((a) => a.date?.startsWith(monthPrefix)).length,
          });
          setDepartmentName(meData?.department_name || null);
          setTodayAttendance(todayRow);
        }
      } catch {
        // fail-safe fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  async function toggleAttendance() {
    if (attendanceBusy) return;
    setAttendanceBusy(true);
    try {
      if (todayAttendance && !todayAttendance.check_out) {
        // ON -> OFF: check out.
        const { data } = await api.post("/api/attendance/attendance/check_out/");
        setTodayAttendance(data);
        showToast("Checked out.", "success");
      } else {
        // OFF -> ON: check in. The backend re-opens today's existing
        // attendance row when it was previously checked out.
        const { data } = await api.post("/api/attendance/attendance/check_in/");
        setTodayAttendance(data);
        showToast("Checked in.", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.detail || "Couldn't update attendance.", "error");
    } finally {
      setAttendanceBusy(false);
    }
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const accessLabel = ROLE_ACCESS_LABEL[user?.role] || "Standard Employee Access";
  const isCheckedIn = Boolean(todayAttendance);
  const isCheckedOut = Boolean(todayAttendance?.check_out);
  const completionPct = stats.tasksTotal > 0 ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) : 0;
  const attendanceValue = stats.attendanceThisMonth;
  const attendanceBackLabel = attendanceValue === 1 ? "Day" : "Days";

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Reference-style hero banner */}
      <Card className="relative overflow-hidden p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative z-10">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-ink">
            {greeting}, {user?.username} <span>👋</span>
          </h2>
          <p className="text-sm text-muted mt-1">Here is an overview of your operational sprint metrics for today.</p>
        </div>

        <div className="relative z-10 flex items-center gap-3 bg-panel border border-line px-3.5 py-2 rounded-lg shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-4 w-4">
                {isCheckedIn && !isCheckedOut && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal opacity-60"></span>}
                <span className={`relative inline-flex rounded-full h-4 w-4 shadow-[0_0_10px_rgba(0,95,183,0.35)] ${isCheckedIn && !isCheckedOut ? "bg-signal" : "bg-muted"}`}></span>
              </span>
              <span className="text-base font-semibold text-ink whitespace-nowrap">
                {isCheckedOut ? "Checked Out" : isCheckedIn ? "Checked In" : "Not Checked In"}
              </span>
            </div>

            <div className="w-px h-10 bg-line mx-1" />

            <label className="relative inline-flex items-center cursor-pointer group">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isCheckedIn && !isCheckedOut}
                disabled={attendanceBusy}
                onChange={toggleAttendance}
              />
              <div className="w-16 h-8 bg-panel2 rounded-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border after:border-line after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-full peer-checked:bg-signal shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] peer-disabled:opacity-60" />
              <span className="ml-3 text-sm font-semibold text-muted group-hover:text-signal transition-colors whitespace-nowrap">Toggle Status</span>
            </label>
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-signal/10 to-transparent pointer-events-none rounded-r-xl" />
      </Card>

      {loading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-gutter">
          {/* Main dashboard column */}
          <div className="xl:col-span-2 space-y-6 lg:space-y-gutter">
            <section>
              <div className="mb-2">
                <h3 className="text-lg font-extrabold text-ink">Your Tasks</h3>
                <p className="text-xs text-muted">Task breakdown for your current operational sprint</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FlipStatTile
                  to="/attendance"
                  icon="fa-solid fa-calendar-check"
                  kicker="Total"
                  label="Attendance"
                  value={attendanceValue}
                  backLabel={attendanceBackLabel}
                  tone="primary"
                />
                <FlipStatTile
                  to="/leaves"
                  icon="fa-solid fa-calendar-minus"
                  kicker="Total"
                  label="Leaves"
                  value={stats.leavesTotal}
                  backLabel={stats.leavesTotal === 1 ? "Day" : "Days"}
                  tone="warning"
                />
                <FlipStatTile
                  to="/tasks"
                  icon="fa-solid fa-circle-check"
                  kicker="Tasks"
                  label="Done"
                  value={stats.tasksCompleted}
                  backLabel="Completed"
                  tone="success"
                />
                <FlipStatTile
                  to="/reports"
                  icon="fa-solid fa-file-invoice"
                  kicker="Daily Report"
                  label="Reports"
                  value={stats.reportsTotal}
                  backLabel={stats.reportsTotal === 1 ? "Report" : "Reports"}
                  tone="primary"
                />
              </div>

              {stats.tasksTotal > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-bold text-muted mb-1.5">
                    <span>Task completion rate</span>
                    <span>{completionPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-panel2 overflow-hidden">
                    <div className="h-full rounded-full bg-signal transition-all duration-700" style={{ width: `${completionPct}%` }} />
                  </div>
                </div>
              )}
            </section>

            {/* Department bento section */}
            <section>
              <div className="mb-2">
                <h3 className="text-lg font-extrabold text-ink">Your Department</h3>
                <p className="text-xs text-muted">Assigned organizational division</p>
              </div>

              <div className="bg-panel rounded-xl overflow-hidden flex flex-col md:flex-row border border-line shadow-sm min-h-[170px]">
                <div className="bg-sidebar p-6 md:w-1/3 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:16px_16px]" />
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="relative z-10">
                    <i className="fa-solid fa-building text-white/70 text-4xl mb-3 block" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">DIVISION</p>
                    <h4 className="text-2xl font-extrabold text-white break-words">
                      {departmentName || (canSeeAllDepartments ? "All Departments" : "Unassigned")}
                    </h4>
                  </div>
                </div>

                <div className="p-6 md:w-2/3 flex flex-col justify-center bg-panel">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-signal/10 border border-signal/20 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-user-shield text-signal" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">ACTIVE UNIT</p>
                      <h5 className="text-base font-extrabold text-ink">Role Permissions</h5>
                    </div>
                  </div>
                  <div className="bg-panel2 p-4 rounded-lg border border-line flex justify-between items-center gap-3">
                    <span className="text-sm font-semibold text-ink">{accessLabel}</span>
                    <i className="fa-solid fa-shield-halved text-signal" />
                  </div>
                </div>
              </div>
            </section>

            {canSeeAllDepartments && (
              <section className="space-y-4">
                <h3 className="text-lg font-extrabold text-ink">By department</h3>
                <DepartmentBoard />
              </section>
            )}
          </div>

          {/* Right sidebar / Quick Links */}
          <div className="space-y-6 lg:space-y-gutter">
            <section className="bg-panel border border-line shadow-sm p-5 sm:p-6 rounded-xl min-h-full flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-extrabold text-ink">Quick Links</h3>
                <p className="text-xs text-muted">Fast action triggers</p>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                {QUICK_LINKS.map((link) => <QuickLink key={link.to} link={link} />)}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
