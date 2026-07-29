import { useEffect, useState } from "react";
import api from "../api/client";
import { PageHeader, Card, Loading, ErrorBanner, SuccessBanner, Button } from "../components/ui";

function CompanyProfileCard() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api
      .get("/api/auth/company-profile/")
      .then(({ data }) => setForm(data))
      .catch(() => setError("Couldn't load the company profile."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.patch("/api/auth/company-profile/", form);
      setForm(data);
      setSuccess("Company profile saved.");
    } catch {
      setError("Couldn't save the company profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Card className="p-5"><Loading /></Card>;
  if (!form) return null;

  const fields = [
    { key: "name", label: "Company name" },
    { key: "email", label: "Contact email", type: "email" },
    { key: "phone", label: "Phone" },
    { key: "website", label: "Website" },
    { key: "address", label: "Address", full: true },
    { key: "logo_url", label: "Logo URL", full: true },
  ];

  return (
    <Card className="p-5">
      <h3 className="font-display text-base font-semibold text-ink mb-1">Company profile</h3>
      <p className="text-xs text-muted mb-4">Shown across the Ops Console — org name, contact info, and branding.</p>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />
      <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
            <label className="block text-xs text-muted mb-1.5">{f.label}</label>
            <input
              type={f.type || "text"}
              className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
              value={form[f.key] || ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={saving}>
            <i className="fa-solid fa-floppy-disk"></i> {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function DepartmentsCard() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", code: "" });

  function load() {
    setLoading(true);
    api
      .get("/api/auth/departments/", { params: { page_size: 500 } })
      .then(({ data }) => setDepartments(data.results || data))
      .catch(() => setError("Couldn't load departments."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/api/auth/departments/", form);
      setSuccess(`Department "${form.name}" added.`);
      setForm({ name: "", code: "" });
      load();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.name?.[0] || data?.code?.[0] || "Couldn't add that department.");
    }
  }

  async function handleDelete(dept) {
    if (!window.confirm(`Delete department "${dept.name}"?`)) return;
    setError("");
    try {
      await api.delete(`/api/auth/departments/${dept.id}/`);
      load();
    } catch {
      setError("Couldn't delete that department.");
    }
  }

  return (
    <Card className="p-5">
      <h3 className="font-display text-base font-semibold text-ink mb-1">Departments</h3>
      <p className="text-xs text-muted mb-4">Used for scoping employees, team leads, and reporting across the console.</p>
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label className="block text-xs text-muted mb-1.5">Name</label>
          <input required className="bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Marketing" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5">Code</label>
          <input required className="bg-panel2 border border-line rounded-lg px-3 py-2 text-ink outline-none focus:border-signal font-mono"
            value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. MARKETING" />
        </div>
        <Button type="submit"><i className="fa-solid fa-plus"></i> Add</Button>
      </form>

      {loading ? (
        <Loading />
      ) : (
        <div className="divide-y divide-line">
          {departments.map((d) => (
            <div key={d.id} className="flex items-center justify-between py-2.5">
              <div>
                <span className="text-ink font-medium">{d.name}</span>
                <span className="text-xs text-muted font-mono ml-2">{d.code}</span>
              </div>
              <button
                onClick={() => handleDelete(d)}
                title="Delete department"
                className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted hover:text-rose hover:bg-rose/10 transition-colors"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          ))}
          {departments.length === 0 && <p className="text-sm text-muted py-4">No departments yet.</p>}
        </div>
      )}
    </Card>
  );
}

export default function Settings() {
  return (
    <div>
      <PageHeader eyebrow="Configuration" title="Settings" icon="fa-solid fa-gear" />
      <div className="space-y-6">
        <CompanyProfileCard />
        <DepartmentsCard />
      </div>
    </div>
  );
}
