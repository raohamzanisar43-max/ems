import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import "./Login.css";

const DESIGN_COLORS = ["#7c3aed", "#06b6d4", "#f43f5e", "#10b981"];

export default function Login() {
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("coder");
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [signUpBusy, setSignUpBusy] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [compilerStatus, setCompilerStatus] = useState({ text: "Ready", cls: "text-emerald-400 font-semibold" });
  const [consoleHtml, setConsoleHtml] = useState(
    "&gt; Click [Run Code] to compile and execute program..."
  );

  const [designColor, setDesignColor] = useState(null);
  const [designCardPulse, setDesignCardPulse] = useState(false);

  const canvasRef = useRef(null);
  const isDarkModeRef = useRef(isDarkMode);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    isDarkModeRef.current = isDarkMode;
  }, [isDarkMode]);

  useEffect(() => {
    if (error) showToast(error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // ---- Interactive mouse-driven canvas background (ported 1:1 from the HTML) ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let width = window.innerWidth || 1000;
    let height = window.innerHeight || 800;
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetX = mouseX;
    let targetY = mouseY;

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
    }));

    function resizeCanvas() {
      width = canvas.width = window.innerWidth || 1000;
      height = canvas.height = window.innerHeight || 800;
    }
    function onMouseMove(e) {
      if (e && typeof e.clientX === "number") {
        targetX = e.clientX;
        targetY = e.clientY;
      }
    }

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", onMouseMove);
    resizeCanvas();

    let frameId;
    function renderBackground() {
      const dark = isDarkModeRef.current;

      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const hueX = Math.round((mouseX / width) * 60) + 220;
      const hueY = Math.round((mouseY / height) * 40) + 260;

      const radius = Math.max(width, height) * 0.7;
      const grad1 = ctx.createRadialGradient(mouseX, mouseY, 50, mouseX, mouseY, radius > 0 ? radius : 500);

      if (dark) {
        grad1.addColorStop(0, "rgba(18, 58, 93, 0.85)");
        grad1.addColorStop(0.5, "rgba(11, 39, 68, 0.9)");
        grad1.addColorStop(1, "rgba(7, 27, 46, 0.98)");
      } else {
        grad1.addColorStop(0, `hsla(${hueX}, 80%, 94%, 0.8)`);
        grad1.addColorStop(0.4, `hsla(${hueY}, 70%, 96%, 0.5)`);
        grad1.addColorStop(1, "rgba(246, 248, 253, 0.95)");
      }

      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const orb1X = width * 0.2 + (mouseX - width / 2) * 0.08;
      const orb1Y = height * 0.3 + (mouseY - height / 2) * 0.08;
      const gradOrb1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, 350);

      if (dark) {
        gradOrb1.addColorStop(0, "rgba(102, 232, 255, 0.25)");
        gradOrb1.addColorStop(0.5, "rgba(28, 115, 201, 0.15)");
        gradOrb1.addColorStop(1, "transparent");
      } else {
        gradOrb1.addColorStop(0, `hsla(${Math.max(0, hueX - 30)}, 85%, 88%, 0.4)`);
        gradOrb1.addColorStop(1, "transparent");
      }
      ctx.fillStyle = gradOrb1;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = dark ? "rgba(102, 232, 255, 0.6)" : `hsla(${hueX}, 70%, 60%, 0.4)`;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      frameId = requestAnimationFrame(renderBackground);
    }

    renderBackground();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  function showToast(message, type = "success") {
    setToast({ visible: true, message, type });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 3500);
  }

  function toggleThemeMode() {
    setIsDarkMode((v) => {
      const next = !v;
      showToast(next ? "Switched to Dark Mode 🌙" : "Switched to Light Mode ☀️", "info");
      return next;
    });
  }

  function toggleAuthMode() {
    setIsSignUpMode((v) => !v);
  }

  function togglePasswordVisibility() {
    setShowPassword((v) => !v);
  }

  function runLiveCode() {
    if (isCodeRunning) return;
    setIsCodeRunning(true);
    setCompilerStatus({ text: "Compiling...", cls: "text-amber-400 font-semibold animate-pulse" });
    setConsoleHtml('<span class="text-amber-400">&gt; [COMPILING] Building TypeScript AST &amp; Bundling Assets...</span>');

    setTimeout(() => {
      setConsoleHtml('<span class="text-sky-400">&gt; [RUNNING] Executing AppCore.tsx in V8 Engine...</span>');
    }, 800);

    setTimeout(() => {
      setCompilerStatus({ text: "Passed (24/24)", cls: "text-emerald-400 font-semibold" });
      setConsoleHtml(
        '<span class="text-emerald-400">&gt; [SUCCESS] App deployed live! Status: 200 OK | Response Time: 12ms ✨</span>'
      );
      setIsCodeRunning(false);
      showToast("Code compiled & executed successfully! 🚀", "success");
    }, 1800);
  }

  function changeDesignColor(colorHex) {
    setDesignColor(colorHex);
    setDesignCardPulse(true);
    setTimeout(() => setDesignCardPulse(false), 250);
    showToast(`Applied design palette: ${colorHex}`, "info");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSignUpMode) {
      setSignUpBusy(true);
      setTimeout(() => {
        setSignUpBusy(false);
        showToast("Account creation is handled by HR — please contact HR to get access.", "info");
      }, 900);
      return;
    }

    const ok = await login(identifier, password);
    if (ok) {
      showToast(`Successfully logged in as ${identifier}`, "success");
      navigate("/");
    }
  }

  function handleSocialLogin(provider) {
    showToast(`${provider} sign-in isn't connected yet.`, "info");
  }

  function handleForgotPasswordToast(e) {
    e.preventDefault();
    if (!identifier) {
      showToast("Please enter your email address first", "error");
    }
  }

  const busy = isSignUpMode ? signUpBusy : loading;

  return (
    <div
      className={`novu-login ${isDarkMode ? "dark" : ""} min-h-screen w-full relative p-4 sm:p-6 lg:p-10`}
      style={{
        background: isDarkMode
          ? "linear-gradient(180deg, #071B2E 0%, #0B2744 45%, #123A5D 100%)"
          : "#f6f8fd",
      }}
    >
      {/* Interactive mouse-driven canvas background */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />

      <main className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-4 min-h-screen">
        {/* ================= LEFT COLUMN: BRAND & HERO CONTENT ================= */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8 pr-0 lg:pr-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative w-11 h-11 flex items-center justify-center group-hover:scale-105 transition duration-300">
                <img
                  src="/novulabs-mark.png"
                  alt="NovuLabs"
                  className="w-11 h-11 object-contain transform group-hover:rotate-12 transition duration-300"
                />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
              </div>
              <div>
                <span className="font-outfit font-extrabold text-2xl tracking-tight block leading-none dark:text-white text-slate-900">
                  Novu<span className="text-brand-600 dark:text-brand-500">Labs</span>
                </span>
                <span className="text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mt-0.5 block">
                  SOFTWARE SOLUTIONS
                </span>
              </div>
            </div>

            <button
              onClick={toggleThemeMode}
              className="glass-card px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-md border hover:scale-105 active:scale-95 transition-all duration-300 group"
              aria-label="Toggle dark mode"
            >
              <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-indigo-950 text-amber-600 dark:text-indigo-400 flex items-center justify-center transition duration-300">
                <i className={`fa-solid ${isDarkMode ? "fa-moon" : "fa-sun"} text-sm transition-transform duration-500 group-hover:rotate-45`}></i>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{isDarkMode ? "Dark Mode" : "Light Mode"}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 dark:bg-electric-cyan/10 border border-brand-500/20 dark:border-electric-cyan/30 text-brand-600 dark:text-electric-cyan text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-500 dark:bg-electric-cyan animate-ping"></span>
              <span>Engineering Next-Gen Enterprise Software &amp; AI UI</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] dark:text-white text-slate-900">
              Building Digital Solutions <br className="hidden sm:inline" />
              <span className="gradient-heading bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-500 dark:from-electric-ice dark:via-electric-cyan dark:to-electric-azure bg-clip-text text-transparent">
                That Drive Success
              </span>
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              NovuLabs seamlessly pairs high-performance code engineering with stunning UI/UX product design to build modern web and mobile apps.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab("coder")}
                className={
                  activeTab === "coder"
                    ? "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-brand-600 text-white shadow-lg shadow-brand-500/25 transition duration-300"
                    : "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/60 dark:hover:bg-slate-800/50 transition duration-300"
                }
              >
                <i className="fa-solid fa-code text-xs"></i>
                <span>Coder Studio (Run Code)</span>
              </button>
              <button
                onClick={() => setActiveTab("designer")}
                className={
                  activeTab === "designer"
                    ? "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-purple-600 text-white shadow-lg shadow-purple-500/25 transition duration-300"
                    : "flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-white/60 dark:hover:bg-slate-800/50 transition duration-300"
                }
              >
                <i className="fa-solid fa-pen-nib text-xs"></i>
                <span>Designer Studio (Make Design)</span>
              </button>
            </div>

            {activeTab === "coder" && (
              <div className="glass-card rounded-3xl p-4 sm:p-5 transition-all duration-500">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                    <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 ml-2 flex items-center gap-1.5">
                      <i className="fa-brands fa-react text-sky-400"></i> AppCore.tsx
                    </span>
                  </div>
                  <button
                    onClick={runLiveCode}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 group"
                  >
                    <i className={`fa-solid ${isCodeRunning ? "fa-spinner animate-spin" : "fa-play group-hover:scale-110"} text-[10px] transition`}></i>
                    <span>{isCodeRunning ? "Running..." : "Run Code"}</span>
                  </button>
                </div>

                <div className="bg-slate-950 rounded-2xl p-4 mt-3 font-mono text-xs text-slate-200 space-y-2 border border-slate-800 shadow-inner overflow-x-auto">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] border-b border-slate-900 pb-1.5">
                    <span>// NOVULABS CORE SYSTEM CODE</span>
                    <span className={compilerStatus.cls}>{compilerStatus.text}</span>
                  </div>

                  <div className="space-y-1">
                    <div><span className="text-pink-400">import</span> {"{ NovuEngine, AICompiler }"} <span className="text-pink-400">from</span> <span className="text-emerald-300">'@novulabs/core'</span>;</div>
                    <div><span className="text-purple-400">const</span> app = <span className="text-amber-300">new</span> NovuEngine({"{"} <span className="text-sky-300">mode</span>: <span className="text-emerald-300">'high-performance'</span> {"}"});</div>
                    <div className="text-slate-400"><span className="text-purple-400">async function</span> <span className="text-blue-400">deploySystem</span>() {"{"}</div>
                    <div className="pl-4 text-slate-300">
                      <span className="text-purple-400">await</span> app.<span className="text-blue-400">compileAndDeploy</span>({"{"} <span className="text-sky-300">target</span>: <span className="text-emerald-300">'global-cloud'</span> {"}"});
                    </div>
                    <div className="pl-4 text-emerald-400 flex items-center gap-1">
                      <span>console.log(</span><span className="text-emerald-300">'🚀 System running with zero latency!'</span><span>);</span>
                      <span className="w-2 h-4 bg-emerald-400 inline-block animate-code-cursor"></span>
                    </div>
                    <div className="text-slate-400">{"}"}</div>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 text-[11px] font-mono mt-2 transition-all">
                    <div className="text-slate-400 text-[10px] flex items-center justify-between mb-1">
                      <span>OUTPUT CONSOLE</span>
                      <span className="text-brand-400">Live Server</span>
                    </div>
                    <div className="text-emerald-400 font-semibold" dangerouslySetInnerHTML={{ __html: consoleHtml }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="service-row flex items-center gap-2.5 p-2 rounded-xl bg-indigo-50 dark:bg-slate-800/60 text-xs">
                    <div className="icon-box w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs shrink-0">
                      <i className="fa-solid fa-code"></i>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">Clean Architecture</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">TypeScript &amp; Microservices</span>
                    </div>
                  </div>
                  <div className="service-row flex items-center gap-2.5 p-2 rounded-xl bg-emerald-50 dark:bg-slate-800/60 text-xs">
                    <div className="icon-box w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0">
                      <i className="fa-solid fa-bolt"></i>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">Instant Compilation</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Sub-second build times</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "designer" && (
              <div className="glass-card rounded-3xl p-4 sm:p-5 transition-all duration-500">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">
                      <i className="fa-solid fa-layer-group"></i>
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Novu Studio Design Tool</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Theme:</span>
                    {DESIGN_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => changeDesignColor(c)}
                        style={{ backgroundColor: c }}
                        className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm"
                      ></button>
                    ))}
                  </div>
                </div>

                <div className="relative bg-slate-900/90 rounded-2xl h-56 mt-3 border border-slate-800 overflow-hidden flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" fill="none">
                    <path className="animated-bezier-path" d="M 20 120 C 80 20, 160 180, 280 80" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" style={{ strokeDasharray: 400, animation: "drawPenPath 6s ease-in-out infinite" }} />
                    <circle cx="20" cy="120" r="5" fill="#ffffff" stroke="#7c3aed" strokeWidth="2" />
                    <circle cx="80" cy="20" r="4" fill="#a855f7" />
                    <circle cx="160" cy="180" r="4" fill="#a855f7" />
                    <circle cx="280" cy="80" r="5" fill="#ffffff" stroke="#7c3aed" strokeWidth="2" />
                  </svg>

                  <div className="pen-cursor-node absolute top-0 left-0 text-white z-20 pointer-events-none drop-shadow-md" style={{ animation: "movePenCursor 6s ease-in-out infinite" }}>
                    <i className="fa-solid fa-location-arrow -rotate-45 text-brand-400 text-lg"></i>
                    <span className="absolute left-4 top-2 text-[9px] font-mono bg-brand-600 text-white px-1.5 py-0.5 rounded-md shadow">Vector Point</span>
                  </div>

                  <div
                    className="relative z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl border border-white/40 dark:border-slate-700 shadow-xl max-w-xs w-full transition-all duration-300"
                    style={{ transform: designCardPulse ? "scale(1.04)" : "scale(1)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center text-lg shadow-md shadow-brand-500/30 transition-all duration-300"
                        style={designColor ? { backgroundColor: designColor, boxShadow: `0 8px 20px -3px ${designColor}66` } : undefined}
                      >
                        <i className="fa-solid fa-palette"></i>
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Design Component</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Vector UI with dynamic styling</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-400">UX Precision</span>
                      <span className="text-brand-600 dark:text-brand-400" style={designColor ? { color: designColor } : undefined}>
                        {designColor ? `Theme: ${designColor}` : "100% Pixel Perfect"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="service-row flex items-center gap-2.5 p-2 rounded-xl bg-purple-50 dark:bg-slate-800/60 text-xs">
                    <div className="icon-box w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs shrink-0">
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">UI/UX Systems</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Figma Design Libraries</span>
                    </div>
                  </div>
                  <div className="service-row flex items-center gap-2.5 p-2 rounded-xl bg-pink-50 dark:bg-slate-800/60 text-xs">
                    <div className="icon-box w-7 h-7 rounded-lg bg-pink-500 text-white flex items-center justify-center text-xs shrink-0">
                      <i className="fa-solid fa-bezier-curve"></i>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">Vector Graphics</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Smooth motion design</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 font-medium flex items-center justify-between">
            <span>© 2026 NovuLabs. All rights reserved.</span>
            <span className="text-brand-600 dark:text-brand-400 font-bold">v2.4 Live Edition</span>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: AUTHENTICATION CARD ================= */}
        <div className="lg:col-span-5 relative">
          <div className="glass-card rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500"></div>

            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2 dark:text-white text-slate-900">
                {isSignUpMode ? (
                  <>
                    <span>Create Account</span>
                    <span className="inline-block animate-bounce">🎉</span>
                  </>
                ) : (
                  <>
                    <span>Welcome Back!</span>
                    <span className="inline-block animate-wave origin-bottom-right">👋</span>
                  </>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isSignUpMode ? "Join NovuLabs today & build the future" : "Login to access your NovuLabs account"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUpMode && (
                <div className="space-y-1.5 transition-all duration-300">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="input-glass border rounded-2xl px-4 py-3 flex items-center gap-3">
                    <i className="fa-regular fa-user text-slate-400 text-sm"></i>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="bg-transparent w-full text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Username
                </label>
                <div className="input-glass border rounded-2xl px-4 py-3 flex items-center gap-3">
                  <i className="fa-regular fa-user text-slate-400 text-sm"></i>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoFocus
                    placeholder="Enter your username"
                    className="bg-transparent w-full text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <div className="input-glass border rounded-2xl px-4 py-3 flex items-center gap-3 relative">
                  <i className="fa-solid fa-lock text-slate-400 text-sm"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="bg-transparent w-full text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none pr-8"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                    aria-label="Toggle password visibility"
                  >
                    <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`}></i>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 accent-brand-600 transition cursor-pointer"
                  />
                  <span className="text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition font-medium">
                    Remember me
                  </span>
                </label>

                <Link
                  to="/forgot-password"
                  onClick={handleForgotPasswordToast}
                  className="text-brand-600 dark:text-brand-400 hover:text-brand-700 font-bold hover:underline transition"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full btn-primary-gradient bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-700 hover:to-indigo-800 disabled:opacity-70 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition duration-300 transform active:scale-[0.99] flex items-center justify-center gap-2 group"
              >
                <span>
                  {busy
                    ? isSignUpMode
                      ? "Creating account..."
                      : "Authenticating..."
                    : isSignUpMode
                    ? "Sign Up"
                    : "Log In"}
                </span>
                <i
                  className={`fa-solid ${busy ? "fa-circle-notch animate-spin" : "fa-arrow-right group-hover:translate-x-1"} text-xs transition-transform`}
                ></i>
              </button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <span className="relative bg-white dark:bg-slate-900 px-3 text-xs text-slate-500 dark:text-slate-400 font-medium rounded-full">
                or continue with
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleSocialLogin("Google")}
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition duration-200 shadow-sm group"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Google</span>
              </button>

              <button
                onClick={() => handleSocialLogin("GitHub")}
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition duration-200 shadow-sm group"
              >
                <i className="fa-brands fa-github text-slate-900 dark:text-white text-base"></i>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">GitHub</span>
              </button>

              <button
                onClick={() => handleSocialLogin("Microsoft")}
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition duration-200 shadow-sm group"
              >
                <svg className="w-4 h-4" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Microsoft</span>
              </button>
            </div>

            <div className="mt-8 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>{isSignUpMode ? "Already have an account?" : "Don't have an account?"}</span>
              <button
                type="button"
                onClick={toggleAuthMode}
                className="text-brand-600 dark:text-brand-400 font-extrabold hover:text-brand-800 ml-1 hover:underline transition"
              >
                {isSignUpMode ? "Log in" : "Sign up"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      <div
        className={`fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 transition-all duration-300 flex items-center gap-3 ${
          toast.visible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        }`}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
            toast.type === "error"
              ? "bg-red-500/20 text-red-400"
              : toast.type === "info"
              ? "bg-blue-500/20 text-blue-400"
              : "bg-emerald-500/20 text-emerald-400"
          }`}
        >
          <i
            className={`fa-solid ${
              toast.type === "error" ? "fa-triangle-exclamation" : toast.type === "info" ? "fa-spinner animate-spin" : "fa-check"
            }`}
          ></i>
        </div>
        <span className="text-xs font-semibold">{toast.message}</span>
      </div>
    </div>
  );
}
