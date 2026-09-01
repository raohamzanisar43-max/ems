import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import { PageHeader, Card, StatusPill, EmptyState, Loading, ErrorBanner, Button, Avatar } from "../components/ui";

const STATUS_DOT = {
  PRESENT: "bg-mint",
  LATE: "bg-amber",
  ABSENT: "bg-rose",
  HALF_DAY: "bg-signal",
};

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const ROLE_LABELS = {
  ADMIN: "Admin",
  CEO: "CEO",
  CTO: "CTO",
  HR: "HR",
  FINANCE: "Finance",
  TEAM_LEAD: "Team Lead",
  EMPLOYEE: "Employee",
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isoDate(year, month1based, day) {
  return `${year}-${pad2(month1based)}-${pad2(day)}`;
}

function monthLabel(year, month1based) {
  return new Date(year, month1based - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function employeeName(emp) {
  const full = `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
  return full || emp.username;
}

async function fetchAllPages(endpoint, extraParams = {}) {
  const { data } = await api.get(endpoint, { params: { page_size: 500, ...extraParams } });
  return Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
}

/* ============================== Mini calendar ============================== */

function MiniCalendar({ year, month, recordsByDate, onPrev, onNext }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = new Date(year, month - 1, 1).getDay();
  const cells = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const today = todayStr();

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-bold text-ink">Month Overview</h3>
        <div className="flex items-center gap-1.5">
          <button onClick={onPrev} className="w-7 h-7 rounded-lg hover:bg-panel2 text-muted hover:text-ink transition flex items-center justify-center">
            <i className="fa-solid fa-chevron-left text-xs"></i>
          </button>
          <span className="text-xs font-semibold text-muted min-w-[7rem] text-center">{monthLabel(year, month)}</span>
          <button onClick={onNext} className="w-7 h-7 rounded-lg hover:bg-panel2 text-muted hover:text-ink transition flex items-center justify-center">
            <i className="fa-solid fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w} className="text-[10px] font-bold text-muted uppercase py-1">{w}</span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`empty-${i}`}></span>;
          const dateStr = isoDate(year, month, day);
          const record = recordsByDate[dateStr];
          const isToday = dateStr === today;
          return (
            <div
              key={dateStr}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold relative ${
                isToday ? "border-2 border-signal" : "border border-transparent"
              } ${record ? "bg-panel2 text-ink" : "text-muted"}`}
              title={record ? record.status : undefined}
            >
              {day}
              {record && (
                <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${STATUS_DOT[record.status] || "bg-muted"}`}></span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-line text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-mint"></span>Present</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber"></span>Late</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-signal"></span>Half day</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose"></span>Absent</span>
      </div>
    </Card>
  );
}

function StatTile({ icon, label, value, hint }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <span className="w-10 h-10 rounded-lg bg-signal/10 text-signal flex items-center justify-center text-sm shrink-0">
        <i className={icon}></i>
      </span>
      <div className="min-w-0">
        <p className="text-lg font-black text-ink leading-none truncate">{value}</p>
        <p className="text-[11px] text-muted mt-1 truncate">{label}</p>
        {hint && <p className="text-[10px] text-muted/70 truncate">{hint}</p>}
      </div>
    </Card>
  );
}

function MonthYearPicker({ year, month, onChange }) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1];
  return (
    <div className="flex items-center gap-1.5">
      <select
        value={month}
        onChange={(e) => onChange(year, Number(e.target.value))}
        className="bg-panel2 border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none focus:border-signal"
      >
        {MONTH_NAMES.map((m, i) => (
          <option key={m} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => onChange(Number(e.target.value), month)}
        className="bg-panel2 border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none focus:border-signal"
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}

/* ============================== Self (personal) attendance ============================== */

function MyAttendancePanel({ user }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth() + 1);

  async function load() {
    setLoading(true);
    try {
      const list = await fetchAllPages("/api/attendance/attendance/", { page_size: 200 });
      setRows(list.filter((r) => r && r.employee_id === user?.id));
    } catch {
      setError("Couldn't load your attendance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const monthPrefix = `${viewYear}-${pad2(viewMonth)}`;
  const monthRows = useMemo(
    () => rows.filter((r) => r.date?.startsWith(monthPrefix)).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [rows, monthPrefix]
  );
  const recordsByDate = useMemo(() => {
    const map = {};
    monthRows.forEach((r) => { map[r.date] = r; });
    return map;
  }, [monthRows]);

  const today = todayStr();
  const todayRow = rows.find((r) => r.date === today) || null;
  const isCheckedIn = Boolean(todayRow);
  const isCheckedOut = Boolean(todayRow?.check_out);

  const presentCount = monthRows.filter((r) => r.status === "PRESENT" || r.status === "LATE" || r.status === "HALF_DAY").length;
  const absentCount = monthRows.filter((r) => r.status === "ABSENT").length;
  const recordedCount = monthRows.length;
  const monthlyRate = recordedCount > 0 ? Math.round((presentCount / recordedCount) * 100) : 0;
  const withHours = monthRows.filter((r) => r.check_in && r.check_out);
  const avgMinutes = withHours.length
    ? Math.round(withHours.reduce((sum, r) => sum + (new Date(r.check_out) - new Date(r.check_in)) / 60000, 0) / withHours.length)
    : 0;
  const avgHoursLabel = withHours.length ? `${Math.floor(avgMinutes / 60)}h ${pad2(avgMinutes % 60)}m` : "—";

  async function checkIn() {
    setBusy(true);
    setError("");
    try {
      await api.post("/api/attendance/attendance/check_in/");
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't check in.");
    } finally {
      setBusy(false);
    }
  }

  async function checkOut() {
    setBusy(true);
    setError("");
    try {
      await api.post("/api/attendance/attendance/check_out/");
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't check out — did you check in today?");
    } finally {
      setBusy(false);
    }
  }

  function shiftMonth(delta) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  }

  async function downloadCsv() {
    try {
      const { data } = await api.get("/api/attendance/attendance/export_csv/", {
        params: { year: viewYear, month: viewMonth },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance_${viewYear}-${pad2(viewMonth)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't download attendance CSV.");
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-extrabold text-ink">Your attendance overview</h2>
          <p className="text-sm text-muted mt-0.5">{monthLabel(viewYear, viewMonth)}</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
              isCheckedIn ? "bg-mint/10 border-mint/30 text-mint" : "bg-panel2 border-line text-muted"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isCheckedIn ? "bg-mint" : "bg-muted"}`}></span>
            {isCheckedOut ? "Checked Out" : isCheckedIn ? "Checked In" : "Not Checked In"}
          </span>
          <Button variant="ghost" onClick={checkIn} disabled={busy || isCheckedIn}>
            <i className="fa-solid fa-right-to-bracket"></i> Check in
          </Button>
          <Button onClick={checkOut} disabled={busy || !isCheckedIn || isCheckedOut}>
            <i className="fa-solid fa-right-from-bracket"></i> Check out
          </Button>
          <Button variant="ghost" onClick={downloadCsv}>
            <i className="fa-solid fa-file-arrow-down"></i> Download CSV
          </Button>
        </div>
      </Card>

      <ErrorBanner message={error} />

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile icon="fa-solid fa-percent" label="Monthly rate" value={`${monthlyRate}%`} />
            <StatTile icon="fa-solid fa-calendar-check" label="Total present" value={presentCount} />
            <StatTile icon="fa-solid fa-calendar-xmark" label="Total absent" value={absentCount} />
            <StatTile icon="fa-solid fa-clock" label="Avg. work hours" value={avgHoursLabel} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MiniCalendar year={viewYear} month={viewMonth} recordsByDate={recordsByDate} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />

            <Card className="p-5">
              <h3 className="font-display text-base font-bold text-ink mb-3">Monthly Attendance Report</h3>
              {monthRows.length === 0 ? (
                <EmptyState icon="fa-solid fa-calendar" title="No records this month" hint="Check in to start logging attendance." />
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                        <th className="px-1 py-2 font-medium">Date</th>
                        <th className="px-1 py-2 font-medium">Status</th>
                        <th className="px-1 py-2 font-medium">In</th>
                        <th className="px-1 py-2 font-medium">Out</th>
                        <th className="px-1 py-2 font-medium">Hours</th>
                        <th className="px-1 py-2 font-medium">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthRows.map((r) => (
                        <tr key={r.id} className="border-b border-line last:border-0">
                          <td className="px-1 py-2 text-ink font-medium whitespace-nowrap">
                            {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </td>
                          <td className="px-1 py-2"><StatusPill status={r.status} /></td>
                          <td className="px-1 py-2 text-muted font-mono whitespace-nowrap">{formatTime(r.check_in)}</td>
                          <td className="px-1 py-2 text-muted font-mono whitespace-nowrap">{formatTime(r.check_out)}</td>
                          <td className="px-1 py-2 text-muted font-mono whitespace-nowrap">{r.hours_worked || "—"}</td>
                          <td className="px-1 py-2 text-muted whitespace-nowrap">{r.location_display || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================== Manager: employee detail drill-down ============================== */

function EmployeeAttendanceDetail({ employee, onBack }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth() + 1);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  async function load() {
    setLoading(true);
    setError("");
    try {
      const list = await fetchAllPages("/api/attendance/attendance/");
      setRows(list.filter((r) => r && r.employee_id === employee.id));
    } catch {
      setError("Couldn't load this employee's attendance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee.id]);

  useEffect(() => {
    setPage(1);
  }, [viewYear, viewMonth]);

  const monthPrefix = `${viewYear}-${pad2(viewMonth)}`;
  const monthRows = useMemo(
    () => rows.filter((r) => r.date?.startsWith(monthPrefix)),
    [rows, monthPrefix]
  );
  const recordsByDate = useMemo(() => {
    const map = {};
    monthRows.forEach((r) => { map[r.date] = r; });
    return map;
  }, [monthRows]);

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const dailyRows = useMemo(() => {
    const out = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = isoDate(viewYear, viewMonth, d);
      const date = new Date(viewYear, viewMonth - 1, d);
      const dow = date.getDay();
      const isWeekend = dow === 0 || dow === 6;
      const record = recordsByDate[dateStr];
      out.push({
        dateStr,
        dayLabel: date.toLocaleDateString("en-US", { weekday: "short" }),
        isWeekend,
        record: record || null,
      });
    }
    return out;
  }, [daysInMonth, viewYear, viewMonth, recordsByDate]);

  const workingDaysTotal = dailyRows.filter((d) => !d.isWeekend).length;
  const presentDays = monthRows.filter((r) => r.status === "PRESENT").length;
  const halfDays = monthRows.filter((r) => r.status === "HALF_DAY").length;
  const absentDays = monthRows.filter((r) => r.status === "ABSENT").length;
  const lateDays = monthRows.filter((r) => r.status === "LATE").length;

  const totalPages = Math.max(1, Math.ceil(dailyRows.length / PAGE_SIZE));
  const pageRows = dailyRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function shiftMonth(delta) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  }

  async function downloadCsv() {
    try {
      const { data } = await api.get("/api/attendance/attendance/export_csv/", {
        params: { year: viewYear, month: viewMonth, employee_id: employee.id },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance_${viewYear}-${pad2(viewMonth)}_${employee.username}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't download this employee's attendance CSV.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted">
        <button onClick={onBack} className="hover:text-signal transition">Attendance</button>
        <i className="fa-solid fa-chevron-right text-[9px]"></i>
        <span className="text-ink font-medium">Employee Attendance</span>
      </div>

      <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-lg bg-panel2 border border-line text-ink hover:bg-line transition flex items-center justify-center shrink-0">
            <i className="fa-solid fa-arrow-left text-xs"></i>
          </button>
          <Avatar name={employeeName(employee)} size="md" />
          <div>
            <h2 className="font-display text-lg font-extrabold text-ink">{employeeName(employee)}</h2>
            <p className="text-xs text-muted">{ROLE_LABELS[employee.role] || employee.role}{employee.department_name ? ` · ${employee.department_name}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <MonthYearPicker year={viewYear} month={viewMonth} onChange={(y, m) => { setViewYear(y); setViewMonth(m); }} />
          <Button onClick={downloadCsv}>
            <i className="fa-solid fa-file-arrow-down"></i> Download CSV
          </Button>
        </div>
      </Card>

      <ErrorBanner message={error} />

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatTile icon="fa-solid fa-briefcase" label="Total working days" value={workingDaysTotal} />
            <StatTile icon="fa-solid fa-calendar-check" label="Present days" value={presentDays} />
            <StatTile icon="fa-solid fa-mug-hot" label="Half days" value={halfDays} />
            <StatTile icon="fa-solid fa-calendar-xmark" label="Absent days" value={absentDays} />
            <StatTile icon="fa-solid fa-clock" label="Late days" value={lateDays} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            <Card className="p-5">
              <h3 className="font-display text-base font-bold text-ink mb-3">Daily Attendance Record</h3>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                      <th className="px-1 py-2 font-medium">Date</th>
                      <th className="px-1 py-2 font-medium">Day</th>
                      <th className="px-1 py-2 font-medium">Check in</th>
                      <th className="px-1 py-2 font-medium">Check out</th>
                      <th className="px-1 py-2 font-medium">Hours</th>
                      <th className="px-1 py-2 font-medium">Location</th>
                      <th className="px-1 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((d) => (
                      <tr key={d.dateStr} className="border-b border-line last:border-0">
                        <td className="px-1 py-2 text-ink font-medium whitespace-nowrap">{d.dateStr}</td>
                        <td className="px-1 py-2 text-muted whitespace-nowrap">{d.dayLabel}</td>
                        <td className="px-1 py-2 text-muted font-mono whitespace-nowrap">{d.record ? formatTime(d.record.check_in) : "—"}</td>
                        <td className="px-1 py-2 text-muted font-mono whitespace-nowrap">{d.record ? formatTime(d.record.check_out) : "—"}</td>
                        <td className="px-1 py-2 text-muted font-mono whitespace-nowrap">{d.record?.hours_worked || "—"}</td>
                        <td className="px-1 py-2 text-muted whitespace-nowrap">{d.record?.location_display || "—"}</td>
                        <td className="px-1 py-2 whitespace-nowrap">
                          {d.isWeekend ? (
                            <span className="text-xs text-muted">Weekly Off</span>
                          ) : d.record ? (
                            <StatusPill status={d.record.status} />
                          ) : (
                            <span className="text-xs text-muted">No record</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-line">
                <p className="text-xs text-muted">
                  Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, dailyRows.length)} of {dailyRows.length} days
                </p>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                        p === page ? "bg-signal text-white" : "bg-panel2 text-muted hover:bg-line"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <MiniCalendar year={viewYear} month={viewMonth} recordsByDate={recordsByDate} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} />
          </div>
        </>
      )}
    </div>
  );
}

/* ============================== Manager: employee roster ============================== */

function SelfStatusBar() {
  const { user } = useAuth();
  const [todayRow, setTodayRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      const list = await fetchAllPages("/api/attendance/attendance/", { page_size: 50 });
      const today = todayStr();
      setTodayRow(list.find((r) => r && r.employee_id === user?.id && r.date === today) || null);
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isCheckedIn = Boolean(todayRow);
  const isCheckedOut = Boolean(todayRow?.check_out);

  async function checkIn() {
    setBusy(true);
    setError("");
    try {
      await api.post("/api/attendance/attendance/check_in/");
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't check in.");
    } finally {
      setBusy(false);
    }
  }

  async function checkOut() {
    setBusy(true);
    setError("");
    try {
      await api.post("/api/attendance/attendance/check_out/");
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't check out.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
          isCheckedIn ? "bg-mint/10 border-mint/30 text-mint" : "bg-panel2 border-line text-muted"
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isCheckedIn ? "bg-mint" : "bg-muted"}`}></span>
        {isCheckedOut ? "You're checked out" : isCheckedIn ? "You're checked in" : "You're not checked in"}
      </span>
      {!isCheckedOut && (
        <Button variant={isCheckedIn ? "primary" : "ghost"} onClick={isCheckedIn ? checkOut : checkIn} disabled={busy}>
          <i className={`fa-solid ${isCheckedIn ? "fa-right-from-bracket" : "fa-right-to-bracket"}`}></i>
          {isCheckedIn ? "Check out" : "Check in"}
        </Button>
      )}
      {error && <span className="text-xs text-rose">{error}</span>}
    </div>
  );
}

function ManagerAttendanceRoster({ onSelectEmployee }) {
  const { canSeeAllDepartments } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [designations, setDesignations] = useState({});
  const [departments, setDepartments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth() + 1);
  const [csvBusy, setCsvBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [emps, profiles, atts] = await Promise.all([
        fetchAllPages("/api/auth/employees/"),
        fetchAllPages("/api/employees/profiles/"),
        fetchAllPages("/api/attendance/attendance/"),
      ]);
      setEmployees(emps);
      const map = {};
      profiles.forEach((p) => { if (p.designation) map[p.user_id] = p.designation; });
      setDesignations(map);
      setAttendance(atts);
      if (canSeeAllDepartments) {
        const depts = await fetchAllPages("/api/auth/departments/");
        setDepartments(depts);
      }
    } catch {
      setError("Couldn't load the employee roster.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = todayStr();
  const monthPrefix = `${viewYear}-${pad2(viewMonth)}`;
  const todayAttendance = useMemo(() => attendance.filter((a) => a.date === today), [attendance, today]);
  const monthAttendance = useMemo(() => attendance.filter((a) => a.date?.startsWith(monthPrefix)), [attendance, monthPrefix]);

  const statusCounts = useMemo(() => {
    const counts = { PRESENT: 0, LATE: 0, HALF_DAY: 0, ABSENT: 0 };
    todayAttendance.forEach((a) => { if (counts[a.status] !== undefined) counts[a.status] += 1; });
    return counts;
  }, [todayAttendance]);

  const avgHoursLabel = useMemo(() => {
    const withHours = monthAttendance.filter((a) => a.check_in && a.check_out);
    if (!withHours.length) return "—";
    const avgMinutes = Math.round(
      withHours.reduce((sum, a) => sum + (new Date(a.check_out) - new Date(a.check_in)) / 60000, 0) / withHours.length
    );
    return `${Math.floor(avgMinutes / 60)}h ${pad2(avgMinutes % 60)}m`;
  }, [monthAttendance]);

  const totalEmployees = employees.length;
  const pct = (n) => (totalEmployees > 0 ? Math.round((n / totalEmployees) * 100) : 0);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (deptFilter !== "ALL" && String(e.department) !== String(deptFilter)) return false;
      if (q && !employeeName(e).toLowerCase().includes(q) && !e.username.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [employees, search, deptFilter]);

  async function downloadTeamCsv() {
    setCsvBusy(true);
    setError("");
    try {
      const { data } = await api.get("/api/attendance/attendance/export_csv/", {
        params: { year: viewYear, month: viewMonth },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance_${viewYear}-${pad2(viewMonth)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't download the team attendance CSV.");
    } finally {
      setCsvBusy(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SelfStatusBar />
        <div className="flex items-center gap-2 flex-wrap">
          <MonthYearPicker year={viewYear} month={viewMonth} onChange={(y, m) => { setViewYear(y); setViewMonth(m); }} />
          <Button variant="ghost" onClick={() => setShowFilters((v) => !v)}>
            <i className="fa-solid fa-filter"></i> Filter
          </Button>
          <Button variant="ghost" onClick={downloadTeamCsv} disabled={csvBusy}>
            <i className="fa-solid fa-file-arrow-down"></i> {csvBusy ? "Preparing…" : "Download CSV"}
          </Button>
        </div>
      </div>

      <ErrorBanner message={error} />

      {showFilters && canSeeAllDepartments && (
        <Card className="p-4 flex items-center gap-3">
          <label className="text-xs font-medium text-muted">Department</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-panel2 border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none focus:border-signal"
          >
            <option value="ALL">All departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatTile icon="fa-solid fa-users" label="Total employees" value={totalEmployees} hint="All active employees" />
        <StatTile icon="fa-solid fa-circle-check" label="Present today" value={statusCounts.PRESENT} hint={`${pct(statusCounts.PRESENT)}% of total`} />
        <StatTile icon="fa-solid fa-clock" label="Late today" value={statusCounts.LATE} hint={`${pct(statusCounts.LATE)}% of total`} />
        <StatTile icon="fa-solid fa-mug-hot" label="Half day" value={statusCounts.HALF_DAY} hint={`${pct(statusCounts.HALF_DAY)}% of total`} />
        <StatTile icon="fa-solid fa-calendar-xmark" label="Absent today" value={statusCounts.ABSENT} hint={`${pct(statusCounts.ABSENT)}% of total`} />
        <StatTile icon="fa-solid fa-hourglass-half" label="Avg. work hours" value={avgHoursLabel} hint="This month average" />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="font-display text-base font-bold text-ink">Employees</h3>
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs"></i>
            <input
              placeholder="Search employee…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-panel2 border border-line rounded-lg pl-8 pr-3 py-1.5 text-sm text-ink outline-none focus:border-signal w-56"
            />
          </div>
        </div>

        {filteredEmployees.length === 0 ? (
          <EmptyState icon="fa-solid fa-users" title="No employees found" hint="Try a different search term." />
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-1 py-2 font-medium w-10">#</th>
                  <th className="px-1 py-2 font-medium">Employee Name</th>
                  <th className="px-1 py-2 font-medium">Position</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, i) => (
                  <tr
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp)}
                    className="border-b border-line last:border-0 hover:bg-panel2/60 transition-colors cursor-pointer"
                  >
                    <td className="px-1 py-3 text-muted">{i + 1}</td>
                    <td className="px-1 py-3 text-ink">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={employeeName(emp)} />
                        {employeeName(emp)}
                      </div>
                    </td>
                    <td className="px-1 py-3 text-muted">{designations[emp.id] || ROLE_LABELS[emp.role] || emp.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================== Page ============================== */

export default function Attendance() {
  const { user, canSeeAllDepartments, isTeamLead } = useAuth();
  const canManage = canSeeAllDepartments || isTeamLead;
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  return (
    <div>
      <PageHeader eyebrow="Presence" title="Attendance" icon="fa-solid fa-user-clock" />
      {!canManage ? (
        <MyAttendancePanel user={user} />
      ) : selectedEmployee ? (
        <EmployeeAttendanceDetail employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} />
      ) : (
        <ManagerAttendanceRoster onSelectEmployee={setSelectedEmployee} />
      )}
    </div>
  );
}
