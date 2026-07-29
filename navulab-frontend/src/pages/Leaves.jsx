import { useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { PageHeader, Card, StatusPill, EmptyState, Loading, ErrorBanner, Button, Pagination, Avatar } from "../components/ui";

const LEAVE_TYPES = ["SICK", "CASUAL", "ANNUAL", "UNPAID", "OTHER"];

const LEAVE_TYPE_ICONS = {
  SICK: "fa-solid fa-briefcase-medical",
  CASUAL: "fa-solid fa-umbrella-beach",
  ANNUAL: "fa-solid fa-plane-departure",
  UNPAID: "fa-solid fa-money-bill-transfer",
  OTHER: "fa-solid fa-ellipsis",
};

export default function Leaves() {
  const { canSeeAllDepartments, isTeamLead } = useAuth();
  const {
    items: leaves, page, count, hasNext, hasPrevious, loading, error, setError, goToPage, reload,
  } = usePaginatedList("/api/leaves/leaves/", "Couldn't load leave requests.");
  const [showForm, setShowForm] = useState(false);
  const [comment, setComment] = useState({});
  const [form, setForm] = useState({
    leave_type: "CASUAL",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const canReview = canSeeAllDepartments || isTeamLead;

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post("/api/leaves/leaves/", form);
      setShowForm(false);
      setForm({ leave_type: "CASUAL", start_date: "", end_date: "", reason: "" });
      goToPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't submit that leave request.");
    }
  }

  async function handleReview(id, status) {
    try {
      await api.post(`/api/leaves/leaves/${id}/review/`, {
        status,
        review_comment: comment[id] || "",
      });
      reload();
    } catch {
      setError("Couldn't submit that review.");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Time off"
        title="Leaves"
        icon="fa-solid fa-calendar-minus"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            <i className={`fa-solid ${showForm ? "fa-xmark" : "fa-plus"}`}></i>
            {showForm ? "Cancel" : "Request leave"}
          </Button>
        }
      />

      <ErrorBanner message={error} />

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1.5">Type</label>
                <select
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                  value={form.leave_type}
                  onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
                >
                  {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">Start date</label>
                <input
                  type="date" required
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">End date</label>
                <input
                  type="date" required
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Reason</label>
              <textarea
                rows={2}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <Button type="submit">Submit request</Button>
          </form>
        </Card>
      )}

      {loading ? (
        <Loading />
      ) : leaves.length === 0 ? (
        <EmptyState icon="fa-solid fa-calendar-minus" title="No leave requests yet" hint="Submitted leave requests will show up here." />
      ) : (
        <>
        <div className="space-y-3">
          {leaves.map((l) => (
            <Card key={l.id} className="p-5">
              <div className="flex items-start justify-between mb-2 gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={l.employee_username} size="md" />
                  <div>
                    <p className="text-ink font-medium flex items-center gap-2">
                      {l.employee_username}
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted bg-panel2 border border-line rounded-full px-2.5 py-0.5">
                        <i className={LEAVE_TYPE_ICONS[l.leave_type] || "fa-solid fa-calendar"}></i>
                        {l.leave_type}
                      </span>
                    </p>
                    <p className="text-xs text-muted font-mono mt-0.5">{l.start_date} → {l.end_date}</p>
                  </div>
                </div>
                <StatusPill status={l.status} />
              </div>
              {l.reason && <p className="text-sm text-muted mb-3 pl-3 border-l-2 border-line">{l.reason}</p>}

              {l.review_comment && (
                <div className="flex items-start gap-2 text-xs text-mint bg-mint/10 border border-mint/20 rounded-lg px-3 py-2 mb-3">
                  <i className="fa-solid fa-message mt-0.5"></i>
                  <span>Review note: {l.review_comment}</span>
                </div>
              )}

              {canReview && l.status === "PENDING" && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  <input
                    placeholder="Add a review note (optional)"
                    className="flex-1 min-w-[180px] bg-panel2 border border-line rounded-lg px-3 py-1.5 text-sm text-ink outline-none focus:border-signal"
                    value={comment[l.id] || ""}
                    onChange={(e) => setComment({ ...comment, [l.id]: e.target.value })}
                  />
                  <Button variant="ghost" onClick={() => handleReview(l.id, "APPROVED")}>
                    <i className="fa-solid fa-check text-mint"></i> Approve
                  </Button>
                  <Button variant="danger" onClick={() => handleReview(l.id, "REJECTED")}>
                    <i className="fa-solid fa-xmark"></i> Reject
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
        <Pagination page={page} count={count} hasNext={hasNext} hasPrevious={hasPrevious} onPageChange={goToPage} />
        </>
      )}
    </div>
  );
}
