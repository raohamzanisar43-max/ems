import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "./Login.css";

export default function Login() {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const ok = await login(identifier, password);
    if (ok) navigate("/");
  }

  return (
    <div className="novu-login min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <main className="flex flex-col lg:flex-row w-full max-w-5xl items-stretch relative">
        {/* Left panel — logo + welcome, hidden on small screens */}
        <div className="login-glass-panel hidden lg:flex w-full lg:w-1/2 flex-col items-center justify-center p-12 rounded-3xl z-10 relative">
          <div className="mb-8 w-48 h-48 rounded-2xl bg-white flex items-center justify-center shadow-xl overflow-hidden">
            <img src="/static/novulabs-mark.png" alt="NovuLabs" className="w-32 h-32 object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-center text-[#1a365d]">
            Welcome to NovuLabs
          </h1>
          <p className="text-sm text-[#3a5a78] mt-3 text-center max-w-xs">
            Sign in to manage attendance, tasks, and your team — all in one place.
          </p>
        </div>

        {/* Right panel — sign-in form */}
        <div className="login-card w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-10 md:p-12 rounded-3xl z-0 lg:-ml-8 mt-6 lg:mt-0 relative">
          <div className="max-w-sm w-full mx-auto">
            <div className="flex lg:hidden justify-center mb-6">
              <img src="/static/novulabs-mark.png" alt="NovuLabs" className="w-16 h-16 object-contain" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center lg:text-left">Welcome Back</h2>
            <p className="text-sm text-muted mt-1.5 mb-8 text-center lg:text-left">
              Sign in to your NovuLabs EMS account
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5" htmlFor="identifier">
                  Username
                </label>
                <div className="login-input rounded-xl px-4 py-3 flex items-center gap-2.5">
                  <i className="fa-regular fa-user text-muted text-sm"></i>
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoFocus
                    placeholder="Enter your username"
                    className="bg-transparent w-full text-slate-800 placeholder:text-muted text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5" htmlFor="password">
                  Password
                </label>
                <div className="login-input rounded-xl px-4 py-3 flex items-center gap-2.5">
                  <i className="fa-solid fa-lock text-muted text-sm"></i>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="bg-transparent w-full text-slate-800 placeholder:text-muted text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-muted hover:text-ink transition shrink-0"
                    aria-label="Toggle password visibility"
                  >
                    <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 accent-signal" />
                  <span className="text-slate-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-signal font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-rose bg-rose/10 border border-rose/20 rounded-lg px-3.5 py-2.5">
                  <i className="fa-solid fa-triangle-exclamation mt-0.5 shrink-0"></i>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="login-btn w-full text-white font-medium py-3.5 px-4 rounded-2xl text-base transition disabled:opacity-70 flex items-center justify-center gap-2"
              >
                <span>{loading ? "Signing in…" : "Sign In"}</span>
                <i className={`fa-solid ${loading ? "fa-circle-notch fa-spin" : "fa-arrow-right"} text-xs`}></i>
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-muted">
              Don't have an account?{" "}
              <a href="mailto:admin@novulabs.net" className="text-slate-600 hover:text-signal font-medium transition">
                Contact Admin
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
