import { useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { PageHeader, Card, StatusPill, EmptyState, Loading, ErrorBanner, Button, Pagination, Avatar } from "../components/ui";

const STAT_COLOR_CLASSES = {
  mint: "bg-mint/15 text-mint",
  amber: "bg-amber/15 text-amber",
  rose: "bg-rose/15 text-rose",
  signal: "bg-signal/15 text-signal",
};

function MiniStat({ label, value, color, icon }) {
  return (
    <div className="glass-card bg-panel border border-line rounded-xl px-4 py-3.5 flex items-center gap-3">
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0 ${STAT_COLOR_CLASSES[color]}`}>
        <i className={icon}></i>
      </span>
      <div>
        <p className="text-xl font-bold text-ink leading-none">{value}</p>
        <p className="text-xs text-muted mt-1">{label}</p>
      </div>
    </div>
  );
}

export default function Attendance() {
  const { canSeeAllDepartments } = useAuth();
  const {
    items: records, page, count, hasNext, hasPrevious, loading, error, setError, goToPage, reload,
  } = usePaginatedList("/api/attendance/attendance/", "Couldn't load attendance.");
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => {
    const s = { PRESENT: 0, LATE: 0, ABSENT: 0, HALF_DAY: 0 };
    records.forEach((r) => {
      if (s[r.status] !== undefined) s[r.status] += 1;
    });
    return s;
  }, [records]);

  async function checkIn() {
    setBusy(true);
    try {
      await api.post("/api/attendance/attendance/check_in/");
      reload();
    } catch {
      setError("Couldn't check in.");
    } finally {
      setBusy(false);
    }
  }

  async function checkOut() {
    setBusy(true);
    try {
      await api.post("/api/attendance/attendance/check_out/");
      reload();
    } catch {
      setError("Couldn't check out — did you check in today?");
    } finally {
      setBusy(false);
    }
  }

  async function downloadCsv() {
    try {
      const { data } = await api.get("/api/attendance/attendance/export_csv/", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't download attendance CSV.");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Presence"
        title="Attendance"
        icon="fa-solid fa-user-clock"
        action={
          <div className="flex gap-2.5 flex-wrap">
            <Button variant="ghost" onClick={checkIn} disabled={busy}>
              <i className="fa-solid fa-right-to-bracket"></i> Check in
            </Button>
            <Button onClick={checkOut} disabled={busy}>
              <i className="fa-solid fa-right-from-bracket"></i> Check out
            </Button>
            <Button variant="ghost" onClick={downloadCsv}>
              <i className="fa-solid fa-file-arrow-down"></i> Download CSV
            </Button>
          </div>
        }
      />

      <ErrorBanner message={error} />

      {loading ? (
        <Loading />
      ) : records.length === 0 ? (
        <EmptyState
          icon="fa-solid fa-user-clock"
          title="No attendance records yet"
          hint="Check in to log today's attendance."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MiniStat label="Present (page)" value={stats.PRESENT} color="mint" icon="fa-solid fa-circle-check" />
            <MiniStat label="Late (page)" value={stats.LATE} color="amber" icon="fa-solid fa-clock" />
            <MiniStat label="Half day (page)" value={stats.HALF_DAY} color="signal" icon="fa-solid fa-hourglass-half" />
            <MiniStat label="Absent (page)" value={stats.ABSENT} color="rose" icon="fa-solid fa-circle-xmark" />
          </div>
          <Card>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Employee</th>
                  {canSeeAllDepartments && <th className="px-5 py-3 font-medium">Dept ID</th>}
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Check in</th>
                  <th className="px-5 py-3 font-medium">Check out</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0 hover:bg-panel2/50 transition-colors">
                    <td className="px-5 py-3 text-ink">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.employee_username} />
                        {r.employee_username}
                      </div>
                    </td>
                    {canSeeAllDepartments && (
                      <td className="px-5 py-3 text-muted font-mono">{r.department_id}</td>
                    )}
                    <td className="px-5 py-3 text-muted">{r.date}</td>
                    <td className="px-5 py-3 text-muted font-mono">
                      {r.check_in ? new Date(r.check_in).toLocaleTimeString() : "—"}
                    </td>
                    <td className="px-5 py-3 text-muted font-mono">
                      {r.check_out ? new Date(r.check_out).toLocaleTimeString() : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Card>
          <Pagination page={page} count={count} hasNext={hasNext} hasPrevious={hasPrevious} onPageChange={goToPage} />
        </>
      )}
    </div>
  );
}
