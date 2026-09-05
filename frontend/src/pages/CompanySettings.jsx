import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/useAuth";
import {
  PageHeader,
  Card,
  Loading,
  ErrorBanner,
  SuccessBanner,
  Button,
} from "../components/ui";


export default function CompanySettings() {
  const { isAdmin, isHR } = useAuth();
  const canManage = isAdmin || isHR;
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }

    api.get("/api/auth/company-profile/")
      .then(({ data }) => {
        setForm({
          name: data.name || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          logo_url: data.logo_url || "",
          wifi_restriction_enabled: Boolean(data.wifi_restriction_enabled),
          allowed_wifi_ips: data.allowed_wifi_ips || "",
        });
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Could not load company settings.");
      })
      .finally(() => setLoading(false));
  }, [canManage]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setSuccess("");
    setError("");
  }

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.patch("/api/auth/company-profile/", form);
      setSuccess("Company settings saved.");
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || data?.allowed_wifi_ips?.[0] || "Could not save company settings.");
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return (
      <div>
        <PageHeader eyebrow="Administration" title="Company settings" icon="fa-solid fa-building-shield" />
        <ErrorBanner message="You do not have permission to manage company settings." />
      </div>
    );
  }

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader eyebrow="Administration" title="Company settings" icon="fa-solid fa-building-shield" />
      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      {form && (
        <form onSubmit={saveSettings} className="space-y-6">
          <Card className="p-6">
            <h3 className="font-display text-base font-bold text-ink mb-5">Company profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ["name", "Company name", "text"],
                ["email", "Company email", "email"],
                ["phone", "Company phone", "text"],
                ["website", "Website", "url"],
                ["address", "Address", "text"],
                ["logo_url", "Logo URL", "url"],
              ].map(([field, label, type]) => (
                <label key={field} className="block text-xs text-muted">
                  {label}
                  <input
                    type={type}
                    value={form[field]}
                    onChange={(event) => updateField(field, event.target.value)}
                    className="mt-1.5 w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-signal"
                  />
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-base font-bold text-ink">Attendance location restriction</h3>
            <p className="text-sm text-muted mt-1 mb-5">
              When enabled, employees can check in and check out only from one of these office IP addresses.
            </p>

            <label className="flex items-start gap-3 rounded-lg border border-line bg-panel2 px-3 py-3 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 mt-0.5 accent-signal"
                checked={form.wifi_restriction_enabled}
                onChange={(event) => updateField("wifi_restriction_enabled", event.target.checked)}
              />
              <span>
                <span className="block font-medium">Require office network for attendance</span>
                <span className="block text-xs text-muted mt-0.5">Disable this only when attendance should be available outside the office.</span>
              </span>
            </label>

            <label className="block text-xs text-muted mt-4">
              Allowed office IP addresses
              <textarea
                rows={4}
                value={form.allowed_wifi_ips}
                onChange={(event) => updateField("allowed_wifi_ips", event.target.value)}
                placeholder="Example: 182.191.93.131, 192.168.20.210"
                className="mt-1.5 w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-ink font-mono outline-none focus:border-signal"
              />
              <span className="block mt-1.5">Separate multiple addresses with commas. CIDR notation is not supported.</span>
            </label>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              <i className="fa-solid fa-floppy-disk"></i>
              {saving ? "Saving..." : "Save company settings"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}