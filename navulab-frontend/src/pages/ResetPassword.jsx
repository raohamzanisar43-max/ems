import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client";
import Logo from "../components/Logo";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [uid, setUid] = useState(searchParams.get("uid") || "");
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/api/auth/password-reset-confirm/", { uid, token, new_password: newPassword });
      setDone(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't reset the password. The link may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <div className="mb-4"><Logo size={26} /></div>
          <h1 className="font-display text-4xl font-semibold text-ink">Set a new password</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-panel border border-line rounded-2xl p-7 shadow-panel">
          {done ? (
            <div className="text-sm text-mint bg-mint/10 border border-mint/20 rounded-lg px-3 py-2.5">
              Password reset. Redirecting to sign in…
            </div>
          ) : (
            <>
              {!searchParams.get("token") && (
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wide">
                      Reset code (uid)
                    </label>
                    <input
                      value={uid}
                      onChange={(e) => setUid(e.target.value)}
                      required
                      className="w-full bg-panel2 border border-line rounded-lg px-3.5 py-2.5 text-ink outline-none focus:border-signal transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wide">
                      Reset code (token)
                    </label>
                    <input
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                      className="w-full bg-panel2 border border-line rounded-lg px-3.5 py-2.5 text-ink outline-none focus:border-signal transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wide">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-panel2 border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-muted/50 focus:border-signal outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="mt-4 text-sm text-rose bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-signal hover:bg-signal/90 disabled:opacity-50 text-ink font-semibold rounded-lg py-2.5 transition-colors"
              >
                {loading ? "Resetting…" : "Reset password"}
              </button>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          <Link to="/login" className="hover:text-signal transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
