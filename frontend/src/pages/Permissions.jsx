import { useEffect, useState } from "react";
import api from "../api/client";
import { PageHeader, Card, Loading, ErrorBanner } from "../components/ui";

const COLUMNS = [
  { key: "can_see_all_departments", label: "All departments" },
  { key: "can_manage_employees", label: "Manage employees" },
  { key: "can_manage_payroll", label: "Manage payroll" },
  { key: "can_review_leaves_reports", label: "Review leaves & reports" },
  { key: "can_manage_tasks_all", label: "Manage all tasks" },
];

// Matches the exact logic on the User model (apps/users/models.py) for the
// 7 built-in roles — this is a read-only mirror, not a separate source of truth.
const SYSTEM_ROLES = [
  { name: "Admin", can_see_all_departments: true, can_manage_employees: true, can_manage_payroll: true, can_review_leaves_reports: true, can_manage_tasks_all: true },
  { name: "CEO", can_see_all_departments: true, can_manage_employees: true, can_manage_payroll: false, can_review_leaves_reports: true, can_manage_tasks_all: true },
  { name: "CTO", can_see_all_departments: true, can_manage_employees: true, can_manage_payroll: false, can_review_leaves_reports: true, can_manage_tasks_all: true },
  { name: "HR", can_see_all_departments: true, can_manage_employees: true, can_manage_payroll: true, can_review_leaves_reports: true, can_manage_tasks_all: true },
  { name: "Finance", can_see_all_departments: false, can_manage_employees: false, can_manage_payroll: true, can_review_leaves_reports: false, can_manage_tasks_all: false },
  { name: "Team Lead", can_see_all_departments: false, can_manage_employees: true, can_manage_payroll: false, can_review_leaves_reports: true, can_manage_tasks_all: true },
  { name: "Employee", can_see_all_departments: false, can_manage_employees: false, can_manage_payroll: false, can_review_leaves_reports: false, can_manage_tasks_all: false },
];

function Check({ on }) {
  return on ? (
    <i className="fa-solid fa-circle-check text-mint"></i>
  ) : (
    <i className="fa-solid fa-circle-minus text-muted/40"></i>
  );
}

export default function Permissions() {
  const [customRoles, setCustomRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/auth/roles/", { params: { page_size: 500 } })
      .then(({ data }) => setCustomRoles(data.results || data))
      .catch(() => setError("Couldn't load custom roles."))
      .finally(() => setLoading(false));
  }, []);

  const rows = [
    ...SYSTEM_ROLES.map((r) => ({ ...r, kind: "System" })),
    ...customRoles.map((r) => ({ ...r, kind: "Custom" })),
  ];

  return (
    <div>
      <PageHeader eyebrow="Access" title="Permissions" icon="fa-solid fa-shield-halved" />

      <ErrorBanner message={error} />

      <p className="text-sm text-muted mb-5">
        A read-only overview of what each role — built-in or custom — currently has access to.
        To grant a different set of permissions, create a new role on the{" "}
        <span className="text-signal font-medium">Roles</span> page.
      </p>

      {loading ? (
        <Loading />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Role</th>
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="px-5 py-3 font-medium text-center">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.kind}-${row.name}-${i}`} className="border-b border-line last:border-0 hover:bg-panel2/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-ink font-medium">{row.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                          row.kind === "System" ? "bg-panel2 text-muted border border-line" : "bg-signal/10 text-signal border border-signal/20"
                        }`}>
                          {row.kind}
                        </span>
                      </div>
                    </td>
                    {COLUMNS.map((c) => (
                      <td key={c.key} className="px-5 py-3 text-center">
                        <Check on={!!row[c.key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
