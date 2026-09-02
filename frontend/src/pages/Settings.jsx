import { useEffect, useRef, useState } from "react";
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


function initials(firstName, lastName, username) {
  const value = `${firstName || ""} ${lastName || ""}`.trim();

  if (value) {
    return value
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }

  return (username || "?").charAt(0).toUpperCase();
}


function ProfileAvatar({
  profile,
  size = "large",
}) {
  const imageUrl = profile?.user?.profile_picture_url;

  const sizeClass =
    size === "large"
      ? "w-28 h-28 text-3xl"
      : "w-16 h-16 text-xl";

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt="Profile"
        className={`${sizeClass} rounded-full object-cover border-4 border-panel shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-signal text-white flex items-center justify-center font-bold border-4 border-panel shadow-sm`}
    >
      {initials(
        profile?.user?.first_name,
        profile?.user?.last_name,
        profile?.user?.username
      )}
    </div>
  );
}


function SectionHeader({
  icon,
  title,
  onEdit,
  editing,
}) {
  return (
    <div className="flex items-center justify-between gap-3 pb-3 mb-5 border-b border-line">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-signal/10 text-signal flex items-center justify-center">
          <i className={icon}></i>
        </div>

        <h3 className="font-display text-base font-bold text-ink">
          {title}
        </h3>
      </div>

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="w-9 h-9 rounded-lg border border-line bg-panel2 text-muted hover:text-signal hover:border-signal/30 transition flex items-center justify-center"
          aria-label={editing ? "Cancel editing" : `Edit ${title}`}
        >
          <i
            className={
              editing
                ? "fa-solid fa-xmark"
                : "fa-solid fa-pen"
            }
          ></i>
        </button>
      )}
    </div>
  );
}


function InfoField({
  label,
  value,
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-1">
        {label}
      </p>

      <div className="min-h-10 rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-ink flex items-center">
        {value || "Not provided"}
      </div>
    </div>
  );
}


function TextInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted mb-1.5">
        {label}
      </label>

      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-signal transition"
      />
    </div>
  );
}


function TextArea({
  label,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted mb-1.5">
        {label}
      </label>

      <textarea
        rows={4}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-signal transition resize-none"
      />
    </div>
  );
}


function ProfilePictureCard({
  profile,
  onUpdated,
}) {
  const inputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowed.includes(file.type)) {
      setError(
        "Please select a JPG, PNG, or WebP image."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Profile picture must be smaller than 5 MB."
      );
      return;
    }

    const formData = new FormData();

    formData.append(
      "profile_picture",
      file
    );

    setUploading(true);

    try {
      await api.post(
        "/api/auth/my-profile/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      onUpdated();

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Couldn't upload the profile picture."
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <ProfileAvatar profile={profile} />

        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-display text-lg font-bold text-ink">
            Profile picture
          </h3>

          <p className="text-sm text-muted mt-1 mb-4">
            Add a professional photo to personalize your EMS profile.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <i className="fa-solid fa-camera"></i>
            {uploading
              ? "Uploading..."
              : "Choose photo"}
          </Button>

          <p className="text-[11px] text-muted mt-2">
            JPG, PNG or WebP. Maximum 5 MB.
          </p>

          {error && (
            <p className="text-xs text-rose mt-3">
              {error}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}


function PersonalInformation({
  profile,
  onUpdated,
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({});

  useEffect(() => {
    setForm({
      first_name: profile?.user?.first_name || "",
      last_name: profile?.user?.last_name || "",
      phone: profile?.user?.phone || "",
      personal_email: profile?.user?.personal_email || "",
      residential_address:
        profile?.user?.residential_address || "",
      date_of_birth:
        profile?.user?.date_of_birth || "",
    });
  }, [profile]);

  async function save() {
    setSaving(true);

    try {
      await api.patch(
        "/api/auth/my-profile/",
        form
      );

      setEditing(false);
      onUpdated();

    } catch {
      // Parent page handles refreshed state.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <SectionHeader
        icon="fa-solid fa-user"
        title="Personal Information"
        editing={editing}
        onEdit={() => setEditing((value) => !value)}
      />

      {editing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInput
            label="First Name"
            value={form.first_name}
            onChange={(e) =>
              setForm({
                ...form,
                first_name: e.target.value,
              })
            }
          />

          <TextInput
            label="Last Name"
            value={form.last_name}
            onChange={(e) =>
              setForm({
                ...form,
                last_name: e.target.value,
              })
            }
          />

          <TextInput
            label="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm({
                ...form,
                phone: e.target.value,
              })
            }
          />

          <TextInput
            label="Personal Email"
            type="email"
            value={form.personal_email}
            onChange={(e) =>
              setForm({
                ...form,
                personal_email: e.target.value,
              })
            }
          />

          <TextInput
            label="Date of Birth"
            type="date"
            value={form.date_of_birth}
            onChange={(e) =>
              setForm({
                ...form,
                date_of_birth: e.target.value,
              })
            }
          />

          <div className="md:col-span-2">
            <TextArea
              label="Residential Address"
              value={form.residential_address}
              onChange={(e) =>
                setForm({
                  ...form,
                  residential_address:
                    e.target.value,
                })
              }
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={saving}
              onClick={save}
            >
              <i className="fa-solid fa-floppy-disk"></i>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField
            label="Full Name"
            value={`${profile?.user?.first_name || ""} ${profile?.user?.last_name || ""}`.trim() || profile?.user?.username}
          />

          <InfoField
            label="Employee ID"
            value={profile?.employee_profile?.employee_code}
          />

          <InfoField
            label="Email"
            value={profile?.user?.email}
          />

          <InfoField
            label="Phone"
            value={profile?.user?.phone}
          />

          <InfoField
            label="Personal Email"
            value={profile?.user?.personal_email}
          />

          <InfoField
            label="Date of Birth"
            value={profile?.user?.date_of_birth}
          />

          <div className="md:col-span-2">
            <InfoField
              label="Residential Address"
              value={profile?.user?.residential_address}
            />
          </div>
        </div>
      )}
    </Card>
  );
}


function EmploymentDetails({
  profile,
}) {
  const user = profile?.user || {};
  const employee = profile?.employee_profile || {};

  return (
    <Card className="p-6">
      <SectionHeader
        icon="fa-solid fa-briefcase"
        title="Employment Details"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoField
          label="Department"
          value={user.department_name}
        />

        <InfoField
          label="Reporting Manager"
          value={user.reporting_manager_name}
        />

        <InfoField
          label="Employment Type"
          value={user.employee_type_label}
        />

        <InfoField
          label="Date of Joining"
          value={user.date_joined_company}
        />

        <InfoField
          label="Designation"
          value={employee.designation}
        />

        <InfoField
          label="Work Location"
          value={employee.work_location}
        />

        <InfoField
          label="Grade"
          value={employee.grade}
        />

        <InfoField
          label="Cost Center"
          value={employee.cost_center}
        />
      </div>

      <div className="mt-4 rounded-lg bg-amber/10 border border-amber/20 px-4 py-3 text-xs text-muted">
        Employment information is managed by HR/Admin and is shown here as read-only employee information.
      </div>
    </Card>
  );
}


function SkillsCard({
  profile,
  onUpdated,
}) {
  const [editing, setEditing] = useState(false);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSkills(
      Array.isArray(
        profile?.employee_profile?.skills
      )
        ? profile.employee_profile.skills
        : []
    );
  }, [profile]);

  function addSkill() {
    const value = skillInput.trim();

    if (!value) return;

    if (
      skills.some(
        (skill) =>
          String(skill).toLowerCase() ===
          value.toLowerCase()
      )
    ) {
      setSkillInput("");
      return;
    }

    setSkills([
      ...skills,
      value,
    ]);

    setSkillInput("");
  }

  function removeSkill(index) {
    setSkills(
      skills.filter(
        (_, i) => i !== index
      )
    );
  }

  async function save() {
    setSaving(true);

    try {
      await api.patch(
        "/api/auth/my-profile/",
        {
          skills,
        }
      );

      setEditing(false);
      onUpdated();

    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <SectionHeader
        icon="fa-solid fa-star"
        title="Skills"
        editing={editing}
        onEdit={() => setEditing((value) => !value)}
      />

      {editing ? (
        <div>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={(e) =>
                setSkillInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="e.g. React"
              className="flex-1 bg-panel2 border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-signal"
            />

            <Button
              type="button"
              onClick={addSkill}
            >
              <i className="fa-solid fa-plus"></i>
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {skills.map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="inline-flex items-center gap-2 bg-signal/10 border border-signal/20 text-signal rounded-full px-3 py-1.5 text-xs font-semibold"
              >
                {skill}

                <button
                  type="button"
                  onClick={() =>
                    removeSkill(index)
                  }
                  className="hover:text-rose"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </span>
            ))}

            {skills.length === 0 && (
              <p className="text-sm text-muted">
                No skills added yet.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={saving}
              onClick={save}
            >
              <i className="fa-solid fa-floppy-disk"></i>
              {saving ? "Saving..." : "Save skills"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={`${skill}-${index}`}
              className="bg-panel2 border border-line text-ink rounded-full px-3 py-1.5 text-xs font-semibold"
            >
              {skill}
            </span>
          ))}

          {skills.length === 0 && (
            <p className="text-sm text-muted">
              No skills added yet.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}


function EmergencyContactCard({
  profile,
  onUpdated,
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({});

  useEffect(() => {
    const employee =
      profile?.employee_profile || {};

    setForm({
      emergency_contact_name:
        employee.emergency_contact_name || "",

      emergency_contact_relationship:
        employee.emergency_contact_relationship || "",

      emergency_contact_phone:
        employee.emergency_contact_phone || "",
    });
  }, [profile]);

  async function save() {
    setSaving(true);

    try {
      await api.patch(
        "/api/auth/my-profile/",
        form
      );

      setEditing(false);
      onUpdated();

    } finally {
      setSaving(false);
    }
  }

  const employee =
    profile?.employee_profile || {};

  return (
    <Card className="p-6">
      <SectionHeader
        icon="fa-solid fa-heart-pulse"
        title="Emergency Contact"
        editing={editing}
        onEdit={() => setEditing((value) => !value)}
      />

      {editing ? (
        <div className="space-y-4">
          <TextInput
            label="Name"
            value={
              form.emergency_contact_name
            }
            onChange={(e) =>
              setForm({
                ...form,
                emergency_contact_name:
                  e.target.value,
              })
            }
          />

          <TextInput
            label="Relationship"
            value={
              form.emergency_contact_relationship
            }
            onChange={(e) =>
              setForm({
                ...form,
                emergency_contact_relationship:
                  e.target.value,
              })
            }
          />

          <TextInput
            label="Phone"
            value={
              form.emergency_contact_phone
            }
            onChange={(e) =>
              setForm({
                ...form,
                emergency_contact_phone:
                  e.target.value,
              })
            }
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={saving}
              onClick={save}
            >
              <i className="fa-solid fa-floppy-disk"></i>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-rose/5 border border-rose/15">
          <div className="w-11 h-11 rounded-full bg-rose/10 text-rose flex items-center justify-center shrink-0">
            <i className="fa-solid fa-phone"></i>
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-ink">
              {employee.emergency_contact_name ||
                "No emergency contact added"}
            </p>

            {employee.emergency_contact_name && (
              <>
                <p className="text-xs text-muted mt-0.5">
                  {employee.emergency_contact_relationship ||
                    "Relationship not provided"}
                </p>

                <p className="text-sm text-ink mt-1">
                  {employee.emergency_contact_phone ||
                    "Phone not provided"}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}


function ChangePasswordCard() {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await api.post(
        "/api/auth/change-password/",
        form
      );

      setSuccess(
        "Your password has been changed successfully."
      );

      setForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

    } catch (err) {
      const data = err.response?.data;

      setError(
        data?.current_password?.[0] ||
        data?.confirm_password?.[0] ||
        data?.new_password?.[0] ||
        data?.detail ||
        "Couldn't change your password."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <SectionHeader
        icon="fa-solid fa-lock"
        title="Account Security"
      />

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <form
        onSubmit={submit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <TextInput
          label="Current Password"
          type="password"
          value={form.current_password}
          onChange={(e) =>
            setForm({
              ...form,
              current_password:
                e.target.value,
            })
          }
        />

        <div />

        <TextInput
          label="New Password"
          type="password"
          value={form.new_password}
          onChange={(e) =>
            setForm({
              ...form,
              new_password:
                e.target.value,
            })
          }
        />

        <TextInput
          label="Confirm New Password"
          type="password"
          value={form.confirm_password}
          onChange={(e) =>
            setForm({
              ...form,
              confirm_password:
                e.target.value,
            })
          }
        />

        <div className="md:col-span-2 flex justify-end">
          <Button
            type="submit"
            disabled={saving}
          >
            <i className="fa-solid fa-key"></i>
            {saving
              ? "Updating..."
              : "Update password"}
          </Button>
        </div>
      </form>
    </Card>
  );
}


function AdministrationSection() {
  const {
    isHR,
    isAdmin,
  } = useAuth();

  if (!isHR && !isAdmin) {
    return null;
  }

  return (
    <Card className="p-6">
      <SectionHeader
        icon="fa-solid fa-building-shield"
        title="Administration"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-line bg-panel2 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-signal/10 text-signal flex items-center justify-center">
              <i className="fa-solid fa-building"></i>
            </div>

            <div>
              <p className="font-semibold text-ink">
                Company Profile
              </p>

              <p className="text-xs text-muted mt-0.5">
                Organisation information and branding.
              </p>
            </div>
          </div>

          <a
            href="/settings/company"
            className="inline-flex items-center gap-2 text-xs font-semibold text-signal mt-4 hover:underline"
          >
            Manage company settings
            <i className="fa-solid fa-arrow-right"></i>
          </a>
        </div>

        <div className="rounded-xl border border-line bg-panel2 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-mint/10 text-mint flex items-center justify-center">
              <i className="fa-solid fa-users"></i>
            </div>

            <div>
              <p className="font-semibold text-ink">
                Departments
              </p>

              <p className="text-xs text-muted mt-0.5">
                Manage organisational departments.
              </p>
            </div>
          </div>

          <a
            href="/settings/company"
            className="inline-flex items-center gap-2 text-xs font-semibold text-signal mt-4 hover:underline"
          >
            Manage departments
            <i className="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </Card>
  );
}


export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function loadProfile(showSpinner = true) {
    if (showSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const { data } = await api.get(
        "/api/auth/my-profile/"
      );

      setProfile(data);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Couldn't load your profile."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (!profile) {
    return (
      <div>
        <PageHeader
          eyebrow="Account"
          title="Settings"
          icon="fa-solid fa-gear"
        />

        <ErrorBanner message={error} />
      </div>
    );
  }

  const user = profile.user || {};
  const employee =
    profile.employee_profile || {};

  const displayName =
    `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
    user.username;

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        icon="fa-solid fa-gear"
        action={
          refreshing ? (
            <span className="text-xs text-muted">
              Saving...
            </span>
          ) : null
        }
      />

      <ErrorBanner message={error} />

      <div className="space-y-6">
        {/* Profile summary */}
        <Card className="p-6 overflow-hidden">
          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-24 rounded-xl bg-gradient-to-r from-signal/20 via-signal/5 to-mint/15" />

            <div className="relative pt-8 flex flex-col lg:flex-row items-center lg:items-end gap-5">
              <ProfileAvatar profile={profile} />

              <div className="flex-1 text-center lg:text-left">
                <h2 className="font-display text-2xl font-extrabold text-ink">
                  {displayName}
                </h2>

                <p className="text-sm text-muted mt-1">
                  {employee.designation ||
                    user.role_label ||
                    "Employee"}
                </p>

                <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint/10 border border-mint/20 text-mint text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-mint" />
                    {user.is_active_employee
                      ? "Active Employee"
                      : "Inactive Employee"}
                  </span>

                  {user.department_name && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-signal/10 border border-signal/20 text-signal text-xs font-semibold">
                      <i className="fa-solid fa-building text-[10px]"></i>
                      {user.department_name}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-auto grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-panel2 border border-line px-5 py-3 text-center">
                  <p className="text-xl font-bold text-ink">
                    {employee.employee_code || "—"}
                  </p>

                  <p className="text-[10px] uppercase tracking-wide text-muted mt-1">
                    Employee ID
                  </p>
                </div>

                <div className="rounded-xl bg-panel2 border border-line px-5 py-3 text-center">
                  <p className="text-xl font-bold text-ink">
                    {user.employee_type_label || "—"}
                  </p>

                  <p className="text-[10px] uppercase tracking-wide text-muted mt-1">
                    Employment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <ProfilePictureCard
          profile={profile}
          onUpdated={() =>
            loadProfile(false)
          }
        />

        <PersonalInformation
          profile={profile}
          onUpdated={() =>
            loadProfile(false)
          }
        />

        <EmploymentDetails
          profile={profile}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkillsCard
            profile={profile}
            onUpdated={() =>
              loadProfile(false)
            }
          />

          <EmergencyContactCard
            profile={profile}
            onUpdated={() =>
              loadProfile(false)
            }
          />
        </div>

        <ChangePasswordCard />

        <AdministrationSection />
      </div>
    </div>
  );
}