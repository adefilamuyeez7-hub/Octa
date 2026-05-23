import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";

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

// ── Inline SVG Icon helper ──────────────────────────────────────────────────
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

// ── Notion API Layer ──────────────────────────────────────────────────────────
const NOTION_VER = "2022-06-28";

async function notionFetch(path, apiKey, options = {}) {
  // Try direct first, then CORS proxy
  const proxies = [
    `https://corsproxy.io/?url=${encodeURIComponent("https://api.notion.com/v1" + path)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent("https://api.notion.com/v1" + path)}`,
  ];
  for (const url of proxies) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": NOTION_VER,
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      return data;
    } catch (e) {
      if (url === proxies[proxies.length - 1]) throw e;
    }
  }
}

function parseProp(prop) {
  if (!prop) return null;
  switch (prop.type) {
    case "title":       return prop.title?.map(t => t.plain_text).join("") ?? "";
    case "rich_text":   return prop.rich_text?.map(t => t.plain_text).join("") ?? "";
    case "select":      return prop.select?.name ?? null;
    case "multi_select":return prop.multi_select?.map(s => s.name).join(", ") ?? "";
    case "number":      return prop.number;
    case "people":      return prop.people?.map(p => p.name).join(", ") ?? "";
    case "email":       return prop.email ?? null;
    case "url":         return prop.url ?? null;
    case "checkbox":    return prop.checkbox ?? false;
    case "date":        return prop.date?.start ?? null;
    case "created_time":return prop.created_time;
    case "status":      return prop.status?.name ?? null;
    default:            return null;
  }
}

function parseNotionPage(page) {
  const out = { _id: page.id, _url: page.url, _created: page.created_time, _edited: page.last_edited_time };
  for (const [key, val] of Object.entries(page.properties || {})) {
    out[key.toLowerCase().replace(/\s+/g, "_")] = parseProp(val);
  }
  // Normalise common field names
  out.title = out.name ?? out.title ?? out.task ?? "(untitled)";
  out.status = out.status ?? "Not started";
  out.assignee = out.assignee ?? out.assigned_to ?? out.owner ?? null;
  out.priority = out.priority ?? null;
  out.description = out.description ?? out.notes ?? out.content ?? null;
  out.role = out.role ?? out.position ?? out.department ?? null;
  out.salary = out.salary ?? out.compensation ?? null;
  return out;
}

async function queryNotionDb(apiKey, dbId) {
  if (!apiKey || !dbId) return [];
  const data = await notionFetch(`/databases/${dbId}/query`, apiKey, {
    method: "POST",
    body: JSON.stringify({ page_size: 100, sorts: [{ timestamp: "created_time", direction: "descending" }] }),
  });
  return (data.results || []).map(parseNotionPage);
}

async function createNotionPage(apiKey, dbId, fields) {
  const properties = {};
  if (fields.title) properties.Name = { title: [{ text: { content: fields.title } }] };
  if (fields.description) properties.Description = { rich_text: [{ text: { content: fields.description } }] };
  if (fields.assignee) properties.Assignee = { rich_text: [{ text: { content: fields.assignee } }] };
  if (fields.priority) properties.Priority = { select: { name: fields.priority } };
  if (fields.status) properties.Status = { select: { name: fields.status } };
  if (fields.due_date) properties["Due Date"] = { date: { start: fields.due_date } };
  const page = await notionFetch("/pages", apiKey, {
    method: "POST",
    body: JSON.stringify({ parent: { database_id: dbId }, properties }),
  });
  return parseNotionPage(page);
}

// ── Persistent Storage ────────────────────────────────────────────────────────
async function stor_get(key, fallback = null) {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : fallback; }
  catch { return fallback; }
}
async function stor_set(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
}

// ── Claude API + Tool Use ─────────────────────────────────────────────────────
const SYSTEM = `You are 0cta — an intelligent HR operations AI agent for African tech companies.

You have direct access to the team's Notion workspace. When users ask you to create tasks, assign work, or update records, use your tools proactively — don't just describe what to do, do it.

Team: Amara Osei (Product Lead), Kwame Asante (Engineering), Zara Mensah (Design), Emeka Nwosu (Operations).

Rules:
- Be concise and action-oriented (2–3 paragraphs max)
- After tool use, confirm exactly what was created/done
- If Notion isn't connected, explain they can connect it in Admin → Notion Setup
- Format task lists with clear line breaks`;

function buildTools(hasNotion) {
  if (!hasNotion) return [];
  return [
    {
      name: "create_notion_task",
      description: "Create a new task or to-do in the Notion tasks database. Use whenever the user asks to create, add, schedule, or assign a task.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short task title" },
          description: { type: "string", description: "Detailed description or steps" },
          assignee: { type: "string", description: "Team member name (Amara, Kwame, Zara, or Emeka)" },
          priority: { type: "string", enum: ["High", "Medium", "Low"] },
          status: { type: "string", enum: ["Not started", "In progress", "Done"] },
          due_date: { type: "string", description: "ISO date YYYY-MM-DD" },
        },
        required: ["title"],
      },
    },
    {
      name: "list_notion_tasks",
      description: "Retrieve the current task list from Notion to answer questions about what tasks exist.",
      input_schema: { type: "object", properties: { filter_assignee: { type: "string" }, filter_status: { type: "string" } }, required: [] },
    },
    {
      name: "get_team_data",
      description: "Retrieve team member information from Notion (roles, current tasks, performance).",
      input_schema: { type: "object", properties: {}, required: [] },
    },
  ];
}

async function runAgent({ userMsg, displayHistory, settings, notionData, onTaskCreated }) {
  // Build clean API message array (skip tool internals for display simplicity)
  const apiMsgs = displayHistory.slice(-12)
    .filter(m => m.from === "you" || m.from === "agent")
    .map(m => ({ role: m.from === "you" ? "user" : "assistant", content: m.text }));
  apiMsgs.push({ role: "user", content: userMsg });

  const tools = buildTools(!!(settings.apiKey && settings.taskDbId));
  let currentMsgs = [...apiMsgs];
  const toolLog = [];

  for (let i = 0; i < 4; i++) {
    const body = { model: "claude-sonnet-4-20250514", max_tokens: 1000, system: SYSTEM, messages: currentMsgs };
    if (tools.length) body.tools = tools;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Claude API ${res.status}`);
    const data = await res.json();

    if (data.stop_reason !== "tool_use") {
      const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      return { text, toolLog };
    }

    // Execute tools
    const toolResults = [];
    for (const block of data.content.filter(b => b.type === "tool_use")) {
      let result = "";
      try {
        if (block.name === "create_notion_task") {
          const page = await createNotionPage(settings.apiKey, settings.taskDbId, block.input);
          const entry = {
            _id: page._id, title: block.input.title, description: block.input.description,
            assignee: block.input.assignee, priority: block.input.priority,
            status: block.input.status || "Not started", _url: page._url,
            _created: new Date().toISOString(), via: "agent",
          };
          onTaskCreated(entry);
          toolLog.push(`✓ Created: "${block.input.title}" in Notion`);
          result = `Task created successfully. Title: "${block.input.title}", ID: ${page._id}, URL: ${page._url}`;
        } else if (block.name === "list_notion_tasks") {
          const tasks = notionData.tasks.slice(0, 20);
          result = tasks.length
            ? tasks.map(t => `• ${t.title} [${t.status}]${t.assignee ? ` → ${t.assignee}` : ""}`).join("\n")
            : "No tasks found in Notion yet.";
          toolLog.push("✓ Listed tasks from Notion");
        } else if (block.name === "get_team_data") {
          const team = notionData.team.length ? notionData.team : [
            { title: "Amara Osei", role: "Product Lead" },
            { title: "Kwame Asante", role: "Engineering" },
            { title: "Zara Mensah", role: "Design" },
            { title: "Emeka Nwosu", role: "Operations" },
          ];
          result = team.map(m => `• ${m.title || m.name} — ${m.role || "Team member"}`).join("\n");
          toolLog.push("✓ Retrieved team data");
        }
      } catch (e) {
        result = `Tool error: ${e.message}`;
        toolLog.push(`✗ ${block.name} failed: ${e.message}`);
      }
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
    }

    currentMsgs = [
      ...currentMsgs,
      { role: "assistant", content: data.content },
      { role: "user", content: toolResults },
    ];
  }

  return { text: "I ran into an issue completing your request. Please try again.", toolLog };
}

// ── Sample fallback data ──────────────────────────────────────────────────────
const SAMPLE_TEAM = [
  { title: "Amara Osei", role: "Product Lead", productivity: 87, projects: 12, done: 10, salary: 6200, rating: 4.8 },
  { title: "Kwame Asante", role: "Engineering", productivity: 74, projects: 9, done: 6, salary: 5800, rating: 4.2 },
  { title: "Zara Mensah", role: "Design", productivity: 91, projects: 7, done: 6, salary: 5400, rating: 4.9 },
  { title: "Emeka Nwosu", role: "Operations", productivity: 68, projects: 14, done: 9, salary: 4900, rating: 3.9 },
];
const SAMPLE_TASKS = [
  { _id: "s1", title: "Onboard product manager", status: "Not started", priority: "High", assignee: "Amara Osei", _created: "2026-05-20T09:00:00Z", via: "manual" },
  { _id: "s2", title: "Q2 payroll review", status: "Done", priority: "Medium", assignee: "Emeka Nwosu", _created: "2026-05-19T14:00:00Z", via: "agent" },
  { _id: "s3", title: "Performance review cycle", status: "In progress", priority: "High", assignee: null, _created: "2026-05-18T11:00:00Z", via: "agent" },
  { _id: "s4", title: "Design system update", status: "Not started", priority: "Low", assignee: "Zara Mensah", _created: "2026-05-17T08:30:00Z", via: "manual" },
];

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

// ── Notion Sync Bar ───────────────────────────────────────────────────────────
function SyncBar({ syncStatus, connected, onSync }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 1000); return () => clearInterval(t); }, []);
  if (!connected) return null;
  const elapsed = syncStatus.lastSync ? Math.floor((Date.now() - new Date(syncStatus.lastSync)) / 60000) : null;
  const nextIn = elapsed !== null ? Math.max(0, 60 - elapsed) : null;
  return (
    <div style={{ gridColumn: "3/11", display: "flex", alignItems: "center", gap: 10,
      padding: "8px 40px", borderBottom: "1px solid var(--dash-border)",
      background: "var(--dash-blue-soft)", fontSize: 11, color: "var(--dash-muted)" }}>
      <Icons.Notion />
      <span>Notion connected</span>
      {syncStatus.syncing
        ? <><span className="spin" style={{ color: "var(--dash-blue)", display: "flex" }}><Icons.Loader /></span><span>Syncing…</span></>
        : <>{syncStatus.lastSync && <span>Last sync {elapsed === 0 ? "just now" : `${elapsed}m ago`}</span>}
          {nextIn !== null && <span>· next in {nextIn}m</span>}</>}
      {syncStatus.error && <span style={{ color: "var(--dash-red)", display: "flex", alignItems: "center", gap: 4 }}><Icons.AlertCircle /> {syncStatus.error}</span>}
      <button onClick={onSync} disabled={syncStatus.syncing} style={{
        marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
        background: "none", border: "none", cursor: "pointer", color: "var(--dash-blue)", fontSize: 11 }}>
        <Icons.RefreshCw /> Sync now
      </button>
    </div>
  );
}

// ── Agent Panel ───────────────────────────────────────────────────────────────
const QUICK = [
  "Create onboarding tasks for a new engineer",
  "List all current Notion tasks",
  "Draft a performance review for Amara Osei",
  "Assign a payroll review task to Emeka Nwosu",
];

const AgentPanel = memo(function AgentPanel({ settings, notionData, onTaskCreated }) {
  const [msgs, setMsgs] = useState([{
    from: "agent",
    text: settings.apiKey && settings.taskDbId
      ? "Hello! I'm 0cta, your HR agent. I'm connected to your Notion workspace — ask me to create tasks, review team data, or run any HR workflow."
      : "Hello! I'm 0cta. I can help with HR workflows. Connect Notion in Admin → Notion Setup to enable task creation directly in your workspace.",
  }]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [toolLog, setToolLog] = useState([]);
  const scrollRef = useRef(null);
  const connected = !!(settings.apiKey && settings.taskDbId);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, running]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || running) return;
    setInput("");
    setToolLog([]);
    const next = [...msgs, { from: "you", text }];
    setMsgs(next);
    setRunning(true);
    try {
      const { text: reply, toolLog: log } = await runAgent({
        userMsg: text, displayHistory: next, settings, notionData, onTaskCreated,
      });
      setMsgs(m => [...m, { from: "agent", text: reply }]);
      setToolLog(log);
    } catch (e) {
      setMsgs(m => [...m, { from: "agent", text: `Sorry, something went wrong: ${e.message}` }]);
    } finally { setRunning(false); }
  }, [input, running, msgs, settings, notionData, onTaskCreated]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 680 }}>
      <Crumb parent="Agent" label="Conversation" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 600 }}>What should 0cta do?</h1>
        <StatusDot ok={connected} label={connected ? "Notion connected" : "Notion not linked"} />
      </div>
      <p style={{ fontSize: 13, color: "var(--dash-muted)", marginBottom: 18 }}>
        Plain-text commands in. Tasks in Notion, payroll reviews, and team updates out.
      </p>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4, marginBottom: 14 }}>
        {msgs.map((m, i) => (
          <div key={i} className="msg-enter" style={{ display: "flex", gap: 8, flexDirection: m.from === "you" ? "row-reverse" : "row" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: m.from === "agent" ? "var(--dash-blue)" : "var(--dash-blue-soft)",
              color: m.from === "agent" ? "#fff" : "var(--dash-blue)", fontSize: 11, fontWeight: 700 }}>
              {m.from === "agent" ? <Icons.Bot /> : "Y"}
            </div>
            <div style={{ maxWidth: "78%", borderRadius: m.from === "you" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
              padding: "11px 15px", fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap",
              background: m.from === "you" ? "var(--dash-blue)" : "var(--dash-surface)",
              color: m.from === "you" ? "#fff" : "var(--dash-ink)",
              border: m.from === "you" ? "none" : "1px solid var(--dash-border)" }}>
              {m.text}
              {m.from === "agent" && (
                <div style={{ display: "flex", gap: 5, marginTop: 8 }}>
                  {["Helpful", "Revise"].map(l => (
                    <button key={l} style={{ fontSize: 10, padding: "2px 10px", borderRadius: 6, border: "none",
                      cursor: "pointer", background: "var(--dash-blue-soft)",
                      color: l === "Helpful" ? "var(--dash-blue)" : "var(--dash-muted)" }}>{l}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {running && (
          <div className="msg-enter" style={{ display: "flex", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--dash-blue)", color: "#fff" }}><Icons.Bot /></div>
            <div style={{ borderRadius: "4px 18px 18px 18px", border: "1px solid var(--dash-border)", background: "var(--dash-surface)", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center" }}>
              <span className="dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--dash-blue)", display: "block" }} />
              <span className="dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--dash-blue)", display: "block" }} />
              <span className="dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--dash-blue)", display: "block" }} />
            </div>
          </div>
        )}
      </div>

      {/* Tool activity log */}
      {toolLog.length > 0 && (
        <div style={{ marginBottom: 10, padding: "8px 14px", borderRadius: 10, background: "var(--dash-green-soft)", fontSize: 11, color: "var(--dash-green)" }}>
          {toolLog.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      {/* Quick prompts */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => setInput(q)} style={{
            fontSize: 11, padding: "4px 11px", borderRadius: 99,
            border: "1px solid var(--dash-border)", background: "var(--dash-surface)",
            color: "var(--dash-muted)", cursor: "pointer" }}>
            {q}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div style={{ borderRadius: 16, background: "var(--dash-blue-soft)", border: "1px solid var(--dash-border)", padding: 14 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
          placeholder={connected
            ? "e.g. Create onboarding tasks for a new engineer starting Monday, assign to Amara Osei, and add a payroll setup subtask for Emeka."
            : "Connect Notion in Admin → Notion Setup to enable task creation…"}
          rows={3}
          disabled={running}
          style={{ width: "100%", background: "transparent", border: "none", outline: "none",
            resize: "vertical", fontSize: 13, color: "var(--dash-ink)", lineHeight: 1.6, minHeight: 64 }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "var(--dash-muted)", display: "flex", alignItems: "center", gap: 5 }}>
            <Icons.Flame /> {connected ? "Notion-powered" : "Local mode"} · ⌘+Enter
          </span>
          <Btn onClick={send} disabled={running || !input.trim()}>
            <Icons.Send /> {running ? "Running…" : "Run"}
          </Btn>
        </div>
      </div>
    </div>
  );
});

// ── Notion Setup Panel ────────────────────────────────────────────────────────
function NotionSetupPanel({ settings, onSave }) {
  const [form, setForm] = useState({ ...settings });
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const testConn = async () => {
    setTesting(true); setTestResult(null);
    try {
      const tasks = await queryNotionDb(form.apiKey, form.taskDbId);
      setTestResult({ ok: true, msg: `✓ Connected — found ${tasks.length} task(s) in database` });
    } catch (e) {
      setTestResult({ ok: false, msg: `✗ ${e.message}` });
    } finally { setTesting(false); }
  };

  const save = async () => {
    setSaving(true);
    await stor_set("notion:settings", form);
    onSave(form);
    setSaving(false);
    setTestResult({ ok: true, msg: "✓ Settings saved" });
  };

  const Field = ({ label, k, placeholder, hint }) => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--dash-muted)", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={k === "apiKey" && !show ? "password" : "text"}
          value={form[k] || ""}
          onChange={f(k)}
          placeholder={placeholder}
          style={{ width: "100%", padding: "10px 40px 10px 12px", borderRadius: 10,
            border: "1px solid var(--dash-border)", background: "var(--dash-blue-soft)",
            fontSize: 13, color: "var(--dash-ink)", outline: "none" }}
        />
        {k === "apiKey" && (
          <button onClick={() => setShow(s => !s)} style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "var(--dash-muted)" }}>
            {show ? <Icons.EyeOff /> : <Icons.Eye />}
          </button>
        )}
      </div>
      {hint && <p style={{ fontSize: 11, color: "var(--dash-muted)", marginTop: 5 }}>{hint}</p>}
    </div>
  );

  return (
    <Card style={{ padding: 24, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--dash-blue-soft)",
          display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dash-blue)" }}>
          <Icons.Notion />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15 }}>Notion Integration</p>
          <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>Connect your workspace to enable AI-powered task management</p>
        </div>
        <StatusDot ok={!!(settings.apiKey && settings.taskDbId)} label={settings.apiKey ? "Connected" : "Not linked"} />
      </div>

      {/* How to guide */}
      <div style={{ borderRadius: 12, padding: 14, background: "oklch(0.97 0.01 265)", border: "1px solid var(--dash-border)", marginBottom: 20, fontSize: 12, color: "var(--dash-muted)" }}>
        <p style={{ fontWeight: 600, color: "var(--dash-ink)", marginBottom: 8 }}>How to get your Notion credentials</p>
        {[
          ["1", "Go to notion.so/my-integrations → Create integration → copy the Internal Integration Secret (starts with ntn_…)"],
          ["2", "Open your Notion database → ⋯ menu → Connections → Connect to your integration"],
          ["3", "Copy the database ID from the URL: notion.so/workspace/[DATABASE_ID]?v=…"],
          ["4", "Paste below and test the connection"],
        ].map(([n, t]) => (
          <div key={n} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--dash-blue-soft)",
              color: "var(--dash-blue)", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{n}</span>
            <span>{t}</span>
          </div>
        ))}
      </div>

      <Field k="apiKey" label="Notion Internal Integration Secret" placeholder="ntn_xxxxxxxxxxxxxxxxxxxx"
        hint="Keep this secret — it gives access to your Notion workspace" />
      <Field k="taskDbId" label="Tasks Database ID" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        hint="The database where the AI will create and read tasks" />
      <Field k="teamDbId" label="Team Database ID (optional)" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        hint="Used to sync team member data — name, role, salary" />
      <Field k="messageDbId" label="Messages / Notes Database ID (optional)" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        hint="Synced hourly — used as context for the AI agent" />

      {testResult && (
        <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize: 12,
          background: testResult.ok ? "var(--dash-green-soft)" : "var(--dash-red-soft)",
          color: testResult.ok ? "var(--dash-green)" : "var(--dash-red)" }}>
          {testResult.msg}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={testConn} disabled={testing || !form.apiKey || !form.taskDbId} variant="soft">
          {testing ? <><span className="spin" style={{ display: "flex" }}><Icons.Loader /></span> Testing…</> : <><Icons.Link /> Test Connection</>}
        </Btn>
        <Btn onClick={save} disabled={saving || !form.apiKey || !form.taskDbId}>
          {saving ? "Saving…" : <><Icons.Check /> Save & Connect</>}
        </Btn>
        {settings.apiKey && (
          <Btn onClick={() => { onSave({ apiKey: "", taskDbId: "", teamDbId: "", messageDbId: "" }); stor_set("notion:settings", {}); }} variant="ghost">
            <Icons.X /> Disconnect
          </Btn>
        )}
      </div>
    </Card>
  );
}

// ── People Panel ──────────────────────────────────────────────────────────────
function PeoplePanel({ team }) {
  const display = team.length ? team : SAMPLE_TEAM;
  return (
    <>
      <Crumb parent="People" label="Team" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 600 }}>
          People <span style={{ fontSize: 15, color: "var(--dash-muted)", fontFamily: "var(--font-sans)" }}>· {display.length}</span>
        </h1>
        {team.length === 0 && <span style={{ fontSize: 11, color: "var(--dash-muted)", background: "var(--dash-blue-soft)", padding: "4px 10px", borderRadius: 99 }}>Sample data — connect Notion Team DB to load real data</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
        {display.map(w => {
          const name = w.title || w.name || "?";
          const prod = w.productivity ?? Math.floor(60 + Math.random() * 35);
          return (
            <Card key={name} style={{ padding: 20, cursor: "pointer", transition: "transform .15s, box-shadow .15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px -8px rgba(99,102,241,.22)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 14 }}>
                <Avatar name={name} size={50} />
                <p style={{ fontWeight: 700, marginTop: 10, fontSize: 14 }}>{name}</p>
                <p style={{ fontSize: 12, color: "var(--dash-muted)" }}>{w.role ?? "Team member"}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", textAlign: "center", marginBottom: 12 }}>
                {[["Projects", w.projects ?? "—"], ["Done", w.done ?? "—"], ["Rating", w.rating ? `${w.rating}★` : "—"]].map(([l, v]) => (
                  <div key={l}><p style={{ fontSize: 10, color: "var(--dash-muted)" }}>{l}</p><p style={{ fontWeight: 700, marginTop: 2 }}>{v}</p></div>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--dash-muted)", marginBottom: 5 }}>
                  <span>Productivity</span><span style={{ color: "var(--dash-blue)", fontWeight: 600 }}>{prod}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: "var(--dash-blue-soft)" }}>
                  <div style={{ height: "100%", borderRadius: 99, width: `${prod}%`, background: "var(--dash-blue)" }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

// ── Tasks Panel ───────────────────────────────────────────────────────────────
function TasksPanel({ tasks, onAddTask, notionConnected }) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const display = tasks.length ? tasks : SAMPLE_TASKS;
  const statusCols = [
    { label: "Not started", bg: "var(--dash-blue-soft)" },
    { label: "In progress", bg: "oklch(0.95 0.05 60)" },
    { label: "Done", bg: "var(--dash-green-soft)" },
  ];
  const addTask = () => {
    if (!newTitle.trim()) return;
    onAddTask({ _id: Date.now().toString(), title: newTitle.trim(), status: "Not started", priority: "Medium", _created: new Date().toISOString(), via: "manual" });
    setNewTitle(""); setAdding(false);
  };
  return (
    <>
      <Crumb parent="Tasks" label={notionConnected ? "Notion sync" : "Local board"} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 600 }}>Tasks</h1>
          <p style={{ fontSize: 12, color: "var(--dash-muted)", marginTop: 3 }}>
            {notionConnected ? "Live sync with Notion · hourly refresh" : "Local queue · connect Notion to enable cloud sync"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!notionConnected && <span style={{ fontSize: 11, color: "var(--dash-muted)", background: "var(--dash-blue-soft)", padding: "4px 10px", borderRadius: 99 }}>Sample data</span>}
          <Btn size="sm" onClick={() => setAdding(true)}><Icons.Plus /> New task</Btn>
        </div>
      </div>
      {adding && (
        <Card style={{ padding: 14, marginBottom: 16 }}>
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addTask(); if (e.key === "Escape") setAdding(false); }}
            placeholder="Task title…"
            style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 13, color: "var(--dash-ink)", marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" onClick={addTask}>Add</Btn>
            <Btn size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Btn>
          </div>
        </Card>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {statusCols.map(col => {
          const col_tasks = display.filter(t => (t.status || "Not started") === col.label);
          return (
            <div key={col.label} style={{ borderRadius: 16, padding: 14, background: col.bg }}>
              <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: .5, color: "var(--dash-muted)" }}>
                {col.label} · {col_tasks.length}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {col_tasks.map(t => (
                  <div key={t._id} style={{ background: "var(--dash-surface)", borderRadius: 12, padding: "10px 12px", fontSize: 12 }}>
                    <p style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--dash-muted)", fontSize: 10 }}>
                      <span>{t.assignee ?? "Unassigned"}</span>
                      {t.priority && <span style={{ padding: "1px 7px", borderRadius: 99, fontSize: 10,
                        background: t.priority === "High" ? "var(--dash-red-soft)" : t.priority === "Medium" ? "oklch(0.97 0.04 60)" : "var(--dash-blue-soft)",
                        color: t.priority === "High" ? "var(--dash-red)" : t.priority === "Medium" ? "oklch(0.55 0.12 60)" : "var(--dash-blue)" }}>
                        {t.priority}
                      </span>}
                    </div>
                    {t._url && (
                      <a href={t._url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: "var(--dash-blue)", display: "flex", alignItems: "center", gap: 3, marginTop: 5, textDecoration: "none" }}>
                        <Icons.Link /> Open in Notion
                      </a>
                    )}
                  </div>
                ))}
                {col_tasks.length === 0 && <p style={{ fontSize: 12, color: "var(--dash-muted)", textAlign: "center", padding: "8px 0" }}>—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Payroll Panel ─────────────────────────────────────────────────────────────
function PayrollPanel({ team }) {
  const display = team.length ? team : SAMPLE_TEAM;
  const total = display.reduce((s, w) => s + (w.salary ?? 0), 0);
  return (
    <>
      <Crumb parent="Payroll" label="May 2026" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 600 }}>Payroll</h1>
        <Btn><Icons.ArrowUp /> Run payroll</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 22 }}>
        {[["Gross monthly", `$${total.toLocaleString()}`, false], ["Tax & social (39%)", `$${Math.round(total * .39).toLocaleString()}`, false], ["Net payout", `$${Math.round(total * .61).toLocaleString()}`, true]].map(([l, v, hi]) => (
          <div key={l} style={{ borderRadius: 16, padding: 20, background: hi ? "var(--dash-blue)" : "var(--dash-surface)", border: hi ? "none" : "1px solid var(--dash-border)", color: hi ? "#fff" : "var(--dash-ink)" }}>
            <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: .5, opacity: .65 }}>{l}</p>
            <p style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{v}</p>
          </div>
        ))}
      </div>
      <Card style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "10px 20px",
          background: "var(--dash-blue-soft)", fontSize: 10, textTransform: "uppercase", letterSpacing: .5, color: "var(--dash-muted)" }}>
          {["Employee","Gross","Tax 28%","Social 11%","Net"].map((h,i) => <p key={h} style={{ textAlign: i ? "right" : "left" }}>{h}</p>)}
        </div>
        {display.map(w => {
          const name = w.title || w.name || "?";
          const sal = w.salary ?? 0;
          const tax = Math.round(sal * .28), soc = Math.round(sal * .11);
          return (
            <div key={name} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "14px 20px",
              borderTop: "1px solid var(--dash-border)", fontSize: 13, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={name} size={28} />
                <div><p style={{ fontWeight: 500 }}>{name}</p><p style={{ fontSize: 10, color: "var(--dash-muted)" }}>{w.role}</p></div>
              </div>
              <p style={{ textAlign: "right" }}>${sal.toLocaleString()}</p>
              <p style={{ textAlign: "right", color: "var(--dash-muted)" }}>–${tax.toLocaleString()}</p>
              <p style={{ textAlign: "right", color: "var(--dash-muted)" }}>–${soc.toLocaleString()}</p>
              <p style={{ textAlign: "right", fontWeight: 700, color: "var(--dash-blue)" }}>${(sal - tax - soc).toLocaleString()}</p>
            </div>
          );
        })}
      </Card>
    </>
  );
}

// ── Token Panel ───────────────────────────────────────────────────────────────
function TokenPanel({ tasks }) {
  const display = tasks.length ? tasks : SAMPLE_TASKS;
  const agentCount = display.filter(t => t.via === "agent").length;
  return (
    <>
      <Crumb parent="Token" label="$OCTA wallet" />
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 600, marginBottom: 4 }}>Usage activity</h1>
      <p style={{ fontSize: 13, color: "var(--dash-muted)", marginBottom: 22 }}>Live action counts — agent requests, Notion events, task operations.</p>
      <div style={{ borderRadius: 22, padding: 26, marginBottom: 16, background: "linear-gradient(135deg, var(--dash-blue), oklch(0.45 0.18 280))", color: "#fff" }}>
        <p style={{ fontSize: 11, opacity: .7, marginBottom: 6 }}>Total stored actions</p>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 52, fontWeight: 500, lineHeight: 1 }}>{display.length}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 20 }}>
          {[["Agent", agentCount], ["Manual", display.filter(t => t.via === "manual").length], ["Notion", display.filter(t => (t.via || "").includes("notion") || (t._url || "").includes("notion")).length]].map(([l, v]) => (
            <div key={l}><p style={{ fontSize: 10, opacity: .65 }}>{l}</p><p style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{v}</p></div>
          ))}
        </div>
      </div>
      <h3 style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Recent activity</h3>
      <Card style={{ overflow: "hidden" }}>
        {display.slice(0, 6).map((t, i) => (
          <div key={t._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderTop: i ? "1px solid var(--dash-border)" : "none", fontSize: 13 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}>
              {t.via === "agent" ? <Icons.Bot /> : <Icons.Tasks />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500 }}>{t.title}</p>
              <p style={{ fontSize: 10, color: "var(--dash-muted)" }}>via {t.via ?? "—"} · {new Date(t._created || t.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
            <span style={{ color: "var(--dash-blue)", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>
              <Icons.Flame /> 1
            </span>
          </div>
        ))}
      </Card>
    </>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({ settings, onSettingsSave }) {
  const steps = [
    { title: "Create admin workspace", detail: "Set up your HR home and invite team leads.", done: true },
    { title: "Connect Notion workspace", detail: "Add your API key and database IDs below.", done: !!(settings.apiKey && settings.taskDbId) },
    { title: "Enable team sync", detail: "Link your Team database for live member data.", done: !!settings.teamDbId },
    { title: "Enable messages sync", detail: "Link your Messages database for context-aware AI.", done: !!settings.messageDbId },
    { title: "Configure $OCTA rules", detail: "Set burn policy, approvals, and payroll automation.", done: false },
  ];
  return (
    <>
      <Crumb parent="Admin" label="Setup" />
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, fontWeight: 600, marginBottom: 8 }}>Admin setup</h1>
      <p style={{ fontSize: 13, color: "var(--dash-muted)", marginBottom: 24 }}>Configure Notion integration and complete the onboarding checklist.</p>

      <NotionSetupPanel settings={settings} onSave={onSettingsSave} />

      <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Onboarding checklist</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map(s => (
          <div key={s.title} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 18, borderRadius: 14, background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
              background: s.done ? "var(--dash-blue)" : "var(--dash-blue-soft)",
              color: s.done ? "#fff" : "var(--dash-muted)", fontWeight: 700 }}>
              {s.done ? <Icons.Check /> : "…"}
            </div>
            <div><p style={{ fontWeight: 600 }}>{s.title}</p><p style={{ fontSize: 12, color: "var(--dash-muted)", marginTop: 3 }}>{s.detail}</p></div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV = [
  { id: "agent", Icon: Icons.Sparkles, label: "AI Agent" },
  { id: "people", Icon: Icons.Users, label: "People" },
  { id: "tasks", Icon: Icons.Tasks, label: "Tasks" },
  { id: "payroll", Icon: Icons.Wallet, label: "Payroll" },
  { id: "token", Icon: Icons.Coins, label: "Token" },
  { id: "admin", Icon: Icons.Shield, label: "Admin & Notion" },
];

function Sidebar({ section, setSection, taskCount }) {
  return (
    <aside style={{ gridColumn: "1/3", padding: "28px 20px", borderRight: "1px solid var(--dash-border)", display: "flex", flexDirection: "column", minHeight: 860 }}>
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
        <button style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer", textAlign: "left", fontSize: 13, background: "transparent", color: "var(--dash-muted)", fontFamily: "var(--font-sans)" }}>
          <Icons.Settings /> Settings
        </button>
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

// ── Right Rail ────────────────────────────────────────────────────────────────
function RightRail({ tasks, team, syncStatus }) {
  const display = team.length ? team : SAMPLE_TEAM;
  const avgProd = Math.round(display.reduce((s, w) => s + (w.productivity ?? 75), 0) / display.length);
  const r = 56, c = 2 * Math.PI * r;
  const recent = (tasks.length ? tasks : SAMPLE_TASKS).slice(0, 3);
  return (
    <aside style={{ gridColumn: "11/13", padding: "28px 20px", borderLeft: "1px solid var(--dash-border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <Avatar name="0cta Admin" size={38} />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 13 }}>0cta Admin</p>
          <p style={{ fontSize: 11, color: "var(--dash-muted)" }}>Admin workspace</p>
        </div>
        <button style={{ width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer", background: "var(--dash-blue-soft)", color: "var(--dash-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icons.More />
        </button>
      </div>

      {/* Token card */}
      <div style={{ borderRadius: 16, padding: 18, marginBottom: 22, background: "linear-gradient(135deg, var(--dash-blue), oklch(0.45 0.18 280))", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ fontSize: 10, opacity: .7 }}>Stored actions</p><Icons.Coins />
        </div>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 500 }}>{tasks.length || SAMPLE_TASKS.length}</p>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginTop: 8, opacity: .8 }}>
          <span>✦ {tasks.filter(t => t.via === "agent").length} agent</span>
          <span>↑ {tasks.filter(t => (t._url || "").includes("notion.so")).length} Notion</span>
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
          <div key={t._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 12, background: t.via === "agent" ? "var(--dash-blue-soft)" : "var(--dash-green-soft)" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--dash-surface)", color: "var(--dash-blue)" }}>
              {t.via === "agent" ? <Icons.Bot /> : <Icons.Mail />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</p>
              <p style={{ fontSize: 10, color: "var(--dash-muted)" }}>{t.status}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ── Dashboard Root ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [section, setSection] = useState("agent");
  const [settings, setSettings] = useState({ apiKey: "", taskDbId: "", teamDbId: "", messageDbId: "" });
  const [notionData, setNotionData] = useState({ tasks: [], team: [], messages: [] });
  const [syncStatus, setSyncStatus] = useState({ syncing: false, lastSync: null, error: null });
  const [localTasks, setLocalTasks] = useState([]);
  const syncRef = useRef(null);

  // Load settings + cached data from storage on mount
  useEffect(() => {
    (async () => {
      const s = await stor_get("notion:settings", {});
      const tasks = await stor_get("notion:tasks", []);
      const team = await stor_get("notion:team", []);
      const messages = await stor_get("notion:messages", []);
      const lastSync = await stor_get("notion:lastSync", null);
      setSettings(s);
      setNotionData({ tasks, team, messages });
      if (lastSync) setSyncStatus(p => ({ ...p, lastSync }));
    })();
  }, []);

  const syncNow = useCallback(async (s = settings) => {
    if (!s.apiKey || !s.taskDbId) return;
    setSyncStatus(p => ({ ...p, syncing: true, error: null }));
    try {
      const [tasks, team, messages] = await Promise.all([
        queryNotionDb(s.apiKey, s.taskDbId),
        s.teamDbId ? queryNotionDb(s.apiKey, s.teamDbId) : Promise.resolve([]),
        s.messageDbId ? queryNotionDb(s.apiKey, s.messageDbId) : Promise.resolve([]),
      ]);
      const now = new Date().toISOString();
      setNotionData({ tasks, team, messages });
      setSyncStatus({ syncing: false, lastSync: now, error: null });
      await stor_set("notion:tasks", tasks);
      await stor_set("notion:team", team);
      await stor_set("notion:messages", messages);
      await stor_set("notion:lastSync", now);
    } catch (e) {
      setSyncStatus(p => ({ ...p, syncing: false, error: e.message }));
    }
  }, [settings]);

  // Hourly sync
  useEffect(() => {
    if (!settings.apiKey) return;
    syncNow(settings);
    syncRef.current = setInterval(() => syncNow(settings), 60 * 60 * 1000);
    return () => clearInterval(syncRef.current);
  }, [settings.apiKey, settings.taskDbId]);

  const handleSettingsSave = (newSettings) => {
    setSettings(newSettings);
    if (newSettings.apiKey && newSettings.taskDbId) {
      setTimeout(() => syncNow(newSettings), 300);
    }
  };

  const handleTaskCreated = useCallback((task) => {
    setLocalTasks(prev => [task, ...prev]);
    setNotionData(prev => ({ ...prev, tasks: [task, ...prev.tasks] }));
  }, []);

  const handleAddTask = useCallback((task) => {
    setLocalTasks(prev => [task, ...prev]);
  }, []);

  const allTasks = [...localTasks, ...notionData.tasks].filter((t, i, arr) =>
    arr.findIndex(x => x._id === t._id) === i
  );
  const connected = !!(settings.apiKey && settings.taskDbId);

  const panels = {
    agent: <AgentPanel settings={settings} notionData={notionData} onTaskCreated={handleTaskCreated} />,
    people: <PeoplePanel team={notionData.team} />,
    tasks: <TasksPanel tasks={allTasks} onAddTask={handleAddTask} notionConnected={connected} />,
    payroll: <PayrollPanel team={notionData.team} />,
    token: <TokenPanel tasks={allTasks} />,
    admin: <AdminPanel settings={settings} onSettingsSave={handleSettingsSave} />,
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ minHeight: "100vh", padding: 20, background: "var(--dash-bg)", fontFamily: "var(--font-sans)" }}>
        {/* Ambient */}
        <div style={{ position: "fixed", top: -100, right: -60, width: 420, height: 420, borderRadius: "50%", background: "oklch(0.88 0.06 270)", opacity: .45, pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", bottom: -120, left: -60, width: 500, height: 500, borderRadius: "50%", background: "oklch(0.88 0.06 270)", opacity: .5, pointerEvents: "none", zIndex: 0 }} />

        <div style={{
          position: "relative", zIndex: 1, maxWidth: 1380, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(12,1fr)",
          borderRadius: 26, overflow: "hidden",
          background: "var(--dash-surface)",
          boxShadow: "0 24px 80px -20px rgba(60,80,180,.22)",
        }}>
          <Sidebar section={section} setSection={setSection} taskCount={allTasks.length} />

          <SyncBar syncStatus={syncStatus} connected={connected} onSync={() => syncNow(settings)} />

          <main style={{ gridColumn: "3/11", padding: "32px 38px", display: "flex", flexDirection: "column",
            borderRight: "1px solid var(--dash-border)", minHeight: 860 }}>
            {panels[section]}
          </main>

          <RightRail tasks={allTasks} team={notionData.team} syncStatus={syncStatus} />
        </div>
      </div>
    </>
  );
}
