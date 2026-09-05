import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import { PageHeader, Card, StatusPill, EmptyState, Loading, ErrorBanner, Button, Avatar } from "../components/ui";

const ATTENDANCE_STYLES = `
.attendance-page { width: 100%; }
.attendance-welcome {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 114px;
  padding: 24px 26px;
  margin-bottom: 18px;
  background: #fff;
  border: 1px solid #c1c6d4;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,.05);
  overflow: hidden;
}
.attendance-welcome::after {
  content: "";
  position: absolute;
  width: 260px;
  height: 260px;
  right: -90px;
  top: -150px;
  border-radius: 50%;
  background: rgba(0,95,183,.08);
  filter: blur(28px);
}
.attendance-welcome h2 { position: relative; z-index: 1; margin: 0; font-size: 25px; line-height: 1.2; font-weight: 700; color: #171c1f; }
.attendance-welcome p { position: relative; z-index: 1; margin: 7px 0 0; font-size: 14px; color: #414752; }
.attendance-current-status { position: relative; z-index: 2; text-align: right; flex: 0 0 auto; }
.attendance-current-status > p { margin: 0; color: #00478c; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
.attendance-status-pill {
  display: inline-flex; align-items: center; gap: 7px; margin-top: 6px;
  padding: 7px 12px; border-radius: 999px; font-size: 14px; font-weight: 500;
}
.attendance-status-success { color: #10b981; background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.3); }
.attendance-status-neutral { color: #727783; background: #f0f4f8; border: 1px solid #c1c6d4; }
.attendance-status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.attendance-status-success .attendance-status-dot { animation: attendance-pulse 1.8s ease-in-out infinite; box-shadow: 0 0 8px rgba(16,185,129,.75); }
@keyframes attendance-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(.7); opacity: .65; } }

.attendance-actions { display: flex; justify-content: flex-end; align-items: center; gap: 9px; flex-wrap: wrap; margin-bottom: 18px; }
.attendance-metrics { margin-bottom: 2px; }
.attendance-flip-card { height: 138px; perspective: 1000px; }
.attendance-flip-inner {
  position: relative; width: 100%; height: 100%;
  transition: transform .6s cubic-bezier(.4,0,.2,1);
  transform-style: preserve-3d; cursor: pointer;
}
.attendance-flip-card:hover .attendance-flip-inner { transform: rotateY(180deg); }
.attendance-flip-face {
  position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden;
  background: #fff; border: 1px solid #c1c6d4; border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,.05);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 20px; transition: box-shadow .3s ease, border-color .3s ease;
}
.attendance-flip-card:hover .attendance-flip-face { border-color: rgba(0,71,140,.3); box-shadow: 0 10px 30px -5px rgba(0,0,0,.1); }
.attendance-flip-back { transform: rotateY(180deg); }
.attendance-tile-icon { color: #00478c; font-size: 31px; line-height: 1; margin-bottom: 18px; }
.attendance-tile-label { margin: 0; color: #414752; font-size: 12px; line-height: 16px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.attendance-tile-value { color: #171c1f; font-size: 34px; line-height: 1; font-weight: 700; letter-spacing: -.02em; }
.attendance-tile-hint { margin: 7px 0 0; color: #414752; font-size: 14px; }
.attendance-filter {
  padding: 6px 11px; border-radius: 999px; border: 1px solid #c1c6d4;
  background: #fff; color: #414752; font-size: 12px; font-weight: 500; cursor: pointer;
  transition: all .2s ease;
}
.attendance-filter:hover { background: #f0f4f8; color: #171c1f; }
.attendance-filter.active { color: #00478c; border-color: #00478c; background: rgba(0,95,183,.08); box-shadow: 0 0 10px rgba(0,95,183,.1); }
.attendance-report-card { min-width: 0; }
.attendance-table th { padding: 0 8px 10px; font-weight: 600; }
.attendance-table td { padding: 12px 8px; font-size: 13px; }
.attendance-table tbody tr { transition: background .2s ease; }
.attendance-table tbody tr:hover { background: #f6fafe; }
@media (max-width: 768px) {
  .attendance-welcome { align-items: flex-start; flex-direction: column; }
  .attendance-current-status { text-align: left; }
  .attendance-actions { justify-content: flex-start; }
  .attendance-flip-card { height: 126px; }
  .attendance-tile-icon { margin-bottom: 12px; }
  .attendance-tile-value { font-size: 28px; }
}
@media (prefers-reduced-motion: reduce) {
  .attendance-flip-inner { transition: none; }
  .attendance-status-success .attendance-status-dot { animation: none; }
}
`;

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
                isToday ? "border-2 border-signal shadow-[0_0_10px_rgba(0,95,183,0.2)]" : "border"
              } ${
                record?.status === "PRESENT" ? "bg-mint/10 text-mint border-mint/30" :
                record?.status === "LATE" ? "bg-amber/10 text-amber border-amber/30" :
                record?.status === "ABSENT" ? "bg-rose/10 text-rose border-rose/30" :
                record?.status === "HALF_DAY" ? "bg-signal/10 text-signal border-signal/30" :
                "bg-transparent border-transparent text-muted"
              }`}
              title={record ? record.status : undefined}
            >
              {day}
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

function formatOfficeTime(value) {
  if (!value) return "—";

  const raw = typeof value === "string" ? value : value.toString();
  const [hours, minutes] = raw.split(":").map((part) => Number(part));

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return raw;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function officeTimingSummary(profile) {
  const start = profile?.office_start_time;
  const end = profile?.office_end_time;
  const secondStart = profile?.second_shift_start_time;
  const secondEnd = profile?.second_shift_end_time;

  if (!start && !end) return "Not set";

  const firstShift = `${formatOfficeTime(start)} to ${formatOfficeTime(end)}`;

  if (profile?.is_dual_shift && (secondStart || secondEnd)) {
    return `${firstShift} | ${formatOfficeTime(secondStart)} to ${formatOfficeTime(secondEnd)}`;
  }

  return firstShift;
}

function StatTile({ icon, label, value, hint, title }) {
  return (
    <div className="attendance-flip-card" title={title ?? undefined}>
      <div className="attendance-flip-inner">
        <div className="attendance-flip-face attendance-flip-front">
          <span className="attendance-tile-icon">
            <i className={icon}></i>
          </span>
          <p className="attendance-tile-label">{label}</p>
        </div>
        <div className="attendance-flip-face attendance-flip-back">
          <div className="attendance-tile-value">{value}</div>
          {hint && <p className="attendance-tile-hint">{hint}</p>}
        </div>
      </div>
    </div>
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
  const [reportFilter, setReportFilter] = useState("last10");

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

  const presentCount = monthRows.filter((r) => ["PRESENT", "LATE", "HALF_DAY"].includes(r.status)).length;
  const absentCount = monthRows.filter((r) => r.status === "ABSENT").length;
  const recordedCount = monthRows.length;
  const monthlyRate = recordedCount > 0 ? Math.round((presentCount / recordedCount) * 100) : 0;

  const withHours = monthRows.filter((r) => r.check_in && r.check_out);
  const avgMinutes = withHours.length
    ? Math.round(
        withHours.reduce(
          (sum, r) => sum + (new Date(r.check_out) - new Date(r.check_in)) / 60000,
          0
        ) / withHours.length
      )
    : 0;
  const avgHoursLabel = withHours.length
    ? `${Math.floor(avgMinutes / 60)}h ${pad2(avgMinutes % 60)}m`
    : "—";

  const dailyRows = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const out = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = isoDate(viewYear, viewMonth, day);
      const date = new Date(viewYear, viewMonth - 1, day);
      out.push({
        dateStr,
        day,
        dayLabel: date.toLocaleDateString("en-US", { weekday: "short" }),
        record: recordsByDate[dateStr] || null,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    return out.reverse();
  }, [viewYear, viewMonth, recordsByDate]);

  const reportRows = reportFilter === "last10" ? dailyRows.slice(0, 10) : dailyRows;

  const statusLabel = isCheckedOut ? "Checked Out" : isCheckedIn ? "Checked In" : "Not Checked In";
  const statusClass = isCheckedIn ? "attendance-status-success" : "attendance-status-neutral";

  async function checkIn() {
    setBusy(true);
    setError("");
    try {
      await api.post("/api/attendance/attendance/check_in/");
      await load();
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
      await load();
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
    setReportFilter("last10");
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
    <div className="attendance-page">
      <div className="attendance-welcome">
        <div>
          <h2>Good Morning, {user?.first_name || user?.username || "there"}</h2>
          <p>Here is your attendance overview for {monthLabel(viewYear, viewMonth)}.</p>
        </div>
        <div className="attendance-current-status">
          <p>Current Status</p>
          <span className={`attendance-status-pill ${statusClass}`}>
            <span className="attendance-status-dot"></span>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="attendance-actions">
        <MonthYearPicker
          year={viewYear}
          month={viewMonth}
          onChange={(y, m) => { setViewYear(y); setViewMonth(m); }}
        />
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

      <ErrorBanner message={error} />

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 attendance-metrics">
            <StatTile icon="fa-solid fa-percent" label="Monthly Rate" value={`${monthlyRate}%`} />
            <StatTile icon="fa-solid fa-calendar-check" label="Total Present" value={presentCount} hint="Days" />
            <StatTile icon="fa-solid fa-calendar-xmark" label="Total Leaves" value={absentCount} hint="Days" />
            <StatTile icon="fa-solid fa-clock" label="Avg Work Hours" value={avgHoursLabel} hint="Hrs/Day" />
            <StatTile
              icon="fa-solid fa-business-time"
              label="Office Timing"
              value={officeTimingSummary(user)}
              hint="Your schedule"
              title={`Office time: ${officeTimingSummary(user)}`}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[332px_minmax(0,1fr)] gap-6 attendance-lower">
            <MiniCalendar
              year={viewYear}
              month={viewMonth}
              recordsByDate={recordsByDate}
              onPrev={() => shiftMonth(-1)}
              onNext={() => shiftMonth(1)}
            />

            <Card className="p-5 attendance-report-card">
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <h3 className="font-display text-lg font-bold text-ink">Monthly Attendance Report</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReportFilter("last10")}
                    className={`attendance-filter ${reportFilter === "last10" ? "active" : ""}`}
                  >
                    Last 10 Days
                  </button>
                  <button
                    onClick={() => setReportFilter("full")}
                    className={`attendance-filter ${reportFilter === "full" ? "active" : ""}`}
                  >
                    Full Month
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse attendance-table">
                  <thead>
                    <tr className="border-b border-line text-muted text-xs">
                      <th>Date</th>
                      <th>Status</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Hours</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.map((d) => {
                      const r = d.record;
                      let status = r?.status;
                      if (!status && d.isWeekend) status = "WEEKLY_OFF";
                      return (
                        <tr key={d.dateStr} className="border-b border-line last:border-0">
                          <td className="font-medium text-ink whitespace-nowrap">
                            {new Date(`${d.dateStr}T00:00:00`).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              weekday: "short",
                            })}
                          </td>
                          <td className="whitespace-nowrap">
                            {status === "WEEKLY_OFF" ? (
                              <span className="text-xs text-muted">Weekly Off</span>
                            ) : r ? (
                              <StatusPill status={r.status} />
                            ) : (
                              <span className="text-xs text-muted">No record</span>
                            )}
                          </td>
                          <td className="text-muted whitespace-nowrap">{formatTime(r?.check_in)}</td>
                          <td className="text-muted whitespace-nowrap">{formatTime(r?.check_out)}</td>
                          <td className={`whitespace-nowrap ${r?.hours_worked ? "text-signal font-semibold" : "text-muted"}`}>
                            {r?.hours_worked || (r?.status === "ABSENT" ? "Leave" : "—")}
                          </td>
                          <td className="text-muted whitespace-nowrap">{r?.location_display || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {reportRows.length === 0 && (
                <EmptyState icon="fa-solid fa-calendar" title="No attendance data" hint="Check in to start logging attendance." />
              )}

              <div className="flex justify-center mt-4 pt-3 border-t border-line">
                <button
                  onClick={() => setReportFilter("full")}
                  className="font-semibold text-xs text-signal hover:underline"
                >
                  View Full History
                </button>
              </div>
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
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatTile icon="fa-solid fa-briefcase" label="Total working days" value={workingDaysTotal} />
            <StatTile icon="fa-solid fa-calendar-check" label="Present days" value={presentDays} />
            <StatTile icon="fa-solid fa-mug-hot" label="Half days" value={halfDays} />
            <StatTile icon="fa-solid fa-calendar-xmark" label="Absent days" value={absentDays} />
            <StatTile icon="fa-solid fa-clock" label="Late days" value={lateDays} />
            <StatTile
              icon="fa-solid fa-business-time"
              label="Office Timing"
              value={officeTimingSummary(employee)}
              hint="Shift hours"
              title={`Office time: ${officeTimingSummary(employee)}`}
            />
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
      <style>{ATTENDANCE_STYLES}</style>
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
