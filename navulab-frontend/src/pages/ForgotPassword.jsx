import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import Logo from "../components/Logo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/api/auth/password-reset/", { email });
      setSent(true);
      // Dev convenience: no real mailbox is wired up yet, so the backend hands
      // back the reset code directly instead of only emailing it. Once real
      // SMTP creds are set in auth-service/.env, `data.uid`/`data.token` stop
      // being included and the user has to use the emailed link instead.
      if (data.uid && data.token) {
        setTimeout(() => {
          navigate(`/reset-password?uid=${data.uid}&token=${data.token}`);
        }, 1200);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <div className="mb-4"><Logo size={26} /></div>
          <h1 className="font-display text-4xl font-semibold text-ink">Reset password</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-panel border border-line rounded-2xl p-7 shadow-panel">
          {sent ? (
            <div className="text-sm text-mint bg-mint/10 border border-mint/20 rounded-lg px-3 py-2.5">
              If that email is registered, a reset link has been sent. Check your inbox.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wide">
                  Your email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-panel2 border border-line rounded-lg px-3.5 py-2.5 text-ink placeholder:text-muted/50 focus:border-signal outline-none transition-colors"
                  placeholder="you@novulab.com"
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
                {loading ? "Sending…" : "Send reset link"}
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
