import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import {
  PageHeader,
  Card,
  StatusPill,
  EmptyState,
  Loading,
  ErrorBanner,
  Button,
  Pagination,
} from "../components/ui";

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "COMPLETED"];
const PRIORITY_OPTIONS = ["HIGH", "MEDIUM", "LOW"];
const PAGE_SIZE = 10;

const PRIORITY_STYLES = {
  HIGH: "bg-rose/15 text-rose border-rose/30",
  MEDIUM: "bg-amber/15 text-amber border-amber/30",
  LOW: "bg-mint/15 text-mint border-mint/30",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(t) {
  return Boolean(t.due_date) && t.status !== "COMPLETED" && t.due_date < todayStr();
}

const STAT_COLOR_CLASSES = {
  signal: { border: "border-signal/30", box: "bg-signal/10 text-signal" },
  mint: { border: "border-mint/30", box: "bg-mint/10 text-mint" },
  rose: { border: "border-rose/30", box: "bg-rose/10 text-rose" },
  purple: { border: "border-purple/30", box: "bg-purple/10 text-purple" },
};

function StatMini({ label, value, color, icon }) {
  const c = STAT_COLOR_CLASSES[color];
  return (
    <div className={`glass-card rounded-2xl p-4 flex items-center gap-3.5 border ${c.border}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${c.box}`}>
        {icon}
      </div>
      <div>
        <span className="block text-xl font-black text-ink leading-none">{value}</span>
        <span className="block text-[11px] text-muted mt-1">{label}</span>
      </div>
    </div>
  );
}

function DonutChart({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const visible = segments.filter((s) => s.value > 0);
  const gap = visible.length > 1 ? 5 : 0;
  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-5">
      <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" className="text-line" strokeWidth="16" />
        {total > 0 &&
          visible.map((s) => {
            const fraction = s.value / total;
            const dash = Math.max(0, fraction * circumference - gap);
            const offset = -cumulative * circumference;
            cumulative += fraction;
            return (
              <circle
                key={s.label}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={s.hex}
                strokeWidth="16"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            );
          })}
        <text x="70" y="70" transform="rotate(90 70 70)" textAnchor="middle" dominantBaseline="central" className="fill-ink" style={{ fontSize: "22px", fontWeight: 800 }}>
          {total}
        </text>
      </svg>
      <div className="w-full flex flex-wrap justify-center gap-x-5 gap-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.hex }}></span>
            <span className="text-ink font-semibold">{s.label}</span>
            <span className="text-muted text-xs">
              {s.value} ({total > 0 ? Math.round((s.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriorityBarChart({ counts }) {
  const max = Math.max(1, ...PRIORITY_OPTIONS.map((p) => counts[p] || 0));
  const bars = [
    { key: "HIGH", label: "High", hex: "#EF4444" },
    { key: "MEDIUM", label: "Medium", hex: "#F5B94D" },
    { key: "LOW", label: "Low", hex: "#22C55E" },
  ];
  return (
    <div className="flex items-end justify-around h-40 gap-4 px-2">
      {bars.map((b) => {
        const value = counts[b.key] || 0;
        const heightPct = Math.max(4, (value / max) * 100);
        return (
          <div key={b.key} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
            <span className="text-sm font-bold text-ink">{value}</span>
            <div className="w-full rounded-t-lg transition-all duration-500" style={{ height: `${heightPct}%`, backgroundColor: b.hex, opacity: 0.85 }}></div>
            <span className="text-[11px] text-muted font-medium">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function WeeklyLineChart({ points }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const w = 280;
  const h = 110;
  const stepX = w / (points.length - 1 || 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = h - (p.count / max) * (h - 20) - 10;
    return { x, y, count: p.count, label: p.label };
  });
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28">
        <path d={path} fill="none" stroke="#1C73C9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c) => (
          <circle key={c.label} cx={c.x} cy={c.y} r="3.5" fill="#1C73C9" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-muted font-medium px-1 mt-1">
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  title: "",
  description: "",
  assigned_to_id: "",
  due_date: "",
  priority: "MEDIUM",
};

export default function Tasks() {
  const { user, canManageTasksAll } = useAuth();
  const canAssign = canManageTasksAll;

  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [employees, setEmployees] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [listPage, setListPage] = useState(1);

  async function loadTasks() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/tasks/tasks/", { params: { page_size: 500 } });
      setAllTasks(data.results || data);
    } catch {
      setError("Couldn't load tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (!canAssign) return;
    api
      .get("/api/auth/employees/", { params: { page_size: 500 } })
      .then(({ data }) => setEmployees(data.results || data))
      .catch(() => {
        // employee picker is best-effort — form falls back gracefully if empty
      });
  }, [canAssign]);

  useEffect(() => {
    setListPage(1);
  }, [search, statusFilter, priorityFilter]);

  async function updateStatus(taskId, status) {
    try {
      await api.patch(`/api/tasks/tasks/${taskId}/`, { status });
      loadTasks();
    } catch {
      setError("Couldn't update that task's status.");
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    try {
      await api.delete(`/api/tasks/tasks/${task.id}/`);
      loadTasks();
    } catch {
      setError("Couldn't delete that task.");
    }
  }

  function selectAssignee(id) {
    const emp = employees.find((e) => String(e.id) === String(id));
    setForm((f) => ({ ...f, assigned_to_id: id, _employee: emp || null }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      due_date: form.due_date || null,
      priority: form.priority,
    };
    if (canAssign) {
      const emp = form._employee;
      if (!emp) {
        setError("Pick who this task is assigned to.");
        return;
      }
      payload.assigned_to_id = emp.id;
      payload.assigned_to_username = emp.username;
      payload.department_id = emp.department || null;
    } else {
      payload.assigned_to_id = user.id;
      payload.assigned_to_username = user.username;
      payload.department_id = user.department_id || null;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/api/tasks/tasks/", payload);
      setShowForm(false);
      setForm(EMPTY_FORM);
      loadTasks();
    } catch {
      setError("Couldn't create the task — check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  function downloadTaskReport(period) {
    const now = new Date();
    const start = new Date(now);
    if (period === "weekly") start.setDate(now.getDate() - 7);
    else start.setMonth(now.getMonth() - 1);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = todayStr();

    const myTasks = allTasks
      .filter((t) => t.assigned_to_id === user?.id)
      .filter((t) => {
        const created = (t.created_at || "").slice(0, 10);
        return created >= startStr && created <= endStr;
      })
      .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));

    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    const periodLabel = period === "weekly" ? "Weekly" : "Monthly";
    const completedCount = myTasks.filter((t) => t.status === "COMPLETED").length;

    const rows = myTasks.length
      ? myTasks
          .map(
            (t) => `
        <tr>
          <td>${t.title}</td>
          <td>${t.priority}</td>
          <td>${t.status.replace("_", " ")}</td>
          <td>${t.due_date || "—"}</td>
          <td>${t.completed_at ? t.completed_at.slice(0, 10) : "—"}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="5" style="text-align:center;color:#8A93A6;padding:20px 0;">No tasks in this period.</td></tr>`;

    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${periodLabel} Task Report — ${user?.username}</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; color: #1F2430; padding: 40px; max-width: 720px; margin: 0 auto; }
            .brand { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1C73C9; padding-bottom: 14px; margin-bottom: 20px; }
            h1 { font-size: 20px; margin: 0; color: #071B2E; }
            .tag { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #1C73C9; font-weight: 700; }
            .muted { color: #8A93A6; font-size: 12px; margin-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #8A93A6; padding: 8px 6px; border-bottom: 2px solid #E7EAF1; }
            td { padding: 10px 6px; border-bottom: 1px solid #E7EAF1; font-size: 13px; }
            .summary { display: flex; gap: 24px; margin-top: 18px; }
            .summary div { font-size: 13px; color: #8A93A6; }
            .summary strong { display: block; font-size: 18px; color: #071B2E; }
            .footer { margin-top: 32px; font-size: 11px; color: #8A93A6; text-align: center; }
          </style>
        </head>
        <body>
          <div class="brand">
            <h1>Novu Labs</h1>
            <span class="tag">${periodLabel} Task Report</span>
          </div>
          <div class="muted">Employee</div>
          <div style="font-size:15px;font-weight:600;margin-bottom:12px;">${user?.username}</div>
          <div class="muted">Period</div>
          <div style="font-size:15px;font-weight:600;">${startStr} to ${endStr}</div>
          <div class="summary">
            <div><strong>${myTasks.length}</strong>Total</div>
            <div><strong>${completedCount}</strong>Completed</div>
            <div><strong>${myTasks.length - completedCount}</strong>Pending / In progress</div>
          </div>
          <table>
            <thead>
              <tr><th>Title</th><th>Priority</th><th>Status</th><th>Due date</th><th>Completed</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">Generated by Novu Labs EMS · ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.onload = () => win.print();
  }

  const today = todayStr();
  const total = allTasks.length;
  const completedCount = allTasks.filter((t) => t.status === "COMPLETED").length;
  const overdueCount = allTasks.filter(isOverdue).length;
  const inProgressCount = allTasks.filter((t) => t.status === "IN_PROGRESS" && !isOverdue(t)).length;
  const activeCount = allTasks.filter((t) => t.status !== "COMPLETED" && !isOverdue(t)).length;
  const todayCount = allTasks.filter((t) => t.due_date === today).length;

  const priorityCounts = PRIORITY_OPTIONS.reduce((acc, p) => {
    acc[p] = allTasks.filter((t) => t.priority === p).length;
    return acc;
  }, {});

  const weeklyPoints = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    const dayCount = allTasks.filter((t) => t.completed_at && t.completed_at.slice(0, 10) === dayStr).length;
    return { label, count: dayCount };
  });

  const upcomingDeadlines = allTasks
    .filter((t) => t.due_date && t.due_date >= today && t.status !== "COMPLETED")
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 6);

  const topPriorityTasks = allTasks
    .filter((t) => t.priority === "HIGH" && t.status !== "COMPLETED")
    .sort((a, b) => (a.due_date || "9999").localeCompare(b.due_date || "9999"))
    .slice(0, 6);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTasks.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
      if (q && !t.title.toLowerCase().includes(q) && !(t.assigned_to_username || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allTasks, search, statusFilter, priorityFilter]);

  const filtersActive = search || statusFilter !== "ALL" || priorityFilter !== "ALL";
  const pageTasks = filteredTasks.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        eyebrow="Work"
        title="Tasks"
        icon="fa-solid fa-list-check"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" onClick={() => downloadTaskReport("weekly")}>
              <i className="fa-solid fa-file-arrow-down"></i> Weekly report
            </Button>
            <Button variant="ghost" onClick={() => downloadTaskReport("monthly")}>
              <i className="fa-solid fa-file-arrow-down"></i> Monthly report
            </Button>
            <Button onClick={() => setShowForm((s) => !s)}>
              <i className={`fa-solid ${showForm ? "fa-xmark" : "fa-plus"}`}></i>
              {showForm ? "Cancel" : "New task"}
            </Button>
          </div>
        }
      />

      <ErrorBanner message={error} />

      {/* ================= DASHBOARD ================= */}
      {loading ? (
        <Loading />
      ) : total === 0 ? (
        <EmptyState title="No tasks yet" hint="Once tasks exist, this dashboard fills in automatically." icon="fa-solid fa-list-check" />
      ) : (
        <div className="space-y-5 mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatMini label="Total Tasks" value={total} color="signal" icon="Σ" />
            <StatMini label="Completed" value={completedCount} color="mint" icon="✓" />
            <StatMini label="In Progress" value={inProgressCount} color="signal" icon="…" />
            <StatMini label="Overdue" value={overdueCount} color="rose" icon="!" />
            <StatMini label="Today's Tasks" value={todayCount} color="purple" icon="•" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="p-5">
              <h3 className="text-sm font-bold text-ink mb-4">Task Status</h3>
              <DonutChart
                segments={[
                  { label: "Completed", value: completedCount, hex: "#22C55E" },
                  { label: "In Progress", value: activeCount, hex: "#F5B94D" },
                  { label: "Overdue", value: overdueCount, hex: "#EF4444" },
                ]}
              />
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-bold text-ink mb-4">Priority Breakdown</h3>
              <PriorityBarChart counts={priorityCounts} />
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-bold text-ink mb-4">Weekly Progress</h3>
              <WeeklyLineChart points={weeklyPoints} />
              <p className="text-[11px] text-muted mt-2">Tasks completed per day, last 7 days</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="p-5">
              <h3 className="text-sm font-bold text-ink mb-4">Upcoming Deadlines</h3>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted">Nothing due soon.</p>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-3 text-[11px] uppercase tracking-wide text-muted font-medium pb-2 border-b border-line">
                    <span>Task</span>
                    <span>Deadline</span>
                    <span>Priority</span>
                  </div>
                  {upcomingDeadlines.map((t) => (
                    <div key={t.id} className="grid grid-cols-3 items-center py-2 border-b border-line last:border-0 text-sm">
                      <span className="text-ink truncate pr-2">{t.title}</span>
                      <span className="text-muted font-mono text-xs">{t.due_date}</span>
                      <span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${PRIORITY_STYLES[t.priority]}`}>
                          {t.priority}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-bold text-ink mb-4">Top Priority Tasks</h3>
              {topPriorityTasks.length === 0 ? (
                <p className="text-sm text-muted">No high-priority tasks open right now.</p>
              ) : (
                <div className="space-y-2.5">
                  {topPriorityTasks.map((t) => (
                    <label key={t.id} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={t.status === "COMPLETED"}
                        onChange={() => updateStatus(t.id, "COMPLETED")}
                        className="w-4 h-4 rounded border-line text-signal focus:ring-signal accent-signal cursor-pointer shrink-0"
                      />
                      <span className="text-sm text-ink group-hover:text-signal transition-colors truncate flex-1">{t.title}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${PRIORITY_STYLES[t.priority]}`}>
                        {t.priority}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ================= CREATE FORM ================= */}
      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted mb-1.5">Title</label>
              <input
                required
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted mb-1.5">Description</label>
              <textarea
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            {canAssign ? (
              <>
                <div>
                  <label className="block text-xs text-muted mb-1.5">Assign to</label>
                  <select
                    required
                    className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                    value={form.assigned_to_id}
                    onChange={(e) => selectAssignee(e.target.value)}
                  >
                    <option value="" disabled>
                      {employees.length ? "Select an employee…" : "No employees found"}
                    </option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {(emp.first_name || emp.username) + (emp.last_name ? ` ${emp.last_name}` : "")} — {emp.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1.5">Department</label>
                  <div className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-muted">
                    {form._employee ? form._employee.department_name || "Unassigned" : "Pick an assignee first"}
                  </div>
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <label className="block text-xs text-muted mb-1.5">Assign to</label>
                <div className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-muted">
                  Yourself — {user?.username}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs text-muted mb-1.5">Due date</label>
              <input
                type="date"
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Priority</label>
              <select
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving} className="disabled:opacity-60 disabled:cursor-not-allowed">
                <i className={`fa-solid ${saving ? "fa-circle-notch fa-spin" : "fa-check"}`}></i>
                {saving ? "Creating…" : "Create task"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ================= TASK LIST ================= */}
      {!loading && total > 0 && (
        <>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <h3 className="text-sm font-bold text-ink">All Tasks</h3>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs"></i>
                <input
                  placeholder="Search title or assignee…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-panel2 border border-line rounded-lg pl-8 pr-3 py-1.5 text-sm text-ink outline-none focus:border-signal w-48 sm:w-56"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-panel2 border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none focus:border-signal"
              >
                <option value="ALL">All statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-panel2 border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none focus:border-signal"
              >
                <option value="ALL">All priorities</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {filtersActive && (
                <button
                  onClick={() => { setSearch(""); setStatusFilter("ALL"); setPriorityFilter("ALL"); }}
                  className="text-xs text-muted hover:text-signal transition-colors px-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <EmptyState
              title="No matching tasks"
              hint="Try a different search term or clear the filters."
              icon="fa-solid fa-filter-circle-xmark"
            />
          ) : (
            <>
              <div className="space-y-2.5">
                {pageTasks.map((t) => (
                  <Card key={t.id} className={`p-4 flex items-center justify-between gap-4 ${isOverdue(t) ? "border-rose/30" : ""}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                        <h4 className="font-medium text-ink truncate">{t.title}</h4>
                        <StatusPill status={t.status} />
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${PRIORITY_STYLES[t.priority]}`}>
                          {t.priority}
                        </span>
                        {isOverdue(t) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose/15 text-rose border-rose/30 shrink-0">
                            <i className="fa-solid fa-triangle-exclamation"></i> Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted truncate">
                        {t.description || "No description"}
                      </p>
                      <p className="text-xs text-muted mt-1.5 font-mono">
                        {t.assigned_to_username} · {t.due_date ? `Due ${t.due_date}` : "No due date"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={t.status}
                        onChange={(e) => updateStatus(t.id, e.target.value)}
                        className="bg-panel2 border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none focus:border-signal"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                      {(canAssign || t.assigned_to_id === user?.id) && (
                        <button
                          onClick={() => handleDelete(t)}
                          title="Delete task"
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-muted hover:text-rose hover:bg-rose/10 transition-colors"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              <Pagination
                page={listPage}
                count={filteredTasks.length}
                hasNext={listPage * PAGE_SIZE < filteredTasks.length}
                hasPrevious={listPage > 1}
                onPageChange={setListPage}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
