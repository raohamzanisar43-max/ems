import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { PageHeader, Card, StatusPill, EmptyState, Loading, ErrorBanner, Button, Pagination, Avatar } from "../components/ui";

const STATUS_DOT = {
  PRESENT: "bg-mint",
  LATE: "bg-amber",
  ABSENT: "bg-rose",
  HALF_DAY: "bg-signal",
};

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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

function MiniCalendar({ year, month, recordsByDate, onPrev, onNext }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = new Date(year, month - 1, 1).getDay();
  const cells = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const today = todayStr();

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-bold text-ink">{monthLabel(year, month)}</h3>
        <div className="flex items-center gap-1.5">
          <button onClick={onPrev} className="w-7 h-7 rounded-lg hover:bg-panel2 text-muted hover:text-ink transition flex items-center justify-center">
            <i className="fa-solid fa-chevron-left text-xs"></i>
          </button>
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

function StatTile({ icon, label, value }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <span className="w-10 h-10 rounded-lg bg-signal/10 text-signal flex items-center justify-center text-sm shrink-0">
        <i className={icon}></i>
      </span>
      <div className="min-w-0">
        <p className="text-lg font-black text-ink leading-none truncate">{value}</p>
        <p className="text-[11px] text-muted mt-1 truncate">{label}</p>
      </div>
    </Card>
  );
}

function MyAttendancePanel({ user, showTeamCsvButton }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth() + 1); // 1-based

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/attendance/attendance/", { params: { page_size: 200 } });
      const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
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
    ? Math.round(
        withHours.reduce((sum, r) => sum + (new Date(r.check_out) - new Date(r.check_in)) / 60000, 0) / withHours.length
      )
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
            <MiniCalendar
              year={viewYear}
              month={viewMonth}
              recordsByDate={recordsByDate}
              onPrev={() => shiftMonth(-1)}
              onNext={() => shiftMonth(1)}
            />

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

      {showTeamCsvButton && <TeamAttendanceTable />}
    </div>
  );
}

function TeamAttendanceTable() {
  const { canSeeAllDepartments } = useAuth();
  const {
    items: records, page, count, hasNext, hasPrevious, loading, error, goToPage,
  } = usePaginatedList("/api/attendance/attendance/", "Couldn't load team attendance.");

  return (
    <div className="space-y-3 pt-2">
      <div>
        <h2 className="font-display text-xl font-extrabold text-ink">Team attendance</h2>
        <p className="text-sm text-muted mt-0.5">
          Every record below, sorted by date, then name, then team — use "Download CSV" above to export a full month.
        </p>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <Loading />
      ) : records.length === 0 ? (
        <EmptyState icon="fa-solid fa-user-clock" title="No attendance records yet" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Employee</th>
                  {canSeeAllDepartments && <th className="px-5 py-3 font-medium">Department</th>}
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Check in</th>
                  <th className="px-5 py-3 font-medium">Check out</th>
                  <th className="px-5 py-3 font-medium">Hours</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0 hover:bg-panel2/50 transition-colors">
                    <td className="px-5 py-3 text-ink">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.employee_display_name || r.employee_username} />
                        {r.employee_display_name || r.employee_username}
                      </div>
                    </td>
                    {canSeeAllDepartments && (
                      <td className="px-5 py-3 text-muted">{r.department_name || "—"}</td>
                    )}
                    <td className="px-5 py-3 text-muted">{r.date}</td>
                    <td className="px-5 py-3 text-muted font-mono">{formatTime(r.check_in)}</td>
                    <td className="px-5 py-3 text-muted font-mono">{formatTime(r.check_out)}</td>
                    <td className="px-5 py-3 text-muted font-mono">{r.hours_worked || "—"}</td>
                    <td className="px-5 py-3 text-muted">{r.location_display || "—"}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Pagination page={page} count={count} hasNext={hasNext} hasPrevious={hasPrevious} onPageChange={goToPage} />
    </div>
  );
}

export default function Attendance() {
  const { user, canSeeAllDepartments, isTeamLead } = useAuth();
  const canManage = canSeeAllDepartments || isTeamLead;

  return (
    <div>
      <PageHeader eyebrow="Presence" title="Attendance" icon="fa-solid fa-user-clock" />
      <MyAttendancePanel user={user} showTeamCsvButton={canManage} />
    </div>
  );
}
