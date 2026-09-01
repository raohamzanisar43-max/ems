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
  { to: "/tasks", label: "Go to Tasks", hint: "Manage daily items", icon: "fa-solid fa-bars-staggered" },
  { to: "/attendance", label: "Mark Attendance", hint: "Log work hours", icon: "fa-solid fa-user-check" },
  { to: "/reports", label: "Submit Daily Report", hint: "Send evening update", icon: "fa-solid fa-paper-plane" },
  { to: "/chat", label: "Open Chat", hint: "Team discussions", icon: "fa-solid fa-comments" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
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
        // dashboard is best-effort
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
                {emp.username} · {emp.role.replace("_", " ")}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatTile({ to, icon, kicker, label, value }) {
  return (
    <Link
      to={to}
      className="border border-line rounded-xl p-4 flex flex-col gap-3 hover:border-signal/40 hover:shadow-panel transition group"
    >
      <div className="flex items-center justify-between">
        <span className="w-9 h-9 rounded-lg bg-signal/10 text-signal flex items-center justify-center text-sm">
          <i className={icon}></i>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-muted bg-panel2 px-2 py-0.5 rounded-full">
          {kicker}
        </span>
      </div>
      <div>
        <p className="text-2xl font-black text-ink leading-none">{value}</p>
        <p className="text-xs text-muted mt-1.5">{label}</p>
      </div>
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
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function toggleAttendance() {
    setAttendanceBusy(true);
    try {
      if (todayAttendance && !todayAttendance.check_out) {
        const { data } = await api.post("/api/attendance/attendance/check_out/");
        setTodayAttendance(data);
        showToast("Checked out — see you tomorrow!", "success");
      } else if (!todayAttendance) {
        const { data } = await api.post("/api/attendance/attendance/check_in/");
        setTodayAttendance(data);
        showToast("Checked in for today.", "success");
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

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <Card className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-ink flex items-center gap-2">
            <span>{greeting}, {user?.username}</span>
            <span className="inline-block">👋</span>
          </h2>
          <p className="text-sm text-muted mt-1">Here is an overview of your operational metrics for today.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
              isCheckedIn
                ? "bg-mint/10 border-mint/30 text-mint"
                : "bg-panel2 border-line text-muted"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isCheckedIn ? "bg-mint" : "bg-muted"}`}></span>
            {isCheckedOut ? "Checked Out" : isCheckedIn ? "Checked In" : "Not Checked In"}
          </span>
          {!isCheckedOut && (
            <button
              onClick={toggleAttendance}
              disabled={attendanceBusy}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-signal text-white hover:bg-primary transition disabled:opacity-60"
            >
              {attendanceBusy ? "…" : isCheckedIn ? "Check Out" : "Check In"}
            </button>
          )}
        </div>
      </Card>

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-ink">Your Tasks</h2>
              <p className="text-xs text-muted">Task breakdown for your current operational sprint</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile to="/attendance" icon="fa-solid fa-calendar-check" kicker="Total" label="Attendance (this month)" value={stats.attendanceThisMonth} />
              <StatTile to="/leaves" icon="fa-solid fa-calendar-minus" kicker="Total" label="Leaves" value={stats.leavesTotal} />
              <StatTile to="/tasks" icon="fa-solid fa-circle-check" kicker="Tasks" label="Done" value={stats.tasksCompleted} />
              <StatTile to="/reports" icon="fa-solid fa-file-invoice" kicker="Daily Report" label="Reports" value={stats.reportsTotal} />
            </div>
            {stats.tasksTotal > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-muted mb-1.5">
                  <span>Task completion rate</span>
                  <span>{completionPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-panel2 overflow-hidden">
                  <div className="h-full rounded-full bg-signal transition-all duration-700" style={{ width: `${completionPct}%` }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Your Department */}
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-signal/10 text-signal flex items-center justify-center text-sm shrink-0">
                <i className="fa-solid fa-building-user"></i>
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-ink">Your Department</h3>
                <p className="text-xs text-muted">Assigned organizational division</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-sidebar text-white">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-300">Division</span>
                <p className="text-lg font-black leading-snug mt-1 break-words">
                  {departmentName || (canSeeAllDepartments ? "All Departments" : "Unassigned")}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint/15 text-mint text-[10px] font-extrabold border border-mint/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-mint"></span>
                  Active Unit
                </span>
              </div>
              <div className="p-4 rounded-xl border border-line bg-panel2 flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Active Unit</span>
                <p className="text-sm font-bold text-ink mt-1">Role Permissions</p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
                  <i className="fa-solid fa-shield-halved text-mint"></i>
                  {accessLabel}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Links */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-ink flex items-center gap-2">
                <i className="fa-solid fa-bolt text-signal text-sm"></i>
                <span>Quick Links</span>
              </h2>
              <span className="text-xs text-muted font-medium">Fast action triggers</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="border border-line rounded-xl p-4 flex items-center justify-between group hover:border-signal/40 hover:shadow-panel transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-signal/10 text-signal flex items-center justify-center text-sm shrink-0">
                      <i className={link.icon}></i>
                    </span>
                    <div>
                      <span className="font-bold text-sm text-ink block">{link.label}</span>
                      <span className="text-[10px] text-muted">{link.hint}</span>
                    </div>
                  </div>
                  <i className="fa-solid fa-arrow-right text-xs text-muted group-hover:text-signal group-hover:translate-x-1 transition"></i>
                </Link>
              ))}
            </div>
          </div>

          {/* Real department drill-down, kept for HR/CEO/CTO/Admin */}
          {canSeeAllDepartments && (
            <div className="space-y-4">
              <h2 className="text-lg font-extrabold text-ink">By department</h2>
              <DepartmentBoard />
            </div>
          )}
        </>
      )}
    </div>
  );
}
