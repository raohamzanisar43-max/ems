import { useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { PageHeader, Card, StatusPill, EmptyState, Loading, ErrorBanner, Button, Pagination, Avatar } from "../components/ui";

export default function Reports() {
  const { canSeeAllDepartments, isTeamLead } = useAuth();
  const {
    items: reports, page, count, hasNext, hasPrevious, loading, error, setError, goToPage, reload,
  } = usePaginatedList("/api/reports/reports/", "Couldn't load reports.");
  const [showForm, setShowForm] = useState(false);
  const [comment, setComment] = useState({});
  const [form, setForm] = useState({
    report_date: new Date().toISOString().slice(0, 10),
    summary: "",
    hours_worked: "",
  });

  const canReview = canSeeAllDepartments || isTeamLead;

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post("/api/reports/reports/", form);
      setShowForm(false);
      setForm({ report_date: new Date().toISOString().slice(0, 10), summary: "", hours_worked: "" });
      goToPage(1);
    } catch {
      setError("Couldn't submit — you may have already submitted a report for that date.");
    }
  }

  async function handleReview(id) {
    try {
      await api.post(`/api/reports/reports/${id}/review/`, {
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
        eyebrow="Daily standup"
        title="Reports"
        icon="fa-solid fa-file-invoice"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            <i className={`fa-solid ${showForm ? "fa-xmark" : "fa-plus"}`}></i>
            {showForm ? "Cancel" : "Submit today's report"}
          </Button>
        }
      />

      <ErrorBanner message={error} />

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                  value={form.report_date}
                  onChange={(e) => setForm({ ...form, report_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">Hours worked</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                  value={form.hours_worked}
                  onChange={(e) => setForm({ ...form, hours_worked: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">What did you work on today?</label>
              <textarea
                required
                rows={3}
                className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </div>
            <Button type="submit">Submit report</Button>
          </form>
        </Card>
      )}

      {loading ? (
        <Loading />
      ) : reports.length === 0 ? (
        <EmptyState icon="fa-solid fa-file-invoice" title="No reports yet" hint="Daily reports submitted by the team will show here." />
      ) : (
        <>
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between mb-2 gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={r.employee_username} size="md" />
                  <div>
                    <p className="text-ink font-medium">{r.employee_username}</p>
                    <p className="text-xs text-muted font-mono mt-0.5 flex items-center gap-1.5">
                      <i className="fa-solid fa-calendar-day"></i>{r.report_date}
                      <span className="mx-0.5">·</span>
                      <i className="fa-solid fa-clock"></i>{r.hours_worked}h
                    </p>
                  </div>
                </div>
                <StatusPill status={r.review_status} />
              </div>
              <p className="text-sm text-muted mb-3 pl-3 border-l-2 border-line">{r.summary}</p>

              {r.review_comment && (
                <div className="flex items-start gap-2 text-xs text-mint bg-mint/10 border border-mint/20 rounded-lg px-3 py-2 mb-3">
                  <i className="fa-solid fa-message mt-0.5"></i>
                  <span>Review note: {r.review_comment}</span>
                </div>
              )}

              {canReview && r.review_status === "PENDING_REVIEW" && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  <input
                    placeholder="Add a review note (optional)"
                    className="flex-1 min-w-[180px] bg-panel2 border border-line rounded-lg px-3 py-1.5 text-sm text-ink outline-none focus:border-signal"
                    value={comment[r.id] || ""}
                    onChange={(e) => setComment({ ...comment, [r.id]: e.target.value })}
                  />
                  <Button variant="ghost" onClick={() => handleReview(r.id)}>
                    <i className="fa-solid fa-check text-mint"></i> Mark reviewed
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
