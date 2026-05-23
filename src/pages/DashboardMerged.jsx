import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import api from "../services/api.js";
import { useFetch } from "../hooks/useApi.js";

// ── Global Styles ─────────────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --dash-bg: oklch(0.93 0.04 270);
    --dash-surface: oklch(0.99 0.005 270);
    --dash-ink: oklch(0.22 0.06 260);
    --dash-muted: oklch(0.58 0.04 260);
    --dash-blue: oklch(0.60 0.19 265);
    --dash-blue-soft: oklch(0.93 0.04 265);
    --dash-border: oklch(0.90 0.025 265);
    --dash-green: oklch(0.55 0.15 150);
    --dash-green-soft: oklch(0.94 0.05 150);
    --dash-red: oklch(0.55 0.18 27);
    --dash-red-soft: oklch(0.95 0.04 27);
    --font-serif: 'Instrument Serif', ui-serif, Georgia, serif;
    --font-sans: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
  }
  body { font-family: var(--font-sans); background: var(--dash-bg); }
  textarea, input, select { font-family: var(--font-sans); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--dash-blue-soft); border-radius: 99px; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }
  .msg-enter { animation: fadeUp .28s ease both; }
  .dot { animation: pulse 1.2s ease infinite; }
  .dot:nth-child(2){animation-delay:.2s;}
  .dot:nth-child(3){animation-delay:.4s;}
  .spin { animation: spin .9s linear infinite; }
`;

// ── Icon Component ─────────────────────────────────────────────────────────────
const I = ({ d, size = 16, fill = "none", sw = 1.75, vb = "0 0 24 24" }) => (
  <svg width={size} height={size} viewBox={vb} fill={fill} stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const Icons = {
  Sparkles: () => <I d={["M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.937A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"]} />,
  Users: () => <I d={["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2","M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0","M22 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75"]} />,
  Tasks: () => <I d={["M9 11l3 3L22 4","M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"]} />,
  Wallet: () => <I d={["M21 12V7H5a2 2 0 0 1 0-4h14v4","M3 5v14a2 2 0 0 0 2 2h16v-5","M18 12a2 2 0 0 0 0 4h4v-4z"]} />,
  Coins: () => <I d={["M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z","M12 6v6l4 2"]} />,
  Shield: () => <I d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />,
  Settings: () => <I d={["M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z","M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0"]} />,
  Send: () => <I d={["M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z","M21.854 2.147 11 13"]} />,
  Bot: () => <I d={["M12 8V4H8","M12 8V4h4","M8 20H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-3","M9 18h6","M10 13h.01","M14 13h.01"]} />,
  Flame: () => <I d="M12 12c0-2.5 1.5-5 3-7-3 0-7 2-7 7a5 5 0 0 0 10 0c0-1.5-.5-3-1.5-4-.5 1.5-1.5 3-4.5 4z" fill="currentColor" sw={0} />,
  Notion: () => <I d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z M8 9h8 M8 13h6 M8 17h4" />,
  Link: () => <I d={["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71","M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"]} />,
  Check: () => <I d="M20 6 9 17l-5-5" />,
  X: () => <I d="M18 6 6 18M6 6l12 12" />,
  Plus: () => <I d="M5 12h14M12 5v14" />,
  RefreshCw: () => <I d={["M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8","M21 3v5h-5","M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16","M8 16H3v5"]} />,
  Clock: () => <I d={["M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z","M12 6v6l4 2"]} />,
  Eye: () => <I d={["M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z","M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"]} />,
  EyeOff: () => <I d={["M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24","M1 1l22 22"]} />,
  ChevronRight: () => <I d="m9 18 6-6-6-6" />,
  ArrowUp: () => <I d={["M5 12h14","M12 5l7 7-7 7"]} />,
  TrendingUp: () => <I d={["M22 7 13.5 15.5l-5-5L2 17","M16 7h6v6"]} />,
  More: () => <I d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" sw={0} />,
  Mail: () => <I d={["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z","M22 6l-10 7L2 6"]} />,
  AlertCircle: () => <I d={["M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z","M12 8v4","M12 16h.01"]} />,
  Loader: () => <I d="M21 12a9 9 0 1 1-6.219-8.56" />,
};

// ── Shared Components ─────────────────────────────────────────────────────────
function Avatar({ name = "?", size = 36 }) {
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(1) * 17) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, oklch(0.85 0.12 ${hue}), oklch(0.65 0.18 ${hue + 40}))`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.38, fontWeight: 700,
    }}>{name.charAt(0)}</div>
  );
}

function Crumb({ parent, label }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11,
      color: "var(--dash-muted)", background: "var(--dash-blue-soft)",
      borderRadius: 99, padding: "5px 14px", marginBottom: 22 }}>
      {parent} <Icons.ChevronRight /> <span style={{ color: "var(--dash-ink)", fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function Btn({ onClick, disabled, children, variant = "primary", size = "md", style: s = {} }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, border: "none",
    cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)",
    fontWeight: 500, borderRadius: 99, transition: "all .15s", opacity: disabled ? 0.5 : 1,
    padding: size === "sm" ? "5px 14px" : "9px 20px",
    fontSize: size === "sm" ? 12 : 13,
    ...(variant === "primary" ? { background: "var(--dash-blue)", color: "#fff" } :
        variant === "soft"    ? { background: "var(--dash-blue-soft)", color: "var(--dash-blue)" } :
                                { background: "var(--dash-surface)", color: "var(--dash-muted)", border: "1px solid var(--dash-border)" }),
    ...s,
  };
  return <button onClick={onClick} disabled={disabled} style={base}>{children}</button>;
}

function StatusDot({ ok, label }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11,
      padding: "4px 10px", borderRadius: 99,
      background: ok ? "var(--dash-green-soft)" : "var(--dash-blue-soft)",
      color: ok ? "var(--dash-green)" : "var(--dash-muted)",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: ok ? "var(--dash-green)" : "#f59e0b", display: "inline-block" }} />
      {label}
    </span>
  );
}

function Card({ children, style: s = {} }) {
  return (
    <div style={{ borderRadius: 18, border: "1px solid var(--dash-border)",
      background: "var(--dash-surface)", ...s }}>{children}</div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────────────────── 
function Sidebar({ section, setSection, taskCount }) {
  const NAV = [
    { id: "agent", Icon: Icons.Sparkles, label: "AI Agent" },
    { id: "people", Icon: Icons.Users, label: "People" },
    { id: "tasks", Icon: Icons.Tasks, label: "Tasks" },
    { id: "payroll", Icon: Icons.Wallet, label: "Payroll" },
    { id: "admin", Icon: Icons.Shield, label: "Admin" },
  ];

  return (
    <aside style={{ padding: "28px 20px", borderRight: "1px solid var(--dash-border)", display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--dash-surface)" }}>
      <p style={{ fontFamily: "var(--font-serif)", fontSize: 26, color: "var(--dash-blue)", marginBottom: 34, letterSpacing: -.5 }}>
        0cta<span style={{ color: "var(--dash-ink)" }}>Yee</span>
      </p>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {NAV.map(({ id, Icon, label }) => {
          const active = id === section;
          return (
            <button key={id} onClick={() => setSection(id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              borderRadius: 12, border: "none", cursor: "pointer", textAlign: "left", fontSize: 13,
              background: active ? "var(--dash-blue-soft)" : "transparent",
              color: active ? "var(--dash-ink)" : "var(--dash-muted)",
              fontWeight: active ? 600 : 400, fontFamily: "var(--font-sans)" }}>
              <Icon /> {label}
            </button>
          );
        })}
      </nav>
      <div style={{ borderRadius: 16, padding: 16, background: "var(--dash-blue-soft)", marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <Icons.Flame /><span style={{ fontSize: 12, fontWeight: 600 }}>Today's burn</span>
        </div>
        <p style={{ fontSize: 28, fontWeight: 700, color: "var(--dash-blue)" }}>{taskCount}</p>
        <p style={{ fontSize: 11, color: "var(--dash-muted)" }}>actions logged</p>
      </div>
    </aside>
  );
}

// ── Right Rail ──────────────────────────────────────────────────────────────────
function RightRail({ tasks, team, syncStatus }) {
  const display = team.length ? team : [];
  const avgProd = team.length ? Math.round(display.reduce((s, w) => s + (w.productivity ?? 75), 0) / display.length) : 75;
  const r = 56, c = 2 * Math.PI * r;
  const recent = (tasks || []).slice(0, 3);
  
  return (
    <aside style={{ padding: "28px 20px", borderLeft: "1px solid var(--dash-border)", background: "var(--dash-surface)", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <Avatar name="0cta Admin" size={38} />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 13 }}>0cta Admin</p>
          <p style={{ fontSize: 11, color: "var(--dash-muted)" }}>Admin workspace</p>
        </div>
      </div>

      {/* Token card */}
      <div style={{ borderRadius: 16, padding: 18, marginBottom: 22, background: "linear-gradient(135deg, var(--dash-blue), oklch(0.45 0.18 280))", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ fontSize: 10, opacity: .7 }}>Stored actions</p><Icons.Coins />
        </div>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 500 }}>{tasks?.length || 0}</p>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginTop: 8, opacity: .8 }}>
          <span>✦ {tasks?.filter(t => t.via === "agent")?.length || 0} agent</span>
          <span>↑ {tasks?.filter(t => (t._url || "").includes("notion.so"))?.length || 0} Notion</span>
        </div>
      </div>

      {/* Productivity ring */}
      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Team productivity</p>
      <div style={{ position: "relative", display: "flex", justifyContent: "center", marginBottom: 22 }}>
        <svg width={140} height={140}>
          <circle cx={70} cy={70} r={r} fill="none" stroke="var(--dash-blue-soft)" strokeWidth={8} />
          <circle cx={70} cy={70} r={r} fill="none" stroke="var(--dash-blue)" strokeWidth={8}
            strokeDasharray={c} strokeDashoffset={c * (1 - avgProd / 100)}
            strokeLinecap="round" transform="rotate(-90 70 70)" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 10, color: "var(--dash-muted)" }}>Avg</p>
          <p style={{ fontSize: 26, fontWeight: 700, color: "var(--dash-blue)" }}>{avgProd}%</p>
        </div>
      </div>

      {/* Sync status */}
      {syncStatus.lastSync && (
        <div style={{ borderRadius: 12, padding: "8px 12px", background: "var(--dash-green-soft)", fontSize: 11, color: "var(--dash-green)", display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <Icons.Notion /> Last sync {new Date(syncStatus.lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      )}

      {/* Recent tasks */}
      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Recent tasks</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {recent.map(t => (
          <div key={t._id || t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 12, background: t.via === "agent" ? "var(--dash-blue-soft)" : "var(--dash-green-soft)" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--dash-surface)", color: "var(--dash-blue)" }}>
              {t.via === "agent" ? <Icons.Bot /> : <Icons.Mail />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--dash-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</p>
              <p style={{ fontSize: 9, color: "var(--dash-muted)" }}>Just now</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ── Agent Panel ───────────────────────────────────────────────────────────────
function AgentPanel({ settings, notionData, onTaskCreated, tasks }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { type: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3001/grok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || `API Error: ${response.status}`);
      }

      const agentMessage = responseData.result || responseData.output || JSON.stringify(responseData);
      setMessages(prev => [...prev, { type: "agent", text: String(agentMessage) }]);
    } catch (err) {
      console.error("Error:", err);
      setMessages(prev => [...prev, { type: "agent", text: `⚠️ Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Crumb parent="Agent" label="Conversation" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 600 }}>What should 0cta do?</h1>
        <StatusDot ok={true} label="Gemini Ready" />
      </div>
      
      <div ref={scrollRef} style={{ height: 300, overflowY: "auto", marginBottom: 20, padding: 12, background: "var(--dash-blue-soft)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <p style={{ color: "var(--dash-muted)", fontSize: 13, textAlign: "center", margin: "auto" }}>
            Connected to Gemini. Start a conversation with your HR assistant.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="msg-enter" style={{ display: "flex", justifyContent: msg.type === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "70%", padding: "10px 14px", borderRadius: msg.type === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
              background: msg.type === "user" ? "var(--dash-blue)" : "var(--dash-surface)",
              color: msg.type === "user" ? "#fff" : "var(--dash-ink)", fontSize: 12, lineHeight: 1.5, wordWrap: "break-word", whiteSpace: "pre-wrap",
              border: msg.type === "user" ? "none" : "1px solid var(--dash-border)"
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="msg-enter" style={{ display: "flex", gap: 4, marginTop: 8 }}>
            <div className="dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--dash-blue)", display: "block" }} />
            <div className="dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--dash-blue)", display: "block" }} />
            <div className="dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--dash-blue)", display: "block" }} />
          </div>
        )}
      </div>

      <Card style={{ padding: 20 }}>
        <p style={{ fontSize: 12, color: "var(--dash-muted)", marginBottom: 12 }}>Powered by Google Gemini</p>
        <textarea 
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit(); } }}
          placeholder="Try: Create onboarding tasks for a new engineer, or ask about payroll calculations... (Ctrl+Enter to send)"
          disabled={loading}
          style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--dash-border)", fontFamily: "var(--font-sans)", fontSize: 13, minHeight: 80, resize: "vertical" }} 
        />
        <Btn onClick={handleSubmit} disabled={loading || !input.trim()} style={{ marginTop: 10 }}>
          <Icons.Send /> {loading ? "Processing..." : "Send"}
        </Btn>
      </Card>
    </>
  );
}

// ── Tasks Panel ────────────────────────────────────────────────────────────────
function TasksPanel({ tasks, onAddTask, notionConnected }) {
  const statusCols = ["Not started", "In progress", "Done"];
  
  return (
    <>
      <Crumb parent="Tasks" label={notionConnected ? "Notion sync" : "Local"} />
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 600, marginBottom: 20 }}>Tasks</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {statusCols.map(status => {
          const statusTasks = tasks.filter(t => (t.status || "Not started") === status);
          return (
            <Card key={status} style={{ padding: 14, background: status === "Done" ? "var(--dash-green-soft)" : status === "In progress" ? "oklch(0.95 0.05 60)" : "var(--dash-blue-soft)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", color: "var(--dash-muted)" }}>{status} · {statusTasks.length}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {statusTasks.map(t => (
                  <div key={t._id || t.id} style={{ background: "var(--dash-surface)", padding: 10, borderRadius: 8, fontSize: 12, border: "1px solid var(--dash-border)" }}>
                    <p style={{ fontWeight: 600 }}>{t.title}</p>
                    {t.assignee && <p style={{ fontSize: 11, color: "var(--dash-muted)", marginTop: 4 }}>{t.assignee}</p>}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

// ── People Panel ───────────────────────────────────────────────────────────────
function PeoplePanel({ team }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelectMember = async (member) => {
    setSelectedMember(member);
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/performance/employee/${member.name}`);
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
      }
    } catch (err) {
      console.error('Error fetching performance:', err);
    } finally {
      setLoading(false);
    }
  };

  if (selectedMember && performanceData) {
    return (
      <>
        <Crumb parent="People" label={selectedMember.name} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 600 }}>{performanceData.employeeName}</h1>
          <Btn onClick={() => setSelectedMember(null)}>← Back</Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
          <Card style={{ padding: 20, textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>Performance Grade</p>
            <p style={{ fontSize: 42, fontWeight: 700, color: "var(--dash-green)", marginTop: 8 }}>{performanceData.performanceGrade}</p>
          </Card>
          {[["Score", `${performanceData.performance?.contributionScore || 0}/100`], ["Efficiency", `${performanceData.performance?.efficiency || 0} tasks/hr`], ["On-Time", `${performanceData.taskCompletion?.onTimeDelivery || '—'}`]].map(([l, v]) => (
            <Card key={l} style={{ padding: 20 }}>
              <p style={{ fontSize: 12, color: "var(--dash-muted)", marginBottom: 8 }}>{l}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: "var(--dash-blue)" }}>{v}</p>
            </Card>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Crumb parent="People" label="Team" />
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 600, marginBottom: 20 }}>People</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {team.map(member => (
          <Card key={member.id || member.name} style={{ padding: 20, textAlign: "center", cursor: "pointer" }} onClick={() => handleSelectMember(member)}>
            <Avatar name={member.name} size={50} />
            <p style={{ fontWeight: 700, marginTop: 10 }}>{member.name}</p>
            <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>{member.role}</p>
            {member.salary && <p style={{ fontSize: 13, fontWeight: 600, marginTop: 8, color: "var(--dash-blue)" }}>₵ {member.salary.toLocaleString()}</p>}
            <p style={{ fontSize: 11, color: "var(--dash-blue)", marginTop: 12, fontWeight: 600 }}>View Performance →</p>
          </Card>
        ))}
      </div>
    </>
  );
}

// ── Payroll Panel ──────────────────────────────────────────────────────────────
function PayrollPanel({ team }) {
  const total = team.reduce((s, m) => s + (m.salary || 0), 0);
  
  return (
    <>
      <Crumb parent="Payroll" label="May 2026" />
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 600, marginBottom: 20 }}>Payroll</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 22 }}>
        {[["Gross", `₵ ${total.toLocaleString()}`, false], ["Tax (28%)", `₵ ${Math.round(total * 0.28).toLocaleString()}`, false], ["Net", `₵ ${Math.round(total * 0.72).toLocaleString()}`, true]].map(([l, v, hi]) => (
          <Card key={l} style={{ padding: 20, background: hi ? "var(--dash-blue)" : "var(--dash-surface)", color: hi ? "#fff" : "var(--dash-ink)" }}>
            <p style={{ fontSize: 12, opacity: 0.7 }}>{l}</p>
            <p style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{v}</p>
          </Card>
        ))}
      </div>
      <Card style={{ overflow: "hidden" }}>
        <div style={{ background: "var(--dash-blue-soft)", padding: "12px 16px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", fontSize: 11, fontWeight: 600 }}>
          <p>Employee</p><p>Salary</p><p>Tax</p><p>Net</p>
        </div>
        {team.map(m => (
          <div key={m.id || m.name} style={{ padding: "12px 16px", borderTop: "1px solid var(--dash-border)", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", fontSize: 12, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={m.name} size={28} />
              <div><p>{m.name}</p><p style={{ fontSize: 10, color: "var(--dash-muted)" }}>{m.role}</p></div>
            </div>
            <p>₵ {(m.salary || 0).toLocaleString()}</p>
            <p>₵ {Math.round((m.salary || 0) * 0.28).toLocaleString()}</p>
            <p style={{ fontWeight: 600 }}>₵ {Math.round((m.salary || 0) * 0.72).toLocaleString()}</p>
          </div>
        ))}
      </Card>
    </>
  );
}

// ── Admin Panel ────────────────────────────────────────────────────────────────
function AdminPanel({ settings, onSettingsSave }) {
  const [form, setForm] = useState(settings);

  const handleSave = () => {
    onSettingsSave(form);
  };

  return (
    <>
      <Crumb parent="Admin" label="Setup" />
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 600, marginBottom: 8 }}>Admin setup</h1>
      <p style={{ fontSize: 13, color: "var(--dash-muted)", marginBottom: 24 }}>Configure Notion integration and manage workspace settings.</p>

      <Card style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Notion Integration</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>API Key</label>
          <input type="password" value={form.apiKey || ""} onChange={e => setForm({...form, apiKey: e.target.value})}
            placeholder="ntn_..." style={{ width: "100%", padding: 10, border: "1px solid var(--dash-border)", borderRadius: 8 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Task Database ID</label>
          <input type="text" value={form.taskDbId || ""} onChange={e => setForm({...form, taskDbId: e.target.value})}
            placeholder="..." style={{ width: "100%", padding: 10, border: "1px solid var(--dash-border)", borderRadius: 8 }} />
        </div>
        <Btn onClick={handleSave}><Icons.Check /> Save Settings</Btn>
      </Card>
    </>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────────────
export default function OctaDashboard() {
  const [section, setSection] = useState("agent");
  const [settings, setSettings] = useState({ apiKey: "", taskDbId: "", teamDbId: "", messageDbId: "" });
  const [notionData, setNotionData] = useState({ tasks: [], team: [] });
  const [localTasks, setLocalTasks] = useState([]);
  const [syncStatus, setSyncStatus] = useState({ syncing: false, lastSync: null, error: null });

  const { data: employees } = useFetch("/employees");
  const { data: tasks } = useFetch("/tasks");

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = globalStyles;
    document.head.appendChild(style);
  }, []);

  const handleTaskCreated = useCallback((task) => {
    setLocalTasks(prev => [task, ...prev]);
    setNotionData(prev => ({ ...prev, tasks: [task, ...prev.tasks] }));
  }, []);

  const handleAddTask = useCallback((task) => {
    setLocalTasks(prev => [task, ...prev]);
  }, []);

  const handleSettingsSave = useCallback((newSettings) => {
    setSettings(newSettings);
  }, []);

  const displayTasks = localTasks.length ? localTasks : (tasks || []);
  const taskCount = displayTasks.length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 240px", minHeight: "100vh" }}>
      <Sidebar section={section} setSection={setSection} taskCount={taskCount} />
      
      <div style={{ overflowY: "auto", padding: "40px", background: "var(--dash-bg)" }}>
        {section === "agent" && <AgentPanel settings={settings} notionData={notionData} onTaskCreated={handleTaskCreated} tasks={displayTasks} />}
        {section === "payroll" && <PayrollPanel team={employees || []} />}
        {section === "tasks" && <TasksPanel tasks={displayTasks} onAddTask={handleAddTask} notionConnected={!!(settings.apiKey && settings.taskDbId)} />}
        {section === "people" && <PeoplePanel team={employees || []} />}
        {section === "admin" && <AdminPanel settings={settings} onSettingsSave={handleSettingsSave} />}
      </div>

      <RightRail tasks={displayTasks} team={employees || []} syncStatus={syncStatus} />
    </div>
  );
}
