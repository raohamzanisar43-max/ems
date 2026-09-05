import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import { usePaginatedList } from "../hooks/usePaginatedList";
import { PageHeader, Card, EmptyState, Loading, ErrorBanner, SuccessBanner, Button, Pagination, Avatar } from "../components/ui";

const ALL_ROLES = ["EMPLOYEE", "TEAM_LEAD", "FINANCE", "HR", "CEO", "CTO"];

const EMPLOYEE_TYPES = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACTUAL", label: "Contractual" },
  { value: "INTERN", label: "Intern" },
];

function formatCNIC(value) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  const part1 = digits.slice(0, 5);
  const part2 = digits.slice(5, 12);
  const part3 = digits.slice(12, 13);
  return [part1, part2, part3].filter(Boolean).join("-");
}

const PHONE_COUNTRY_CODE = "+92";

function formatPhoneDigits(value) {
  return value.replace(/\D/g, "").slice(0, 11);
}

// Strips a previously-saved "+92" prefix so the edit form only ever holds
// the local digits (the input itself never shows the country code).
function stripPhoneCountryCode(value) {
  return formatPhoneDigits((value || "").replace(/^\+?92\s*/, ""));
}

const ROLE_BADGE_CLASSES = {
  ADMIN: "bg-purple/15 text-purple border-purple/30",
  CEO: "bg-purple/15 text-purple border-purple/30",
  CTO: "bg-purple/15 text-purple border-purple/30",
  HR: "bg-signal/15 text-signal border-signal/30",
  FINANCE: "bg-amber/15 text-amber border-amber/30",
  TEAM_LEAD: "bg-mint/15 text-mint border-mint/30",
  EMPLOYEE: "bg-panel2 text-muted border-line",
};

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${ROLE_BADGE_CLASSES[role] || ROLE_BADGE_CLASSES.EMPLOYEE}`}>
      {role?.replace("_", " ")}
    </span>
  );
}

export default function Employees() {
  const { isAdmin, isHR, canSeeAllDepartments, user } = useAuth();
  const canCreateEmployees = isAdmin || isHR;
  const canConfigureOfficeTiming = isAdmin || isHR;
  const ROLES = ALL_ROLES;
  const {
    items: employees, page, count, hasNext, hasPrevious, loading, error, setError, goToPage,
  } = usePaginatedList("/api/auth/employees/", "Couldn't load employees.");
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const emptyForm = {
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "EMPLOYEE",
    department: "",
    password: "",
    phone: "",
    personal_email: "",
    cnic: "",
    residential_address: "",
    date_of_birth: "",
    reporting_manager: "",
    employee_type: "FULL_TIME",
    custom_role: "",
    office_start_time: "",
    office_end_time: "",
    is_dual_shift: false,
    second_shift_start_time: "",
    second_shift_end_time: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [customRoles, setCustomRoles] = useState([]);
  const [editingId, setEditingId] = useState(null);

  async function loadDepartments() {
    try {
      const { data } = await api.get("/api/auth/departments/");
      setDepartments(data.results || data);
    } catch {
      // HR/CEO-only endpoint; a non-HR viewer simply won't get a dropdown.
    }
  }

  async function loadManagers() {
    try {
      const { data } = await api.get("/api/auth/employees/", { params: { page_size: 500 } });
      setManagers(data.results || data);
    } catch {
      // Non-HR viewers just won't get a reporting-manager dropdown.
    }
  }

  async function loadCustomRoles() {
    try {
      const { data } = await api.get("/api/auth/roles/", { params: { page_size: 500 } });
      setCustomRoles(data.results || data);
    } catch {
      // HR/Admin-only endpoint; a non-HR/Admin viewer simply won't get a dropdown.
    }
  }

  useEffect(() => {
    loadDepartments();
    loadManagers();
    loadCustomRoles();
  }, []);

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setSuccess("");
    setError("");
    setShowForm(true);
  }

  async function openEditForm(emp) {
    let officeStart = "";
    let officeEnd = "";
    let isDualShift = false;
    let secondShiftStart = "";
    let secondShiftEnd = "";

    try {
      const { data } = await api.get("/api/employees/profiles/");
      const profile = (data.results || data).find((item) => item.user_id === emp.id);
      if (profile) {
        officeStart = profile.office_start_time || "";
        officeEnd = profile.office_end_time || "";
        isDualShift = Boolean(profile.is_dual_shift);
        secondShiftStart = profile.second_shift_start_time || "";
        secondShiftEnd = profile.second_shift_end_time || "";
      }
    } catch {
      // Non-admin viewers won't be able to fetch this view; keep the form open with blank values.
    }

    setForm({
      username: emp.username || "",
      email: emp.email || "",
      first_name: emp.first_name || "",
      last_name: emp.last_name || "",
      role: emp.role || "EMPLOYEE",
      department: emp.department || "",
      password: "",
      phone: stripPhoneCountryCode(emp.phone),
      personal_email: emp.personal_email || "",
      cnic: emp.cnic || "",
      residential_address: emp.residential_address || "",
      date_of_birth: emp.date_of_birth || "",
      reporting_manager: emp.reporting_manager || "",
      employee_type: emp.employee_type || "FULL_TIME",
      custom_role: emp.custom_role || "",
      office_start_time: officeStart,
      office_end_time: officeEnd,
      is_dual_shift: isDualShift,
      second_shift_start_time: secondShiftStart,
      second_shift_end_time: secondShiftEnd,
    });
    setEditingId(emp.id);
    setSuccess("");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccess("");
    setError("");

    const officeTimingPayload = canConfigureOfficeTiming
      ? {
          office_start_time: form.office_start_time || null,
          office_end_time: form.office_end_time || null,
          is_dual_shift: Boolean(form.is_dual_shift),
          second_shift_start_time: form.is_dual_shift
            ? (form.second_shift_start_time || null)
            : null,
          second_shift_end_time: form.is_dual_shift
            ? (form.second_shift_end_time || null)
            : null,
        }
      : {};

    const payload = {
      ...form,
      phone: form.phone ? `${PHONE_COUNTRY_CODE}${form.phone}` : "",
      department: form.department ? Number(form.department) : null,
      reporting_manager: form.reporting_manager ? Number(form.reporting_manager) : null,
      custom_role: form.custom_role ? Number(form.custom_role) : null,
      date_of_birth: form.date_of_birth || null,
    };

    try {
      let savedUserId = editingId;

      if (editingId) {
        delete payload.password;
        delete payload.office_start_time;
        delete payload.office_end_time;
        delete payload.is_dual_shift;
        delete payload.second_shift_start_time;
        delete payload.second_shift_end_time;
        await api.patch(`/api/auth/employees/${editingId}/`, payload);
        setSuccess(`${form.username}'s details were updated.`);
      } else {
        const { data } = await api.post("/api/auth/employees/", payload);
        savedUserId = data.id;
        setSuccess(
          `Account created for ${form.username} — username/password were emailed to ${form.email}. ` +
          `(No real mailbox is set up yet, so check the auth-service log if the email hasn't actually arrived.)`
        );
      }

      if (canConfigureOfficeTiming && (editingId || form.is_dual_shift || form.office_start_time || form.office_end_time)) {
        const profilesRes = await api.get("/api/employees/profiles/");
        const profiles = profilesRes.data.results || profilesRes.data;
        const existingProfile = profiles.find((item) => item.user_id === savedUserId);

        if (existingProfile) {
          await api.patch(`/api/employees/profiles/${existingProfile.id}/`, officeTimingPayload);
        } else {
          await api.post("/api/employees/profiles/", {
            user_id: savedUserId,
            ...officeTimingPayload,
          });
        }
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      loadManagers();
      goToPage(1);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.detail || data?.password?.[0] || data?.username?.[0]
        || (editingId ? "Couldn't update that account." : "Couldn't create that account.");
      setError(msg);
    }
  }

  async function handleDelete(emp) {
    if (!window.confirm(`Delete ${emp.username}'s account? This can't be undone.`)) return;
    setError("");
    try {
      await api.delete(`/api/auth/employees/${emp.id}/`);
      goToPage(1);
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't delete that account.");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Employees"
        icon="fa-solid fa-users"
        action={
          canCreateEmployees && (
            <Button onClick={() => (showForm ? closeForm() : openCreateForm())}>
              <i className={`fa-solid ${showForm ? "fa-xmark" : "fa-user-plus"}`}></i>
              {showForm ? "Cancel" : "Add employee"}
            </Button>
          )
        }
      />

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      {showForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5">Username</label>
              <input required className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Email</label>
              <input required type="email" className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            {!editingId && (
              <div>
                <label className="block text-xs text-muted mb-1.5">Password</label>
                <input required type="text" minLength={8} className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal font-mono"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="min. 8 characters" />
              </div>
            )}
            <div>
              <label className="block text-xs text-muted mb-1.5">First name</label>
              <input required className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Last name</label>
              <input required className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Role</label>
              <select required className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Department</label>
              <select required className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="" disabled>Select a department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Primary contact no.</label>
              <div className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 flex items-center gap-2 focus-within:border-signal">
                <span className="text-muted font-mono text-sm shrink-0">{PHONE_COUNTRY_CODE}</span>
                <input required inputMode="numeric" maxLength={11} className="w-full bg-transparent text-ink outline-none font-mono"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhoneDigits(e.target.value) })}
                  placeholder="3XXXXXXXXX" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Personal email</label>
              <input required type="email" className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.personal_email} onChange={(e) => setForm({ ...form, personal_email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">CNIC no.</label>
              <input required inputMode="numeric" maxLength={15} className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal font-mono"
                value={form.cnic} onChange={(e) => setForm({ ...form, cnic: formatCNIC(e.target.value) })}
                placeholder="XXXXX-XXXXXXX-X" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Date of birth</label>
              <input required type="date" className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted mb-1.5">Residential address</label>
              <input required className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.residential_address} onChange={(e) => setForm({ ...form, residential_address: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Reporting manager</label>
              <select required className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.reporting_manager} onChange={(e) => setForm({ ...form, reporting_manager: e.target.value })}>
                <option value="" disabled>Select a reporting manager</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{`${m.first_name} ${m.last_name}`.trim() || m.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5">Employee type</label>
              <select required className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                value={form.employee_type} onChange={(e) => setForm({ ...form, employee_type: e.target.value })}>
                {EMPLOYEE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {customRoles.length > 0 && (
              <div>
                <label className="block text-xs text-muted mb-1.5">Custom role</label>
                <select className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                  value={form.custom_role} onChange={(e) => setForm({ ...form, custom_role: e.target.value })}>
                  <option value="">— none —</option>
                  {customRoles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {canConfigureOfficeTiming && (
              <>
                <div>
                  <label className="block text-xs text-muted mb-1.5">Office start time</label>
                  <input type="time" className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                    value={form.office_start_time} onChange={(e) => setForm({ ...form, office_start_time: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1.5">Office end time</label>
                  <input type="time" className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                    value={form.office_end_time} onChange={(e) => setForm({ ...form, office_end_time: e.target.value })} />
                </div>
                <label className="sm:col-span-2 flex items-center gap-3 rounded-lg border border-line bg-panel2 px-3 py-3 text-sm text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-signal"
                    checked={form.is_dual_shift}
                    onChange={(e) => setForm({
                      ...form,
                      is_dual_shift: e.target.checked,
                      ...(e.target.checked ? {} : {
                        second_shift_start_time: "",
                        second_shift_end_time: "",
                      }),
                    })}
                  />
                  <span>
                    <span className="block font-medium">Dual-shift employee</span>
                    <span className="block text-xs text-muted mt-0.5">Configure a second working period for this employee.</span>
                  </span>
                </label>
                {form.is_dual_shift && (
                  <>
                    <div>
                      <label className="block text-xs text-muted mb-1.5">Second shift start time</label>
                      <input type="time" className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                        value={form.second_shift_start_time} onChange={(e) => setForm({ ...form, second_shift_start_time: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1.5">Second shift end time</label>
                      <input type="time" className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
                        value={form.second_shift_end_time} onChange={(e) => setForm({ ...form, second_shift_end_time: e.target.value })} />
                    </div>
                  </>
                )}
              </>
            )}
            <div className="sm:col-span-2">
              <Button type="submit">
                <i className={`fa-solid ${editingId ? "fa-floppy-disk" : "fa-paper-plane"}`}></i>
                {editingId ? "Save changes" : "Create account & email credentials"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Loading />
      ) : employees.length === 0 ? (
        <EmptyState icon="fa-solid fa-users" title="No employees found" />
      ) : (
        <>
        <Card>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Username</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Custom role</th>
                <th className="px-5 py-3 font-medium">Department</th>
                {canSeeAllDepartments && <th className="px-5 py-3 font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-line last:border-0 hover:bg-panel2/50 transition-colors">
                  <td className="px-5 py-3 text-ink">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={`${emp.first_name} ${emp.last_name}`.trim() || emp.username} />
                      {emp.first_name} {emp.last_name}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted font-mono">{emp.username}</td>
                  <td className="px-5 py-3 text-muted">{emp.email}</td>
                  <td className="px-5 py-3"><RoleBadge role={emp.role} /></td>
                  <td className="px-5 py-3 text-muted">{emp.custom_role_name || "—"}</td>
                  <td className="px-5 py-3 text-muted">{emp.department_name || "—"}</td>
                  {canSeeAllDepartments && (
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditForm(emp)}
                          title="Edit employee"
                          className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted hover:text-signal hover:bg-signal/10 transition-colors"
                        >
                          <i className="fa-solid fa-pen text-xs"></i>
                        </button>
                        {emp.id !== user?.id && (
                          <button
                            onClick={() => handleDelete(emp)}
                            title="Delete employee"
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted hover:text-rose hover:bg-rose/10 transition-colors"
                          >
                            <i className="fa-solid fa-trash-can text-xs"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
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
