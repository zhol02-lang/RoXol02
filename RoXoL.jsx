import { useState, useEffect, useRef, useCallback } from "react";

// ── Font injection ──────────────────────────────────────────
(() => {
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Outfit:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(l);
})();

// ── Storage helpers ─────────────────────────────────────────
const db = {
  async get(k) { try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; } catch { return null; } },
  async set(k, v) { try { await window.storage.set(k, JSON.stringify(v)); } catch {} },
  async del(k) { try { await window.storage.delete(k); } catch {} },
};

// ── Constants ───────────────────────────────────────────────
const ROSE = "#8257e5";
const GREEN = "#1bcc18";
const BG = "#07070f";
const BG2 = "#0d0d1a";
const BG3 = "#121220";
const GLASS = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.08)";

// ── Global styles ───────────────────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --rose: ${ROSE}; --green: ${GREEN}; --bg: ${BG}; --bg2: ${BG2}; --bg3: ${BG3}; }
  body { background: ${BG}; color: #f0f0f8; font-family: 'Outfit', sans-serif; overflow: hidden; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,79,139,0.3); border-radius: 2px; }
  input, textarea, select { font-family: 'Outfit', sans-serif; }
  button { font-family: 'Outfit', sans-serif; cursor: pointer; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  @keyframes glow { 0%,100% { box-shadow: 0 0 10px rgba(255,79,139,0.3); } 50% { box-shadow: 0 0 25px rgba(255,79,139,0.6); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes slideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
  .fade-in { animation: fadeIn 0.4s ease forwards; }
  .roxol-root { display:flex; height:100vh; width:100vw; overflow:hidden; background:${BG}; position:relative; }
  .mesh-bg {
    position:fixed; inset:0; pointer-events:none; z-index:0;
    background: radial-gradient(ellipse at 10% 20%, rgba(255,79,139,0.06) 0%, transparent 60%),
                radial-gradient(ellipse at 90% 80%, rgba(27,204,24,0.05) 0%, transparent 60%),
                radial-gradient(ellipse at 50% 50%, rgba(79,156,249,0.03) 0%, transparent 70%);
  }
  .grid-bg {
    position:fixed; inset:0; pointer-events:none; z-index:0; opacity:0.03;
    background-image: linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px);
    background-size: 40px 40px;
  }
`;

// ── Icon set ────────────────────────────────────────────────
const I = {
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  file: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6",
  bot: "M12 2a2 2 0 012 2v2H10V4a2 2 0 012-2zM8 8h8v12H8z M6 8h2 M16 8h2 M10 12h4 M10 16h4",
  tv: "M2 7h20v13a2 2 0 01-2 2H4a2 2 0 01-2-2V7z M17 2l-5 5-5-5",
  dumbbell: "M6 4v16 M10 4v16 M6 12h4 M18 4v16 M14 4v16 M14 12h4",
  heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  chat: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  play: "M5 3l14 9-14 9V3z",
  plus: "M12 5v14 M5 12h14",
  trash: "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
  send: "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  x: "M18 6L6 18 M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  down: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  up: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  ext: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6 M15 3h6v6 M10 14L21 3",
  cal: "M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18",
  clock: "M12 2a10 10 0 110 20A10 10 0 0112 2z M12 6v6l4 2",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  music: "M9 18V5l12-2v13 M6 21a3 3 0 100-6 3 3 0 000 6z M18 19a3 3 0 100-6 3 3 0 000 6z",
  video: "M23 7l-7 5 7 5V7z M1 5h15v14H1z",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.12 1.18 2 2 0 012.1 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.44-.44a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
};

const Ico = ({ d, size = 18, color = "currentColor", strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
  </svg>
);

// ── Reusable components ─────────────────────────────────────
const Btn = ({ children, onClick, color = ROSE, outline = false, small = false, style = {}, disabled = false }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? "6px 14px" : "10px 22px",
    background: outline ? "transparent" : color,
    border: `1px solid ${color}`,
    color: outline ? color : "#fff",
    borderRadius: 8, fontWeight: 600,
    fontSize: small ? 12 : 14,
    transition: "all 0.2s",
    opacity: disabled ? 0.5 : 1,
    ...style
  }}
    onMouseEnter={e => { if (!disabled) { e.target.style.opacity = "0.85"; e.target.style.transform = "translateY(-1px)"; } }}
    onMouseLeave={e => { e.target.style.opacity = "1"; e.target.style.transform = "translateY(0)"; }}
  >{children}</button>
);

const Input = ({ placeholder, value, onChange, type = "text", style = {} }) => (
  <input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{
    width: "100%", padding: "10px 14px",
    background: BG3, border: `1px solid ${BORDER}`,
    borderRadius: 8, color: "#f0f0f8", fontSize: 14,
    outline: "none", transition: "border 0.2s", ...style
  }}
    onFocus={e => e.target.style.borderColor = ROSE}
    onBlur={e => e.target.style.borderColor = BORDER}
  />
);

const Card = ({ children, style = {}, glow = false }) => (
  <div style={{
    background: GLASS, border: `1px solid ${BORDER}`,
    borderRadius: 14, padding: 20,
    backdropFilter: "blur(10px)",
    animation: glow ? "glow 3s infinite" : "none",
    ...style
  }}>{children}</div>
);

const Tag = ({ children, color = ROSE }) => (
  <span style={{
    padding: "2px 10px", borderRadius: 20,
    background: `${color}22`, border: `1px solid ${color}44`,
    color, fontSize: 11, fontWeight: 600
  }}>{children}</span>
);

const Toggle = ({ value, onChange, color = ROSE }) => (
  <div onClick={() => onChange(!value)} style={{
    width: 40, height: 22, borderRadius: 11,
    background: value ? color : "#333",
    position: "relative", cursor: "pointer",
    transition: "background 0.2s",
    border: `1px solid ${value ? color : "#444"}`
  }}>
    <div style={{
      position: "absolute", top: 2,
      left: value ? 20 : 2, width: 16, height: 16,
      borderRadius: "50%", background: "#fff",
      transition: "left 0.2s"
    }} />
  </div>
);

const Modal = ({ children, onClose, title }) => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 999,
    background: "rgba(0,0,0,0.7)", display: "flex",
    alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(4px)"
  }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div style={{
      background: BG2, border: `1px solid ${BORDER}`,
      borderRadius: 16, padding: 28, width: 440,
      maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto",
      animation: "fadeIn 0.2s ease"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, color: ROSE }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}>
          <Ico d={I.x} size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const SectionHeader = ({ title, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
    <h2 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, color: "#f0f0f8" }}>{title}</h2>
    {action}
  </div>
);

// ── Auth Screen ─────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError(""); setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    if (mode === "signup") {
      if (!form.name || !form.email || !form.password) return setError("Fill in all fields"), setLoading(false);
      if (form.password !== form.confirm) return setError("Passwords don't match"), setLoading(false);
      const existing = await db.get(`user:${form.email}`);
      if (existing) return setError("Email already registered"), setLoading(false);
      const user = { name: form.name, email: form.email, password: form.password, createdAt: Date.now() };
      await db.set(`user:${form.email}`, user);
      await db.set("currentUser", user);
      onAuth(user);
    } else {
      if (!form.email || !form.password) return setError("Fill in all fields"), setLoading(false);
      const user = await db.get(`user:${form.email}`);
      if (!user || user.password !== form.password) return setError("Invalid email or password"), setLoading(false);
      await db.set("currentUser", user);
      onAuth(user);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: BG, position: "relative", overflow: "hidden"
    }}>
      <div className="mesh-bg" /><div className="grid-bg" />
      {/* Logo glow */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 300, height: 300, background: `radial-gradient(circle, ${ROSE}15, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, width: 400, maxWidth: "95vw", animation: "fadeIn 0.5s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 42, fontWeight: 900, letterSpacing: "0.1em", lineHeight: 1 }}>
            <span style={{ color: ROSE }}>Ro</span>
            <span style={{ color: "#f0f0f8" }}>X</span>
            <span style={{ color: GREEN }}>oL</span>
          </div>
          <div style={{ color: "#666", fontSize: 13, marginTop: 8, letterSpacing: "0.2em" }}>YOUR PRIVATE HUB</div>
        </div>

        <Card style={{ padding: 32 }}>
          {/* Mode tabs */}
          <div style={{ display: "flex", background: BG3, borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "8px 0", borderRadius: 7, border: "none",
                background: mode === m ? ROSE : "transparent",
                color: mode === m ? "#fff" : "#888", fontWeight: 600, fontSize: 14,
                transition: "all 0.2s"
              }}>{m === "login" ? "Sign In" : "Sign Up"}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && <Input placeholder="Your name" value={form.name} onChange={set("name")} />}
            <Input placeholder="Email address" value={form.email} onChange={set("email")} type="email" />
            <Input placeholder="Password" value={form.password} onChange={set("password")} type="password" />
            {mode === "signup" && <Input placeholder="Confirm password" value={form.confirm} onChange={set("confirm")} type="password" />}
          </div>

          {error && <div style={{ marginTop: 12, padding: "8px 12px", background: "#ff475722", border: "1px solid #ff475744", borderRadius: 8, color: "#ff4757", fontSize: 13 }}>{error}</div>}

          <Btn onClick={submit} disabled={loading} style={{ width: "100%", marginTop: 20, padding: "12px 0" }}>
            {loading ? "⏳ Loading..." : mode === "login" ? "Sign In to RoXoL" : "Create Account"}
          </Btn>
        </Card>

        <p style={{ textAlign: "center", color: "#555", fontSize: 12, marginTop: 20 }}>
          Your private space for everything that matters 💕
        </p>
      </div>
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────
const NAV = [
  { id: "home", label: "Home", icon: I.home },
  { id: "favorites", label: "Favorites", icon: I.star },
  { id: "files", label: "File Vault", icon: I.file },
  { id: "ai", label: "AI Assistant", icon: I.bot },
  { id: "streaming", label: "Streaming", icon: I.tv },
  { id: "watchparty", label: "Watch Party", icon: I.play },
  { id: "workout", label: "Workout", icon: I.dumbbell },
  { id: "cycle", label: "Cycle Tracker", icon: I.heart },
  { id: "chat", label: "Chat & Calls", icon: I.chat },
  { id: "email", label: "AI Email", icon: I.mail },
];

function Sidebar({ view, setView, user, onLogout }) {
  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: BG2, borderRight: `1px solid ${BORDER}`,
      display: "flex", flexDirection: "column",
      padding: "20px 10px", gap: 2,
      position: "relative", zIndex: 10
    }}>
      {/* Logo */}
      <div style={{ padding: "0 10px 20px", borderBottom: `1px solid ${BORDER}`, marginBottom: 8 }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: "0.06em" }}>
          <span style={{ color: ROSE }}>Ro</span>
          <span style={{ color: "#f0f0f8" }}>X</span>
          <span style={{ color: GREEN }}>oL</span>
        </div>
        <div style={{ color: "#444", fontSize: 10, marginTop: 2, letterSpacing: "0.15em" }}>PRIVATE HUB</div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10, border: "none",
            background: view === n.id ? `${ROSE}18` : "transparent",
            color: view === n.id ? ROSE : "#888",
            borderLeft: view === n.id ? `2px solid ${ROSE}` : "2px solid transparent",
            fontSize: 13, fontWeight: view === n.id ? 600 : 400,
            transition: "all 0.15s", textAlign: "left", width: "100%"
          }}
            onMouseEnter={e => { if (view !== n.id) { e.currentTarget.style.background = GLASS; e.currentTarget.style.color = "#ccc"; } }}
            onMouseLeave={e => { if (view !== n.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888"; } }}
          >
            <Ico d={n.icon} size={16} color={view === n.id ? ROSE : "currentColor"} />
            {n.label}
          </button>
        ))}
      </div>

      {/* User */}
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginTop: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: `linear-gradient(135deg, ${ROSE}, ${GREEN})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0
          }}>{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: "#555" }}>Online</div>
          </div>
          <button onClick={onLogout} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 4 }} title="Sign out">
            <Ico d={I.logout} size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Home View ───────────────────────────────────────────────
function HomeView({ user, setView }) {
  const stats = [
    { label: "Favorites", val: "—", color: ROSE, icon: I.star, nav: "favorites" },
    { label: "Files", val: "—", color: GREEN, icon: I.file, nav: "files" },
    { label: "Workouts", val: "—", color: "#4f9cf9", icon: I.dumbbell, nav: "workout" },
    { label: "Cycle Day", val: "—", color: "#ff9f43", icon: I.heart, nav: "cycle" },
  ];

  const quickLaunch = [
    { name: "AnimeXin", url: "https://animexin.dev", emoji: "🎌", color: GREEN },
    { name: "YouTube", url: "https://youtube.com", emoji: "▶️", color: "#ff0000" },
    { name: "Spotify", url: "https://spotify.com", emoji: "🎵", color: "#1db954" },
    { name: "Watch Party", url: null, emoji: "🎬", color: ROSE, nav: "watchparty" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ padding: 32, overflowY: "auto", height: "100%", animation: "fadeIn 0.4s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: "#555", marginBottom: 4 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 26, fontWeight: 700 }}>
          {greeting}, <span style={{ color: ROSE }}>{user?.name?.split(" ")[0]}</span> 👋
        </h1>
        <p style={{ color: "#666", marginTop: 6, fontSize: 14 }}>Welcome back to your private hub</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {stats.map(s => (
          <Card key={s.label} style={{ cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => setView(s.nav)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "'Orbitron',sans-serif" }}>{s.val}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 10, background: `${s.color}15` }}>
                <Ico d={s.icon} size={18} color={s.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Launch */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Quick Launch</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {quickLaunch.map(q => (
            <button key={q.name} onClick={() => q.nav ? setView(q.nav) : window.open(q.url, "_blank")} style={{
              padding: "14px 10px", borderRadius: 10,
              background: BG3, border: `1px solid ${BORDER}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              cursor: "pointer", transition: "all 0.2s"
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = q.color; e.currentTarget.style.background = `${q.color}10`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = BG3; }}>
              <span style={{ fontSize: 22 }}>{q.emoji}</span>
              <span style={{ fontSize: 11, color: "#aaa", fontWeight: 500 }}>{q.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Feature cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { title: "Chat & Calls", desc: "Text, audio & video calls with your partner", icon: I.chat, color: "#4f9cf9", nav: "chat" },
          { title: "Watch Party", desc: "Watch anime & movies in sync together", icon: I.play, color: ROSE, nav: "watchparty" },
          { title: "AI Assistant", desc: "Ask anything, get things done automatically", icon: I.bot, color: GREEN, nav: "ai" },
          { title: "Cycle Tracker", desc: "Track her cycle, stay informed together", icon: I.heart, color: "#ff9f43", nav: "cycle" },
        ].map(f => (
          <Card key={f.title} style={{ cursor: "pointer", transition: "all 0.2s" }} onClick={() => setView(f.nav)}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ padding: 10, borderRadius: 10, background: `${f.color}15`, flexShrink: 0 }}>
                <Ico d={f.icon} size={20} color={f.color} />
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Favorites View ──────────────────────────────────────────
function FavoritesView() {
  const [favs, setFavs] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", emoji: "🌐", category: "General", color: ROSE });
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { db.get("favorites").then(f => setFavs(f || [])); }, []);

  const save = async () => {
    if (!form.name || !form.url) return;
    let url = form.url;
    if (!url.startsWith("http")) url = "https://" + url;
    const updated = editId
      ? favs.map(f => f.id === editId ? { ...f, ...form, url } : f)
      : [...favs, { ...form, url, id: Date.now().toString() }];
    setFavs(updated); await db.set("favorites", updated);
    setModal(false); setForm({ name: "", url: "", emoji: "🌐", category: "General", color: ROSE }); setEditId(null);
  };

  const del = async (id) => {
    const updated = favs.filter(f => f.id !== id);
    setFavs(updated); await db.set("favorites", updated);
  };

  const edit = (f) => {
    setForm({ name: f.name, url: f.url, emoji: f.emoji, category: f.category, color: f.color || ROSE });
    setEditId(f.id); setModal(true);
  };

  const filtered = favs.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.category?.toLowerCase().includes(search.toLowerCase()));
  const categories = [...new Set(filtered.map(f => f.category || "General"))];

  return (
    <div style={{ padding: 32, overflowY: "auto", height: "100%", animation: "fadeIn 0.4s ease" }}>
      <SectionHeader title="⭐ Favorites" action={
        <div style={{ display: "flex", gap: 10 }}>
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 180 }} />
          <Btn onClick={() => { setModal(true); setEditId(null); setForm({ name: "", url: "", emoji: "🌐", category: "General", color: ROSE }); }} small>+ Add Site</Btn>
        </div>
      } />

      {favs.length === 0 && (
        <Card style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <div style={{ color: "#666", marginBottom: 16 }}>No favorites yet. Add your first site!</div>
          <Btn onClick={() => setModal(true)} small>+ Add Site</Btn>
        </Card>
      )}

      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{cat}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {filtered.filter(f => (f.category || "General") === cat).map(f => (
              <div key={f.id} style={{
                background: GLASS, border: `1px solid ${BORDER}`,
                borderRadius: 12, padding: 16, cursor: "pointer",
                transition: "all 0.2s", position: "relative", group: true
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = f.color || ROSE; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div onClick={() => window.open(f.url, "_blank")}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{f.emoji}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {f.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                  <button onClick={() => edit(f)} style={{ flex: 1, padding: "5px 0", background: BG3, border: `1px solid ${BORDER}`, borderRadius: 6, color: "#888", cursor: "pointer", fontSize: 11 }}>Edit</button>
                  <button onClick={() => del(f.id)} style={{ flex: 1, padding: "5px 0", background: "#ff475715", border: "1px solid #ff475744", borderRadius: 6, color: "#ff4757", cursor: "pointer", fontSize: 11 }}>Del</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {modal && (
        <Modal title={editId ? "Edit Site" : "Add Favorite"} onClose={() => { setModal(false); setEditId(null); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <Input placeholder="Emoji" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} style={{ width: 70 }} />
              <Input placeholder="Site name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <Input placeholder="URL (e.g. animexin.dev)" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            <Input placeholder="Category (e.g. Streaming, Dev, Social)" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "#888" }}>Accent color:</span>
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: 40, height: 32, border: "none", background: "none", cursor: "pointer" }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Btn onClick={save} style={{ flex: 1 }}>Save</Btn>
              <Btn onClick={() => { setModal(false); setEditId(null); }} outline style={{ flex: 1 }}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── File Vault ──────────────────────────────────────────────
function FilesView() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => { db.get("files-index").then(f => setFiles(f || [])); }, []);

  const upload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 4 * 1024 * 1024) return alert("File too large (max 4MB)");
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const id = Date.now().toString();
      const meta = { id, name: file.name, size: file.size, type: file.type, uploadedAt: Date.now() };
      await db.set(`file:${id}`, ev.target.result);
      const updated = [...files, meta];
      setFiles(updated); await db.set("files-index", updated);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const download = async (f) => {
    const data = await db.get(`file:${f.id}`);
    if (!data) return alert("File not found");
    const a = document.createElement("a");
    a.href = data; a.download = f.name; a.click();
  };

  const del = async (id) => {
    await db.del(`file:${id}`);
    const updated = files.filter(f => f.id !== id);
    setFiles(updated); await db.set("files-index", updated);
  };

  const fmt = (b) => b < 1024 ? `${b}B` : b < 1048576 ? `${(b / 1024).toFixed(1)}KB` : `${(b / 1048576).toFixed(1)}MB`;
  const icon = (type) => type?.startsWith("image") ? "🖼️" : type?.startsWith("video") ? "🎬" : type?.startsWith("audio") ? "🎵" : type?.includes("pdf") ? "📄" : "📁";

  return (
    <div style={{ padding: 32, overflowY: "auto", height: "100%", animation: "fadeIn 0.4s ease" }}>
      <SectionHeader title="📁 File Vault" action={
        <Btn onClick={() => fileRef.current?.click()} disabled={uploading} small>
          {uploading ? "⏳ Uploading..." : <><Ico d={I.up} size={14} /> Upload</>}
        </Btn>
      } />
      <input ref={fileRef} type="file" style={{ display: "none" }} onChange={upload} />

      {files.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
          <div style={{ color: "#666", marginBottom: 16 }}>No files yet. Upload your first file!</div>
          <Btn onClick={() => fileRef.current?.click()} small>Upload File</Btn>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {files.map(f => (
            <Card key={f.id} style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 24 }}>{icon(f.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                    {fmt(f.size)} · {new Date(f.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={() => download(f)} small outline style={{ padding: "6px 12px" }}><Ico d={I.down} size={13} /> Get</Btn>
                  <Btn onClick={() => del(f.id)} small outline color="#ff4757" style={{ padding: "6px 12px" }}><Ico d={I.trash} size={13} /></Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <div style={{ marginTop: 16, padding: 12, background: BG3, borderRadius: 8, fontSize: 12, color: "#555" }}>
        ℹ️ Files are stored in your browser. Max 4MB per file. For larger files, Supabase storage will be connected when you deploy.
      </div>
    </div>
  );
}

// ── AI Assistant ────────────────────────────────────────────
function AIView() {
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "Hey! I'm your RoXoL AI assistant. I can help you draft emails, plan workouts, answer questions, or just chat. What do you need? 😊" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim(); setInput(""); setLoading(true);
    const newMsgs = [...msgs, { role: "user", content: userMsg }];
    setMsgs(newMsgs);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are the AI assistant for RoXoL, a private personal hub app. Be helpful, warm, and concise. You help with email drafting, workout planning, general questions, and anything the user needs.",
          messages: newMsgs.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response.";
      setMsgs(m => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", content: "Sorry, something went wrong. Try again!" }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", animation: "fadeIn 0.4s ease" }}>
      <div style={{ padding: "24px 32px 12px", borderBottom: `1px solid ${BORDER}` }}>
        <h2 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18 }}>🤖 AI Assistant</h2>
        <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Powered by Claude · Ask anything</p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", animation: "fadeIn 0.3s ease" }}>
            {m.role === "assistant" && (
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${ROSE}, ${GREEN})`, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0, alignSelf: "flex-end" }}>
                <span style={{ fontSize: 14 }}>✨</span>
              </div>
            )}
            <div style={{
              maxWidth: "70%", padding: "12px 16px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.role === "user" ? `linear-gradient(135deg, ${ROSE}cc, ${ROSE}99)` : BG3,
              border: m.role === "assistant" ? `1px solid ${BORDER}` : "none",
              fontSize: 14, lineHeight: 1.6, color: "#f0f0f8"
            }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${ROSE}, ${GREEN})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14 }}>✨</span>
            </div>
            <div style={{ padding: "12px 16px", background: BG3, borderRadius: "16px 16px 16px 4px", border: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: ROSE, animation: `pulse 1.2s ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "12px 32px 24px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask anything... (Enter to send)"
            style={{
              flex: 1, padding: "12px 16px", background: BG3,
              border: `1px solid ${BORDER}`, borderRadius: 12,
              color: "#f0f0f8", fontSize: 14, outline: "none"
            }}
            onFocus={e => e.target.style.borderColor = ROSE}
            onBlur={e => e.target.style.borderColor = BORDER}
          />
          <button onClick={send} disabled={loading} style={{
            width: 46, borderRadius: 12, border: "none",
            background: loading ? "#333" : `linear-gradient(135deg, ${ROSE}, #9d6fdf)`,
            color: "#fff", cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}><Ico d={I.send} size={16} /></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {["Draft an email", "Create workout plan", "What to watch tonight?", "Help me with something"].map(q => (
            <button key={q} onClick={() => setInput(q)} style={{
              padding: "5px 12px", borderRadius: 20, border: `1px solid ${BORDER}`,
              background: "transparent", color: "#666", fontSize: 12, cursor: "pointer"
            }}>{q}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Streaming Profiles ──────────────────────────────────────
function StreamingView() {
  const DEFAULT_PROFILES = [
    { id: "s1", name: "AnimeXin", url: "https://animexin.dev", emoji: "🎌", autoNext: true, autoPlay: true, speed: 1.0, subSize: 18, nextDelay: 30 },
    { id: "s2", name: "Crunchyroll", url: "https://crunchyroll.com", emoji: "🍥", autoNext: true, autoPlay: true, speed: 1.0, subSize: 18, nextDelay: 20 },
    { id: "s3", name: "Netflix", url: "https://netflix.com", emoji: "🎬", autoNext: false, autoPlay: true, speed: 1.0, subSize: 18, nextDelay: 15 },
  ];
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => { db.get("streaming-profiles").then(p => setProfiles(p || DEFAULT_PROFILES)); }, []);

  const update = async (id, key, val) => {
    const updated = profiles.map(p => p.id === id ? { ...p, [key]: val } : p);
    setProfiles(updated); await db.set("streaming-profiles", updated);
  };

  const sel = selected ? profiles.find(p => p.id === selected) : null;

  return (
    <div style={{ padding: 32, overflowY: "auto", height: "100%", animation: "fadeIn 0.4s ease" }}>
      <SectionHeader title="📺 Streaming Profiles" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {profiles.map(p => (
            <Card key={p.id} style={{ cursor: "pointer", borderColor: selected === p.id ? ROSE : BORDER, transition: "all 0.2s" }} onClick={() => setSelected(p.id === selected ? null : p.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 26 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>{p.url}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    {p.autoNext && <Tag color={GREEN}>Auto Next</Tag>}
                    {p.autoPlay && <Tag color={ROSE}>Auto Play</Tag>}
                    <Tag color="#4f9cf9">{p.speed}x</Tag>
                  </div>
                </div>
                <Btn onClick={() => window.open(p.url, "_blank")} small outline style={{ padding: "5px 10px" }}>
                  <Ico d={I.ext} size={13} />
                </Btn>
              </div>
            </Card>
          ))}
          <Card style={{ padding: 14, textAlign: "center", border: "1px dashed #333", cursor: "pointer" }}>
            <span style={{ color: "#555", fontSize: 13 }}>+ Add streaming site</span>
          </Card>
        </div>

        {sel && (
          <Card>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, marginBottom: 20, color: ROSE }}>
              {sel.emoji} {sel.name} Settings
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[
                { key: "autoNext", label: "Auto Next Episode", desc: "Automatically go to next episode when current ends" },
                { key: "autoPlay", label: "Auto Play", desc: "Automatically start playing when page loads" },
              ].map(s => (
                <div key={s.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{s.desc}</div>
                  </div>
                  <Toggle value={sel[s.key]} onChange={v => update(sel.id, s.key, v)} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Playback Speed: <span style={{ color: ROSE }}>{sel.speed}x</span></div>
                <input type="range" min="0.5" max="2" step="0.25" value={sel.speed}
                  onChange={e => update(sel.id, "speed", parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: ROSE }} />
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                    <button key={s} onClick={() => update(sel.id, "speed", s)} style={{
                      flex: 1, padding: "4px 0", borderRadius: 6, border: `1px solid ${sel.speed === s ? ROSE : BORDER}`,
                      background: sel.speed === s ? `${ROSE}22` : "transparent", color: sel.speed === s ? ROSE : "#888",
                      fontSize: 11, cursor: "pointer"
                    }}>{s}x</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Auto-Next Delay: <span style={{ color: ROSE }}>{sel.nextDelay}s</span></div>
                <input type="range" min="3" max="60" value={sel.nextDelay}
                  onChange={e => update(sel.id, "nextDelay", parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: ROSE }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Subtitle Size: <span style={{ color: ROSE }}>{sel.subSize}px</span></div>
                <input type="range" min="12" max="32" value={sel.subSize}
                  onChange={e => update(sel.id, "subSize", parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: ROSE }} />
              </div>
            </div>
          </Card>
        )}
        {!sel && (
          <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#444" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📺</div>
              <div>Select a streaming profile to edit its settings</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Watch Party ─────────────────────────────────────────────
function WatchPartyView() {
  const [url, setUrl] = useState("");
  const [connected, setConnected] = useState(false);
  const [partyCode, setPartyCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState(""); // create | join

  const create = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setPartyCode(code); setConnected(true);
  };

  const join = () => {
    if (joinCode.length < 4) return;
    setPartyCode(joinCode); setConnected(true);
  };

  const presets = [
    { name: "AnimeXin", url: "https://animexin.dev", emoji: "🎌" },
    { name: "YouTube", url: "https://youtube.com", emoji: "▶️" },
    { name: "Netflix", url: "https://netflix.com", emoji: "🎬" },
    { name: "Crunchyroll", url: "https://crunchyroll.com", emoji: "🍥" },
  ];

  if (connected) return (
    <div style={{ padding: 32, overflowY: "auto", height: "100%", animation: "fadeIn 0.4s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18 }}>🎬 Watch Party Active</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ padding: "6px 14px", background: `${GREEN}22`, border: `1px solid ${GREEN}44`, borderRadius: 8, fontSize: 13, color: GREEN }}>
            🟢 Party Code: <strong>{partyCode}</strong>
          </div>
          <Btn onClick={() => { setConnected(false); setMode(""); }} small outline color="#ff4757">Leave Party</Btn>
        </div>
      </div>

      <Card style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Share this code with your partner:</div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, color: ROSE, letterSpacing: "0.2em", textAlign: "center", padding: "12px 0" }}>{partyCode}</div>
        <Btn onClick={() => navigator.clipboard?.writeText(partyCode)} small outline style={{ width: "100%" }}>Copy Code</Btn>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Launch a streaming site (synced):</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
          {presets.map(p => (
            <button key={p.name} onClick={() => setUrl(p.url)} style={{
              padding: "12px 8px", borderRadius: 10, border: `1px solid ${url === p.url ? ROSE : BORDER}`,
              background: url === p.url ? `${ROSE}15` : BG3,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer"
            }}>
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
              <span style={{ fontSize: 11, color: "#aaa" }}>{p.name}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Input placeholder="Or paste any URL..." value={url} onChange={e => setUrl(e.target.value)} />
          <Btn onClick={() => url && window.open(url, "_blank")} disabled={!url}>Launch →</Btn>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        {[
          { icon: "▶️", label: "Auto Play", desc: "Video starts automatically", active: true },
          { icon: "⏭", label: "Auto Next", desc: "Next episode plays automatically", active: true },
          { icon: "🎭", label: "Synced", desc: "Both sides stay in sync", active: true },
        ].map(f => (
          <Card key={f.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontSize: 11, color: "#555" }}>{f.desc}</div>
            <div style={{ marginTop: 8 }}>
              <Tag color={GREEN}>Active</Tag>
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ marginTop: 16, padding: 14 }}>
        <div style={{ fontSize: 12, color: "#666" }}>ℹ️ Both you and your partner open the same streaming site. The sync server keeps your playback perfectly matched — no quality loss since you both stream directly. Deploy to Render for real-time sync.</div>
      </Card>
    </div>
  );

  return (
    <div style={{ padding: 32, overflowY: "auto", height: "100%", animation: "fadeIn 0.4s ease" }}>
      <SectionHeader title="🎬 Watch Party" />
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <Card style={{ textAlign: "center", padding: 40, marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <h3 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, marginBottom: 8 }}>Watch Together</h3>
          <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>Watch any streaming site in perfect sync with your partner. Both of you get full original quality — no screen sharing needed.</p>
          {mode === "" && (
            <div style={{ display: "flex", gap: 12 }}>
              <Btn onClick={() => setMode("create")} style={{ flex: 1 }}>🎉 Create Party</Btn>
              <Btn onClick={() => setMode("join")} outline style={{ flex: 1 }}>🔗 Join Party</Btn>
            </div>
          )}
          {mode === "create" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ marginBottom: 16, fontSize: 13, color: "#888" }}>Create a party and share the code with your partner</div>
              <Btn onClick={create} style={{ width: "100%" }}>Create Watch Party 🎉</Btn>
              <button onClick={() => setMode("")} style={{ marginTop: 10, background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 13 }}>← Back</button>
            </div>
          )}
          {mode === "join" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ marginBottom: 12, fontSize: 13, color: "#888" }}>Enter the party code your partner shared</div>
              <Input placeholder="Enter party code..." value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} style={{ marginBottom: 12, textAlign: "center", fontFamily: "'Orbitron',sans-serif", letterSpacing: "0.2em" }} />
              <Btn onClick={join} style={{ width: "100%" }}>Join Party 🔗</Btn>
              <button onClick={() => setMode("")} style={{ marginTop: 10, background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 13 }}>← Back</button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── Workout Tracker ─────────────────────────────────────────
function WorkoutView({ user }) {
  const [plans, setPlans] = useState([]);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", day: "Monday", exercises: [{ name: "", sets: 3, reps: 10, rest: 60, notes: "" }] });
  const [owner, setOwner] = useState("me");

  useEffect(() => { db.get(`workouts:${owner}`).then(w => setPlans(w || [])); }, [owner]);

  const save = async () => {
    if (!form.name) return;
    const updated = [...plans, { ...form, id: Date.now().toString(), createdAt: Date.now(), completedDates: [] }];
    setPlans(updated); await db.set(`workouts:${owner}`, updated);
    setModal(false); setForm({ name: "", day: "Monday", exercises: [{ name: "", sets: 3, reps: 10, rest: 60, notes: "" }] });
  };

  const addEx = () => setForm(f => ({ ...f, exercises: [...f.exercises, { name: "", sets: 3, reps: 10, rest: 60, notes: "" }] }));
  const updateEx = (i, k, v) => setForm(f => ({ ...f, exercises: f.exercises.map((e, idx) => idx === i ? { ...e, [k]: v } : e) }));

  const complete = async (planId) => {
    const today = new Date().toDateString();
    const updated = plans.map(p => p.id === planId ? { ...p, completedDates: [...(p.completedDates || []), today] } : p);
    setPlans(updated); await db.set(`workouts:${owner}`, updated);
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayPlans = plans.filter(p => p.day === today);

  return (
    <div style={{ padding: 32, overflowY: "auto", height: "100%", animation: "fadeIn 0.4s ease" }}>
      <SectionHeader title="💪 Workout Tracker" action={
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "flex", background: BG3, borderRadius: 8, padding: 3 }}>
            {["me", "her"].map(o => (
              <button key={o} onClick={() => setOwner(o)} style={{
                padding: "6px 16px", borderRadius: 6, border: "none",
                background: owner === o ? ROSE : "transparent",
                color: owner === o ? "#fff" : "#888", fontWeight: 600, fontSize: 13, cursor: "pointer"
              }}>{o === "me" ? "My Plans" : "Her Plans"}</button>
            ))}
          </div>
          <Btn onClick={() => setModal(true)} small>+ New Plan</Btn>
        </div>
      } />

      {todayPlans.length > 0 && (
        <div style={{ marginBottom: 20, padding: 16, background: `${GREEN}10`, border: `1px solid ${GREEN}33`, borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: GREEN, fontWeight: 600, marginBottom: 8 }}>💪 TODAY'S WORKOUT</div>
          {todayPlans.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>{p.name}</span>
              <Btn onClick={() => complete(p.id)} small color={GREEN}>✓ Mark Done</Btn>
            </div>
          ))}
        </div>
      )}

      {plans.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💪</div>
          <div style={{ color: "#666", marginBottom: 16 }}>No workout plans yet. Create your first plan!</div>
          <Btn onClick={() => setModal(true)} small>+ Create Plan</Btn>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {plans.map(p => (
            <Card key={p.id} style={{ cursor: "pointer" }} onClick={() => setSelected(selected === p.id ? null : p.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{p.day}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexDirection: "column", alignItems: "flex-end" }}>
                  <Tag color={ROSE}>{p.exercises?.length || 0} exercises</Tag>
                  {(p.completedDates || []).includes(new Date().toDateString()) && <Tag color={GREEN}>✓ Done today</Tag>}
                </div>
              </div>
              {selected === p.id && (
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginTop: 8 }}>
                  {p.exercises?.map((ex, i) => (
                    <div key={i} style={{ padding: "8px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
                      <div style={{ fontWeight: 600 }}>{ex.name || "Exercise " + (i + 1)}</div>
                      <div style={{ color: "#666", marginTop: 4 }}>
                        {ex.sets} sets × {ex.reps} reps · Rest: {ex.rest}s
                        {ex.notes && <span style={{ marginLeft: 8, color: "#555" }}>— {ex.notes}</span>}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <Btn onClick={() => complete(p.id)} small color={GREEN} style={{ flex: 1 }}>✓ Mark Done</Btn>
                    <Btn onClick={async () => { const u = plans.filter(x => x.id !== p.id); setPlans(u); await db.set(`workouts:${owner}`, u); setSelected(null); }} small outline color="#ff4757">Delete</Btn>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="New Workout Plan" onClose={() => setModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input placeholder="Plan name (e.g. Push Day, Leg Day)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <select value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))} style={{ padding: "10px 14px", background: BG3, border: `1px solid ${BORDER}`, borderRadius: 8, color: "#f0f0f8", fontSize: 14 }}>
              {days.map(d => <option key={d}>{d}</option>)}
            </select>
            <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>Exercises:</div>
            {form.exercises.map((ex, i) => (
              <div key={i} style={{ background: BG3, borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <Input placeholder="Exercise name" value={ex.name} onChange={e => updateEx(i, "name", e.target.value)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[["sets", "Sets"], ["reps", "Reps"], ["rest", "Rest (s)"]].map(([k, label]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>{label}</div>
                      <input type="number" value={ex[k]} onChange={e => updateEx(i, k, parseInt(e.target.value) || 0)} style={{ width: "100%", padding: "7px 10px", background: BG2, border: `1px solid ${BORDER}`, borderRadius: 6, color: "#f0f0f8", fontSize: 13 }} />
                    </div>
                  ))}
                </div>
                <input placeholder="Notes (optional)" value={ex.notes} onChange={e => updateEx(i, "notes", e.target.value)} style={{ padding: "7px 10px", background: BG2, border: `1px solid ${BORDER}`, borderRadius: 6, color: "#f0f0f8", fontSize: 13 }} />
              </div>
            ))}
            <button onClick={addEx} style={{ padding: "8px 0", background: BG3, border: `1px dashed ${BORDER}`, borderRadius: 8, color: "#666", cursor: "pointer", fontSize: 13 }}>+ Add Exercise</button>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Btn onClick={save} style={{ flex: 1 }}>Save Plan</Btn>
              <Btn onClick={() => setModal(false)} outline style={{ flex: 1 }}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Cycle Tracker ───────────────────────────────────────────
function CycleView() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ lastPeriodStart: "", cycleLength: 28, periodLength: 5 });
  const [setup, setSetup] = useState(false);
  const [mood, setMood] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const [note, setNote] = useState("");
  const [log, setLog] = useState([]);

  useEffect(() => {
    db.get("cycle-data").then(d => { if (d) setData(d); else setSetup(true); });
    db.get("cycle-log").then(l => setLog(l || []));
  }, []);

  const saveSetup = async () => {
    if (!form.lastPeriodStart) return;
    const d = { ...form, savedAt: Date.now() };
    setData(d); await db.set("cycle-data", d); setSetup(false);
  };

  const saveLog = async () => {
    const entry = { date: new Date().toDateString(), mood, symptoms, note, timestamp: Date.now() };
    const updated = [...log, entry]; setLog(updated);
    await db.set("cycle-log", updated);
    setMood(""); setSymptoms([]); setNote("");
  };

  const calc = (d) => {
    if (!d?.lastPeriodStart) return null;
    const start = new Date(d.lastPeriodStart);
    const today = new Date();
    const daysSince = Math.floor((today - start) / 86400000);
    const cycleDay = (daysSince % d.cycleLength) + 1;
    const periodEnd = d.periodLength;
    const ovulation = Math.round(d.cycleLength / 2) - 2;
    const fertileStart = ovulation - 3;
    const fertileEnd = ovulation + 1;
    const pmsStart = d.cycleLength - 7;
    const nextPeriodDays = d.cycleLength - cycleDay;
    let phase = "Follicular";
    let phaseColor = "#4f9cf9";
    if (cycleDay <= d.periodLength) { phase = "Period"; phaseColor = ROSE; }
    else if (cycleDay >= fertileStart && cycleDay <= fertileEnd) { phase = "Fertile Window"; phaseColor = GREEN; }
    else if (cycleDay === ovulation) { phase = "Ovulation"; phaseColor = "#ff9f43"; }
    else if (cycleDay >= pmsStart) { phase = "PMS"; phaseColor = "#a29bfe"; }
    return { cycleDay, phase, phaseColor, nextPeriodDays, ovulation, fertileStart, fertileEnd, pmsStart, cycleLength: d.cycleLength };
  };

  const info = data ? calc(data) : null;
  const MOODS = ["😊", "😢", "😡", "😴", "🤢", "😰", "💕", "😐"];
  const SYMPTOMS = ["Cramps", "Bloating", "Headache", "Fatigue", "Mood swings", "Back pain", "Nausea", "Spotting"];

  if (setup) return (
    <div style={{ padding: 32, overflowY: "auto", height: "100%", animation: "fadeIn 0.4s ease" }}>
      <SectionHeader title="💕 Cycle Tracker Setup" />
      <div style={{ maxWidth: 400, margin: "0 auto" }}>
        <Card>
          <p style={{ color: "#888", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>Enter her last period start date to begin tracking.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Last period start date</div>
              <Input type="date" value={form.lastPeriodStart} onChange={e => setForm(f => ({ ...f, lastPeriodStart: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Average cycle length: <strong style={{ color: ROSE }}>{form.cycleLength} days</strong></div>
              <input type="range" min="21" max="35" value={form.cycleLength} onChange={e => setForm(f => ({ ...f, cycleLength: parseInt(e.target.value) }))} style={{ width: "100%", accentColor: ROSE }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Period duration: <strong style={{ color: ROSE }}>{form.periodLength} days</strong></div>
              <input type="range" min="2" max="10" value={form.periodLength} onChange={e => setForm(f => ({ ...f, periodLength: parseInt(e.target.value) }))} style={{ width: "100%", accentColor: ROSE }} />
            </div>
            <Btn onClick={saveSetup} style={{ marginTop: 8 }}>Start Tracking 💕</Btn>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 32, overflowY: "auto", height: "100%", animation: "fadeIn 0.4s ease" }}>
      <SectionHeader title="💕 Cycle Tracker" action={<Btn onClick={() => setSetup(true)} small outline>Update Info</Btn>} />

      {info && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
          <Card style={{ background: `linear-gradient(135deg, ${info.phaseColor}15, ${BG3})`, borderColor: `${info.phaseColor}44` }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Current Phase</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, color: info.phaseColor, marginBottom: 6 }}>{info.phase}</div>
            <div style={{ fontSize: 13, color: "#888" }}>Day <strong style={{ color: "#f0f0f8" }}>{info.cycleDay}</strong> of {info.cycleLength}</div>
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 6, background: "#1a1a30", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(info.cycleDay / info.cycleLength) * 100}%`, background: info.phaseColor, borderRadius: 3, transition: "width 0.5s" }} />
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Next Period</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 32, color: ROSE, marginBottom: 4 }}>{info.nextPeriodDays}</div>
            <div style={{ fontSize: 13, color: "#888" }}>days away</div>
          </Card>

          <Card>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>Cycle Phases</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "🩸 Period", days: `Days 1–${data.periodLength}`, color: ROSE },
                { label: "🌱 Fertile Window", days: `Days ${info.fertileStart}–${info.fertileEnd}`, color: GREEN },
                { label: "🥚 Ovulation", days: `Day ${info.ovulation}`, color: "#ff9f43" },
                { label: "😰 PMS", days: `Days ${info.pmsStart}–${info.cycleLength}`, color: "#a29bfe" },
              ].map(p => (
                <div key={p.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: p.color }}>{p.label}</span>
                  <span style={{ fontSize: 12, color: "#666" }}>{p.days}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>Log Today</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {MOODS.map(m => (
                <button key={m} onClick={() => setMood(mood === m ? "" : m)} style={{
                  padding: "6px 10px", borderRadius: 8, border: `1px solid ${mood === m ? ROSE : BORDER}`,
                  background: mood === m ? `${ROSE}22` : "transparent", cursor: "pointer", fontSize: 18
                }}>{m}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {SYMPTOMS.map(s => (
                <button key={s} onClick={() => setSymptoms(sy => sy.includes(s) ? sy.filter(x => x !== s) : [...sy, s])} style={{
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                  border: `1px solid ${symptoms.includes(s) ? ROSE : BORDER}`,
                  background: symptoms.includes(s) ? `${ROSE}22` : "transparent",
                  color: symptoms.includes(s) ? ROSE : "#888"
                }}>{s}</button>
              ))}
            </div>
            <input placeholder="Add a note..." value={note} onChange={e => setNote(e.target.value)} style={{ width: "100%", padding: "7px 12px", background: BG3, border: `1px solid ${BORDER}`, borderRadius: 8, color: "#f0f0f8", fontSize: 13, marginBottom: 10 }} />
            <Btn onClick={saveLog} small style={{ width: "100%" }}>Save Log 💕</Btn>
          </Card>
        </div>
      )}

      {log.length > 0 && (
        <Card>
          <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Recent Logs</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...log].reverse().slice(0, 5).map((entry, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
                <span style={{ fontSize: 20 }}>{entry.mood || "📅"}</span>
                <div>
                  <div style={{ color: "#888", fontSize: 11, marginBottom: 3 }}>{entry.date}</div>
                  {entry.symptoms?.length > 0 && <div style={{ color: "#666" }}>{entry.symptoms.join(", ")}</div>}
                  {entry.note && <div style={{ color: "#aaa" }}>{entry.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Chat & Calls ────────────────────────────────────────────
function ChatView() {
  const [msgs, setMsgs] = useState([
    { from: "her", text: "Hey babe! 💕", time: "2:30 PM" },
    { from: "me", text: "Hey! What's up? 😊", time: "2:31 PM" },
    { from: "her", text: "Wanna watch something tonight?", time: "2:32 PM" },
  ]);
  const [input, setInput] = useState("");
  const [calling, setCalling] = useState(null);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = () => {
    if (!input.trim()) return;
    setMsgs(m => [...m, { from: "me", text: input.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", animation: "fadeIn 0.4s ease" }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${ROSE}, #ff9f43)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💕</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Your Partner</div>
            <div style={{ fontSize: 11, color: GREEN }}>● Online</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setCalling("audio")} style={{ padding: "8px 14px", background: `${GREEN}22`, border: `1px solid ${GREEN}44`, borderRadius: 8, color: GREEN, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Ico d={I.phone} size={14} color={GREEN} /> Call
          </button>
          <button onClick={() => setCalling("video")} style={{ padding: "8px 14px", background: `${ROSE}22`, border: `1px solid ${ROSE}44`, borderRadius: 8, color: ROSE, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Ico d={I.video} size={14} color={ROSE} /> Video
          </button>
        </div>
      </div>

      {calling && (
        <div style={{ position: "absolute", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
          <Card style={{ textAlign: "center", padding: 48, animation: "glow 2s infinite" }}>
            <div style={{ fontSize: 48, marginBottom: 20, animation: "pulse 1.5s infinite" }}>{calling === "video" ? "📹" : "📞"}</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, marginBottom: 6 }}>{calling === "video" ? "Video" : "Audio"} Call</div>
            <div style={{ color: "#666", marginBottom: 6 }}>Connecting to your partner...</div>
            <div style={{ fontSize: 12, color: "#444", marginBottom: 24 }}>Deploy to Vercel for real WebRTC calls</div>
            <button onClick={() => setCalling(null)} style={{ padding: "12px 28px", background: "#ff4757", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15 }}>✕ End Call</button>
          </Card>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start", animation: "fadeIn 0.3s ease" }}>
            <div style={{
              maxWidth: "65%", padding: "10px 14px",
              borderRadius: m.from === "me" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: m.from === "me" ? `linear-gradient(135deg, ${ROSE}cc, ${ROSE}88)` : BG3,
              border: m.from !== "me" ? `1px solid ${BORDER}` : "none",
              fontSize: 14
            }}>
              <div>{m.text}</div>
              <div style={{ fontSize: 10, color: m.from === "me" ? "rgba(255,255,255,0.5)" : "#555", marginTop: 4, textAlign: "right" }}>{m.time}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "12px 24px 20px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", gap: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Type a message... 💕"
            style={{ flex: 1, padding: "12px 16px", background: BG3, border: `1px solid ${BORDER}`, borderRadius: 12, color: "#f0f0f8", fontSize: 14, outline: "none" }}
            onFocus={e => e.target.style.borderColor = ROSE}
            onBlur={e => e.target.style.borderColor = BORDER}
          />
          <button onClick={send} style={{ width: 46, borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${ROSE}, #9d6fdf)`, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ico d={I.send} size={16} />
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#444", marginTop: 8 }}>⚡ Real-time messaging & WebRTC calls activate when deployed on Vercel</div>
      </div>
    </div>
  );
}

// ── Email AI ────────────────────────────────────────────────
function EmailView() {
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState("professional");

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setDraft("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: `Write a ${tone} email: ${prompt}. Just the email body, no extra commentary.` }]
        })
      });
      const data = await res.json();
      setDraft(data.content?.[0]?.text || "Could not generate email.");
    } catch { setDraft("Error generating email. Try again."); }
    setLoading(false);
  };

  const tones = ["professional", "friendly", "formal", "casual", "apologetic", "persuasive"];
  const templates = ["Follow up on a job application", "Apologize for being late", "Ask for a day off", "Thank someone for their help", "Introduce myself professionally", "Request a meeting"];

  return (
    <div style={{ padding: 32, overflowY: "auto", height: "100%", animation: "fadeIn 0.4s ease" }}>
      <SectionHeader title="✉️ AI Email Writer" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tone</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {tones.map(t => (
                <button key={t} onClick={() => setTone(t)} style={{
                  padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                  border: `1px solid ${tone === t ? ROSE : BORDER}`,
                  background: tone === t ? `${ROSE}22` : "transparent",
                  color: tone === t ? ROSE : "#888", textTransform: "capitalize"
                }}>{t}</button>
              ))}
            </div>
          </Card>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>What to write</div>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe the email you need..." rows={4} style={{
              width: "100%", padding: "10px 14px", background: BG3,
              border: `1px solid ${BORDER}`, borderRadius: 8,
              color: "#f0f0f8", fontSize: 14, resize: "vertical", outline: "none"
            }}
              onFocus={e => e.target.style.borderColor = ROSE}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
            <Btn onClick={generate} disabled={loading} style={{ width: "100%", marginTop: 10 }}>
              {loading ? "✍️ Writing..." : "Generate Email ✉️"}
            </Btn>
          </Card>

          <Card>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick Templates</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {templates.map(t => (
                <button key={t} onClick={() => setPrompt(t)} style={{
                  padding: "8px 12px", background: BG3, border: `1px solid ${BORDER}`,
                  borderRadius: 8, color: "#888", fontSize: 13, textAlign: "left", cursor: "pointer"
                }}
                  onMouseEnter={e => { e.target.style.borderColor = ROSE; e.target.style.color = "#f0f0f8"; }}
                  onMouseLeave={e => { e.target.style.borderColor = BORDER; e.target.style.color = "#888"; }}
                >{t}</button>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <Card style={{ height: "calc(100% - 0px)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Generated Email</div>
              {draft && <Btn onClick={() => navigator.clipboard?.writeText(draft)} small outline>Copy</Btn>}
            </div>
            {!draft && !loading && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: 13, textAlign: "center" }}>
                <div><div style={{ fontSize: 32, marginBottom: 10 }}>✉️</div>Your email will appear here</div>
              </div>
            )}
            {loading && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: ROSE, animation: `pulse 1.2s ${i * 0.2}s infinite` }} />)}
                  </div>
                  <div style={{ color: "#666", fontSize: 13, marginTop: 10 }}>Writing your email...</div>
                </div>
              </div>
            )}
            {draft && (
              <textarea value={draft} onChange={e => setDraft(e.target.value)} style={{
                flex: 1, width: "100%", background: "transparent", border: "none",
                color: "#f0f0f8", fontSize: 14, lineHeight: 1.7, resize: "none", outline: "none", fontFamily: "'Outfit',sans-serif"
              }} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────
export default function RoXoL() {
  const [screen, setScreen] = useState("loading");
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home");

  useEffect(() => {
    // Inject styles
    const style = document.createElement("style");
    style.textContent = STYLES;
    document.head.appendChild(style);
    // Check logged in
    db.get("currentUser").then(u => {
      setUser(u || null);
      setScreen(u ? "app" : "auth");
    });
  }, []);

  const onAuth = (u) => { setUser(u); setScreen("app"); };
  const onLogout = async () => { await db.del("currentUser"); setUser(null); setScreen("auth"); };

  if (screen === "loading") return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 32, fontWeight: 900 }}>
        <span style={{ color: ROSE }}>Ro</span><span style={{ color: "#f0f0f8" }}>X</span><span style={{ color: GREEN }}>oL</span>
      </div>
    </div>
  );

  if (screen === "auth") return <AuthScreen onAuth={onAuth} />;

  return (
    <div className="roxol-root">
      <div className="mesh-bg" /><div className="grid-bg" />
      <Sidebar view={view} setView={setView} user={user} onLogout={onLogout} />
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        {view === "home" && <HomeView user={user} setView={setView} />}
        {view === "favorites" && <FavoritesView />}
        {view === "files" && <FilesView />}
        {view === "ai" && <AIView />}
        {view === "streaming" && <StreamingView />}
        {view === "watchparty" && <WatchPartyView />}
        {view === "workout" && <WorkoutView user={user} />}
        {view === "cycle" && <CycleView />}
        {view === "chat" && <ChatView />}
        {view === "email" && <EmailView />}
      </main>
    </div>
  );
}
