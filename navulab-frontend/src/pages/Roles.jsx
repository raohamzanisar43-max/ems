import { useState } from "react";
import api from "../api/client";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { PageHeader, Card, EmptyState, Loading, ErrorBanner, SuccessBanner, Button, Pagination } from "../components/ui";

const PERMISSION_FIELDS = [
  { key: "can_see_all_departments", label: "See all departments" },
  { key: "can_manage_employees", label: "Manage employees" },
  { key: "can_manage_payroll", label: "Manage payroll" },
  { key: "can_review_leaves_reports", label: "Review leaves & reports" },
  { key: "can_manage_tasks_all", label: "Manage all tasks" },
];

const emptyForm = {
  name: "",
  description: "",
  can_see_all_departments: false,
  can_manage_employees: false,
  can_manage_payroll: false,
  can_review_leaves_reports: false,
  can_manage_tasks_all: false,
};

export default function Roles() {
  const {
    items: roles, page, count, hasNext, hasPrevious, loading, error, setError, goToPage,
  } = usePaginatedList("/api/auth/roles/", "Couldn't load roles.");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function handleCreate(e) {
    e.preventDefault();
    setSuccess("");
    setError("");
    try {
      await api.post("/api/auth/roles/", form);
      setSuccess(`Role "${form.name}" created.`);
      setShowForm(false);
      setForm(emptyForm);
      goToPage(1);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.name?.[0] || data?.detail || "Couldn't create that role.";
      setError(msg);
    }
  }

  async function handleDelete(role) {
    if (!window.confirm(`Delete role "${role.name}"? Employees with this role will lose the extra access it grants.`)) return;
    setError("");
    try {
      await api.delete(`/api/auth/roles/${role.id}/`);
      goToPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't delete that role.");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Access"
        title="Roles"
        icon="fa-solid fa-user-tag"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            <i className={`fa-solid ${showForm ? "fa-xmark" : "fa-plus"}`}></i>
            {showForm ? "Cancel" : "New role"}
          </Button>
        }
      />

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted mb-1.5">Role name</label>
                <input required className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Marketing Lead" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">Description</label>
                <input className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted mb-2">What can this role do?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PERMISSION_FIELDS.map((f) => (
                  <label key={f.key} className="flex items-center gap-2.5 bg-panel2 border border-line rounded-lg px-3 py-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded accent-signal"
                      checked={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                    />
                    <span className="text-sm text-ink">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit"><i className="fa-solid fa-check"></i> Create role</Button>
          </form>
        </Card>
      )}

      {loading ? (
        <Loading />
      ) : roles.length === 0 ? (
        <EmptyState icon="fa-solid fa-user-tag" title="No custom roles yet" hint="Create one to grant extra access beyond the built-in roles." />
      ) : (
        <>
        <Card>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Grants</th>
                <th className="px-5 py-3 font-medium">Employees</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b border-line last:border-0 hover:bg-panel2/50 transition-colors align-top">
                  <td className="px-5 py-3">
                    <div className="text-ink font-medium">{role.name}</div>
                    {role.description && <div className="text-xs text-muted mt-0.5">{role.description}</div>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {PERMISSION_FIELDS.filter((f) => role[f.key]).map((f) => (
                        <span key={f.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-signal/10 text-signal border border-signal/20">
                          {f.label}
                        </span>
                      ))}
                      {PERMISSION_FIELDS.every((f) => !role[f.key]) && (
                        <span className="text-xs text-muted">No extra access</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted font-mono">{role.user_count}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(role)}
                      title="Delete role"
                      className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted hover:text-rose hover:bg-rose/10 transition-colors"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
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
