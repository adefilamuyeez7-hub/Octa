import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users, ListChecks, Wallet, Coins, Settings,
  Search, ChevronRight, MoreHorizontal, ChevronDown, SlidersHorizontal,
  Send, Sparkles, Mail, FileText, CheckCircle2, Flame, Bot, ArrowUpRight,
  X, TrendingUp, Plus, ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "0cta — Dashboard" }] }),
});

type Section = "people" | "agent" | "tasks" | "payroll" | "token" | "admin";
type NotionStatus = { oauthReady: boolean; databaseReady: boolean; connected: boolean };

type Worker = {
  name: string; role: string; projects: number; done: number; progress: number;
  productivity: number; dim?: boolean; salary: number; tasksThisWeek: number; rating: number;
};

const team: Worker[] = [
  { name: "James Smith", role: "Middle UI/UX", projects: 22, done: 18, progress: 3, productivity: 65, salary: 5400, tasksThisWeek: 8, rating: 4.2 },
  { name: "Kevin Kim", role: "Senior Graphic", projects: 85, done: 80, progress: 2, productivity: 80, salary: 7200, tasksThisWeek: 12, rating: 4.7 },
  { name: "Lissa Shulz", role: "Junior Graphic", projects: 7, done: 5, progress: 1, productivity: 40, salary: 3200, tasksThisWeek: 5, rating: 3.6 },
  { name: "Jaspal Cortes", role: "Junior UI/UX", projects: 7, done: 6, progress: 1, productivity: 55, salary: 3400, tasksThisWeek: 4, rating: 3.9, dim: true },
  { name: "Elliot Morrison", role: "Senior UI/UX", projects: 133, done: 130, progress: 3, productivity: 92, salary: 7800, tasksThisWeek: 14, rating: 4.9, dim: true },
  { name: "Jace O'Quinn", role: "Middle Graphic", projects: 45, done: 40, progress: 3, productivity: 70, salary: 5100, tasksThisWeek: 9, rating: 4.1, dim: true },
];

function Dashboard() {
  const [section, setSection] = useState<Section>("agent");
  const [reviewing, setReviewing] = useState<Worker | null>(null);
  const [notionStatus, setNotionStatus] = useState<NotionStatus>({ oauthReady: false, databaseReady: false, connected: false });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/notion/status");
        if (!response.ok) return;
        const payload = (await response.json()) as Partial<NotionStatus>;
        if (active) {
          setNotionStatus({
            oauthReady: Boolean(payload.oauthReady),
            databaseReady: Boolean(payload.databaseReady),
            connected: Boolean(payload.connected),
          });
        }
      } catch (error) {
        console.error("notion status error", error);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ background: "var(--dash-bg)", color: "var(--dash-ink)", fontFamily: "var(--font-sans)" }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div className="absolute -top-32 -right-20 size-[480px] rounded-full opacity-40" style={{ background: "var(--dash-blue-soft)" }} />
        <div className="absolute -bottom-40 -left-20 size-[520px] rounded-full opacity-50" style={{ background: "var(--dash-blue-soft)" }} />
      </div>

      <div className="relative mx-auto max-w-[1400px] grid grid-cols-12 gap-4 rounded-[28px] shadow-[0_30px_80px_-30px_rgba(60,80,180,0.25)] overflow-hidden"
           style={{ background: "var(--dash-surface)" }}>
        <Sidebar section={section} setSection={setSection} />
        <main className="col-span-12 md:col-span-7 p-6 md:p-8 min-h-[820px]">
          {section === "people" && <PeoplePanel onReview={setReviewing} />}
          {section === "agent" && <AgentPanel notionStatus={notionStatus} />}
          {section === "tasks" && <TasksPanel notionStatus={notionStatus} />}
          {section === "payroll" && <PayrollPanel />}
          {section === "token" && <TokenPanel />}
          {section === "admin" && <AdminPanel notionStatus={notionStatus} />}
        </main>
        <RightRail />
      </div>

      {reviewing && <ReviewDrawer worker={reviewing} onClose={() => setReviewing(null)} />}
    </div>
  );
}

function Sidebar({ section, setSection }: { section: Section; setSection: (s: Section) => void }) {
  const nav = [
    { id: "agent" as const, icon: Sparkles, label: "AI Agent" },
    { id: "people" as const, icon: Users, label: "People" },
    { id: "tasks" as const, icon: ListChecks, label: "Tasks · Notion" },
    { id: "payroll" as const, icon: Wallet, label: "Payroll" },
    { id: "token" as const, icon: Coins, label: "Token" },
    { id: "admin" as const, icon: ShieldCheck, label: "Admin onboarding" },
  ];
  return (
    <aside className="col-span-12 md:col-span-2 p-6 border-r" style={{ borderColor: "var(--dash-border)" }}>
      <Link to="/" className="font-serif-display text-2xl block mb-10" style={{ color: "var(--dash-blue)" }}>
        0cta<span style={{ color: "var(--dash-ink)" }}>Yee</span>
      </Link>
      <nav className="space-y-1">
        {nav.map(({ id, icon: Icon, label }) => {
          const active = id === section;
          return (
            <button
              key={label}
              onClick={() => setSection(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left"
              style={{
                background: active ? "var(--dash-blue-soft)" : "transparent",
                color: active ? "var(--dash-ink)" : "var(--dash-muted)",
                fontWeight: active ? 600 : 400,
              }}
            >
              <Icon className="size-4" /> {label}
            </button>
          );
        })}
        <Link to="/settings" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left"
              style={{ color: "var(--dash-muted)" }}>
          <Settings className="size-4" /> Settings
        </Link>
      </nav>

      <div className="mt-10 p-4 rounded-2xl" style={{ background: "var(--dash-blue-soft)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Flame className="size-4" style={{ color: "var(--dash-blue)" }} />
          <span className="text-xs font-semibold">Today's burn</span>
        </div>
        <p className="text-2xl font-bold" style={{ color: "var(--dash-blue)" }}>4,218</p>
        <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>$OCTA used by agents</p>
      </div>
    </aside>
  );
}

function PeoplePanel({ onReview }: { onReview: (w: Worker) => void }) {
  return (
    <>
      <Crumb label="Design Team" parent="People" />
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif-display text-4xl" style={{ fontWeight: 600 }}>Design Team</h1>
        <div className="flex items-center gap-3 rounded-full px-3 py-2 shadow-sm" style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}>
          <div className="flex -space-x-2">
            {[0,1,2].map(i => (
              <div key={i} className="size-7 rounded-full border-2" style={{ borderColor: "var(--dash-surface)", background: `oklch(0.${7+i} 0.1 ${260+i*20})` }} />
            ))}
          </div>
          <span className="text-sm font-medium pr-2">20</span>
        </div>
      </div>

      <div className="flex gap-3 mb-8">
        <div className="flex items-center gap-2 flex-1 rounded-full px-4 py-2.5 text-sm" style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)", color: "var(--dash-muted)" }}>
          <Search className="size-4" /> Search
        </div>
        <div className="flex items-center justify-between gap-2 w-48 rounded-full px-4 py-2.5 text-sm" style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)", color: "var(--dash-muted)" }}>
          Grade <ChevronDown className="size-4" />
        </div>
        <button className="size-10 grid place-items-center rounded-full" style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)", color: "var(--dash-muted)" }}>
          <SlidersHorizontal className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {team.map((p) => <PersonCard key={p.name} worker={p} onClick={() => onReview(p)} />)}
      </div>

      <p className="text-xs mt-6 text-center" style={{ color: "var(--dash-muted)" }}>
        Click a card to open agent review & task breakdown
      </p>
    </>
  );
}

function PersonCard({ worker, onClick }: { worker: Worker; onClick: () => void }) {
  const { name, role, projects, done, progress, productivity, dim } = worker;
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl p-5 transition-transform hover:-translate-y-0.5 cursor-pointer"
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
        boxShadow: "0 8px 24px -12px rgba(60,80,180,0.15)",
        opacity: dim ? 0.75 : 1,
      }}
    >
      <div className="flex justify-center mb-3">
        <div className="size-14 rounded-full" style={{ background: `linear-gradient(135deg, var(--dash-blue-soft), oklch(0.85 0.1 ${260 + name.length * 4}))` }} />
      </div>
      <p className="text-center text-sm font-semibold">{name}</p>
      <p className="text-center text-xs mb-4" style={{ color: "var(--dash-muted)" }}>{role}</p>

      <div className="grid grid-cols-3 gap-1 text-center">
        <Stat label="Projects" value={projects} />
        <Stat label="Done" value={done} />
        <Stat label="Progress" value={progress} />
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-[11px] mb-1.5" style={{ color: "var(--dash-muted)" }}>
          <span>Productivity:</span>
          <span style={{ color: "var(--dash-blue)", fontWeight: 600 }}>{productivity}%</span>
        </div>
        <div className="h-1 rounded-full" style={{ background: "var(--dash-blue-soft)" }}>
          <div className="h-full rounded-full" style={{ width: `${productivity}%`, background: "var(--dash-blue)" }} />
        </div>
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-[10px]" style={{ color: "var(--dash-muted)" }}>{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function Crumb({ label, parent }: { label: string; parent: string }) {
  return (
    <div className="flex items-center gap-2 text-xs mb-6 px-4 py-2.5 rounded-full"
         style={{ background: "var(--dash-blue-soft)", color: "var(--dash-muted)" }}>
      {parent} <ChevronRight className="size-3" /> <span style={{ color: "var(--dash-ink)" }}>{label}</span>
    </div>
  );
}

type Msg = { from: "you" | "agent"; text: string; meta?: string };

function AgentPanel({ notionStatus }: { notionStatus: NotionStatus }) {
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { from: "agent", text: "Morning Veya. I drafted Kevin's Q3 review and queued 3 onboarding tasks in Notion. Want me to proceed or revise?", meta: "Burned 18 $OCTA · 2 min ago" },
    { from: "you", text: "Proceed, but flag Lissa — productivity dropped 12% this week. Schedule a 1:1." },
    { from: "agent", text: "Done. 1:1 with Lissa booked Thursday 3pm, prep doc started in Notion. I'll monitor next 7 days and ping if no recovery.", meta: "Burned 7 $OCTA · just now" },
  ]);

  const send = () => {};
  /*
    if (!input.trim()) return;
    setMessages([
      ...messages,
      { from: "you", text: input },
      { from: "agent", text: `On it — running "${input.slice(0, 60)}${input.length > 60 ? "…" : ""}". Will route outputs to Notion and notify you.`, meta: `Burned ${Math.floor(Math.random() * 20 + 5)} $OCTA · just now` },
    ]);
    setInput("");
    // push task to Notion (or fallback to local JSON DB)
    (async () => {
      try {
        await notion.pushToNotion({ text: input });
        await jsonDb.pushTask({ text: input, createdAt: new Date().toISOString() });
      } catch (e) {
        console.error('task push error', e);
      }
    })();
  };
  */

  const runAgent = async () => {
    const message = input.trim();
    if (!message || isRunning) return;

    const nextMessages: Msg[] = [...messages, { from: "you", text: message }];
    setMessages(nextMessages);
    setInput("");
    setIsRunning(true);

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message,
          history: nextMessages.map((entry) => ({ from: entry.from, text: entry.text })),
        }),
      });

      const payload = await response.json();
      setMessages((current) => [
        ...current,
        {
          from: "agent",
          text: typeof payload.reply === "string" ? payload.reply : "The agent returned an unexpected response.",
          meta: typeof payload.meta === "string" ? payload.meta : undefined,
        },
      ]);
    } catch (e) {
      console.error("agent request error", e);
      setMessages((current) => [
        ...current,
        {
          from: "agent",
          text: `On it - running "${message.slice(0, 60)}${message.length > 60 ? "..." : ""}". I could not reach the live agent endpoint.`,
          meta: "Request failed before server processing",
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const quick = [
    "Hire a Senior Backend Engineer in Lisbon, €85k",
    "Run payroll for August with bonuses",
    "Review Kevin Kim's last 30 days",
    "Draft offboarding for Jaspal",
  ];

  return (
    <>
      <Crumb label="Conversation" parent="Agent" />
      <h1 className="font-serif-display text-4xl mb-2" style={{ fontWeight: 600 }}>What should 0cta do?</h1>
      <p className="text-sm mb-6" style={{ color: "var(--dash-muted)" }}>Plain text in. Hires, payroll, reviews and Notion updates out.</p>
      <p className="text-xs mb-4" style={{ color: "var(--dash-muted)" }}>
        Live mode uses <code>MOLTBOT_WEBHOOK_URL</code>. Notion logging is {notionStatus.connected ? "connected" : "not connected"}.
      </p>

      <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--dash-blue-soft)", border: "1px solid var(--dash-border)" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runAgent(); }}
          placeholder="e.g. Hire Maya Chen as Senior PM in Berlin, €78k, reports to me. Send offer, push to Notion, queue payroll."
          rows={3}
          className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder:opacity-50"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--dash-muted)" }}>
            <Flame className="size-3" /> est. burn ~{Math.max(5, Math.ceil(input.length / 20))} $OCTA · ⌘+Enter to send
          </div>
          <button
            onClick={runAgent}
            disabled={isRunning}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white"
            style={{ background: "var(--dash-blue)", opacity: isRunning ? 0.7 : 1 }}
          >
            <Send className="size-3.5" /> {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {quick.map((q) => (
          <button key={q} onClick={() => setInput(q)}
                  className="text-xs px-3 py-1.5 rounded-full hover:opacity-80"
                  style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)", color: "var(--dash-muted)" }}>
            {q}
          </button>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-3">Agent feedback</h3>
      <div className="space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.from === "you" ? "flex-row-reverse" : ""}`}>
            <div className="size-8 rounded-full grid place-items-center shrink-0 text-xs font-semibold"
                 style={{ background: m.from === "agent" ? "var(--dash-blue)" : "var(--dash-blue-soft)", color: m.from === "agent" ? "white" : "var(--dash-blue)" }}>
              {m.from === "agent" ? <Bot className="size-4" /> : "V"}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-3.5 text-sm ${m.from === "you" ? "text-white" : ""}`}
                 style={{
                   background: m.from === "you" ? "var(--dash-blue)" : "var(--dash-surface)",
                   border: m.from === "you" ? "none" : "1px solid var(--dash-border)",
                 }}>
              <p>{m.text}</p>
              {m.meta && <p className="text-[10px] mt-1.5 opacity-60">{m.meta}</p>}
              {m.from === "agent" && (
                <div className="flex gap-1.5 mt-2.5">
                  <button className="text-[10px] px-2 py-1 rounded-md" style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}>👍 Helpful</button>
                  <button className="text-[10px] px-2 py-1 rounded-md" style={{ background: "var(--dash-blue-soft)", color: "var(--dash-muted)" }}>↻ Revise</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AdminPanel({ notionStatus }: { notionStatus: NotionStatus }) {
  const steps = [
    { title: "Create admin workspace", detail: "Set up your HR home and invite the first team leads.", done: true },
    { title: "Connect Notion", detail: "Link Notion so 0cta can sync tasks, reviews, and hires.", done: notionStatus.connected },
    { title: "Configure $OCTA rules", detail: "Set burn policy, approvals, and payroll automation.", done: false },
    { title: "Enable wallet usage", detail: "Connect token payment and admin wallet approval flows.", done: true },
    { title: "Invite first admins", detail: "Add lead users and assign admin roles.", done: false },
  ];

  const connectNotion = () => {
    window.location.href = "/api/notion/start?redirect=/dashboard";
  };

  return (
    <>
      <Crumb label="Launch checklist" parent="Admin" />
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl p-6" style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif-display text-4xl" style={{ fontWeight: 600 }}>Admin onboarding</h1>
              <p className="text-sm mt-1" style={{ color: "var(--dash-muted)" }}>
                Walk through the first setup steps for your admin team, connect Notion, and enable token workflows.
                {!notionStatus.oauthReady ? " Add Notion env vars on Vercel before connecting." : ""}
              </p>
            </div>
            <button
              onClick={connectNotion}
              disabled={!notionStatus.oauthReady}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white"
              style={{ background: "var(--dash-blue)", opacity: notionStatus.oauthReady ? 1 : 0.6 }}
            >
              <ShieldCheck className="size-4" /> {notionStatus.connected ? "Reconnect Notion" : "Connect Notion"}
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {steps.map((step) => (
            <div key={step.title} className="rounded-2xl p-5 flex items-start gap-4" style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}>
              <div className="size-9 rounded-2xl grid place-items-center" style={{ background: step.done ? "var(--dash-blue-soft)" : "var(--dash-blue-soft)", color: step.done ? "var(--dash-blue)" : "var(--dash-muted)" }}>
                {step.done ? "✓" : "…"}
              </div>
              <div>
                <p className="font-semibold">{step.title}</p>
                <p className="text-sm mt-1" style={{ color: "var(--dash-muted)" }}>{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function TasksPanel({ notionStatus }: { notionStatus: NotionStatus }) {
  const cols = [
    { name: "Queued", color: "var(--dash-blue-soft)", tasks: [
      { t: "Onboard Maya Chen — kit + access", who: "Auto · 0cta", db: "People" },
      { t: "Q3 review prep — Kevin Kim", who: "Auto · 0cta", db: "Reviews" },
    ]},
    { name: "In Notion", color: "oklch(0.95 0.04 150)", tasks: [
      { t: "Offer letter — Senior Backend, Lisbon", who: "Synced 2m ago", db: "Hiring" },
      { t: "Payroll August — preview", who: "Synced 14m ago", db: "Payroll" },
      { t: "1:1 prep — Lissa Shulz", who: "Synced 1h ago", db: "Reviews" },
    ]},
    { name: "Done this week", color: "oklch(0.93 0.05 80)", tasks: [
      { t: "Onboarded 3 contractors", who: "Closed Mon", db: "People" },
      { t: "Generated 12 offer letters", who: "Closed Tue", db: "Hiring" },
    ]},
  ];

  const createTask = async () => {
    const text = window.prompt("Task to create");
    if (!text?.trim()) return;

    try {
      await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      window.alert("Task submitted.");
    } catch (error) {
      console.error("task create error", error);
      window.alert("Task request failed.");
    }
  };
  return (
    <>
      <Crumb label="Notion sync" parent="Tasks" />
      <div className="flex items-end justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="font-serif-display text-4xl" style={{ fontWeight: 600 }}>Tasks</h1>
          <p className="text-sm mt-1" style={{ color: "var(--dash-muted)" }}>Auto-pushed to Notion · workspace <span className="font-medium" style={{ color: "var(--dash-ink)" }}>0cta HR</span></p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: notionStatus.connected ? "oklch(0.95 0.04 150)" : "var(--dash-blue-soft)", color: notionStatus.connected ? "oklch(0.4 0.1 150)" : "var(--dash-muted)" }}>
            <span className={`size-1.5 rounded-full ${notionStatus.connected ? "bg-green-600" : "bg-amber-500"}`} /> {notionStatus.connected ? "Notion connected" : notionStatus.oauthReady ? "Notion auth ready" : "Notion not configured"}
          </span>
          <button
            onClick={() => { window.location.href = "/api/notion/start?redirect=/dashboard"; }}
            disabled={!notionStatus.oauthReady}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-white"
            style={{ background: "var(--dash-blue)", opacity: notionStatus.oauthReady ? 1 : 0.6 }}
          >
            <ShieldCheck className="size-3" /> Reconnect Notion
          </button>
          <button onClick={createTask} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-white" style={{ background: "var(--dash-blue)" }}>
            <Plus className="size-3" /> New task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {cols.map((c) => (
          <div key={c.name} className="rounded-2xl p-4" style={{ background: c.color }}>
            <p className="text-xs font-semibold mb-3">{c.name} <span className="opacity-50">· {c.tasks.length}</span></p>
            <div className="space-y-2">
              {c.tasks.map((task, i) => (
                <div key={i} className="rounded-xl p-3 text-xs" style={{ background: "var(--dash-surface)" }}>
                  <p className="font-medium mb-2">{task.t}</p>
                  <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--dash-muted)" }}>
                    <span>{task.who}</span>
                    <span className="px-1.5 py-0.5 rounded" style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}>{task.db}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PayrollPanel() {
  const total = team.reduce((s, t) => s + t.salary, 0);
  return (
    <>
      <Crumb label="August 2026" parent="Payroll" />
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-serif-display text-4xl" style={{ fontWeight: 600 }}>Payroll</h1>
          <p className="text-sm mt-1" style={{ color: "var(--dash-muted)" }}>EU deductions auto-applied · audit-ready SQL</p>
        </div>
        <button className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full text-white" style={{ background: "var(--dash-blue)" }}>
          Run payroll <ArrowUpRight className="size-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <KPI label="Gross monthly" value={`€${total.toLocaleString()}`} />
        <KPI label="Tax + social" value={`€${Math.round(total * 0.39).toLocaleString()}`} />
        <KPI label="Net payout" value={`€${Math.round(total * 0.61).toLocaleString()}`} highlight />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}>
        <div className="grid grid-cols-12 px-4 py-2.5 text-[11px] uppercase tracking-wider" style={{ color: "var(--dash-muted)", background: "var(--dash-blue-soft)" }}>
          <div className="col-span-4">Employee</div>
          <div className="col-span-2 text-right">Gross</div>
          <div className="col-span-2 text-right">Tax 28%</div>
          <div className="col-span-2 text-right">Social 11%</div>
          <div className="col-span-2 text-right">Net</div>
        </div>
        {team.map((w) => {
          const tax = Math.round(w.salary * 0.28);
          const soc = Math.round(w.salary * 0.11);
          return (
            <div key={w.name} className="grid grid-cols-12 px-4 py-3 text-sm border-t items-center" style={{ borderColor: "var(--dash-border)" }}>
              <div className="col-span-4 flex items-center gap-2">
                <div className="size-7 rounded-full" style={{ background: `linear-gradient(135deg, var(--dash-blue-soft), oklch(0.85 0.1 ${260 + w.name.length * 4}))` }} />
                <div>
                  <p className="font-medium">{w.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>{w.role}</p>
                </div>
              </div>
              <div className="col-span-2 text-right">€{w.salary.toLocaleString()}</div>
              <div className="col-span-2 text-right" style={{ color: "var(--dash-muted)" }}>–€{tax.toLocaleString()}</div>
              <div className="col-span-2 text-right" style={{ color: "var(--dash-muted)" }}>–€{soc.toLocaleString()}</div>
              <div className="col-span-2 text-right font-semibold" style={{ color: "var(--dash-blue)" }}>€{(w.salary - tax - soc).toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 text-xs" style={{ background: "var(--dash-blue-soft)" }}>
          <p className="font-semibold mb-1.5">Suggested query · audit August deductions</p>
          <code className="block text-[11px] p-2 rounded-lg" style={{ background: "var(--dash-surface)", color: "var(--dash-ink)" }}>
            SELECT employee, gross, tax, social, net FROM payroll WHERE month='2026-08' ORDER BY net DESC;
          </code>
        </div>
        <div className="rounded-2xl p-4 text-xs" style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}>
          <p className="font-semibold mb-2">Connections</p>
          <div className="space-y-1.5">
            <ConnRow label="Stripe Treasury" status="Connected" />
            <ConnRow label="Wise · payouts" status="Connected" />
            <ConnRow label="QuickBooks" status="Sync 6h" />
          </div>
        </div>
      </div>
    </>
  );
}

function ConnRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: "oklch(0.95 0.04 150)", color: "oklch(0.4 0.1 150)" }}>
        <span className="size-1 rounded-full bg-green-600" /> {status}
      </span>
    </div>
  );
}

function KPI({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: highlight ? "var(--dash-blue)" : "var(--dash-surface)", color: highlight ? "white" : "var(--dash-ink)", border: highlight ? "none" : "1px solid var(--dash-border)" }}>
      <p className="text-[11px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function TokenPanel() {
  const activity = [
    { who: "Hiring agent", action: "Draft offer letter · Maya Chen", burn: 12, time: "2m" },
    { who: "Payroll agent", action: "Compute August deductions", burn: 28, time: "14m" },
    { who: "Review agent", action: "Generate Q3 review · Kevin", burn: 18, time: "1h" },
    { who: "Notion sync", action: "Push 4 tasks to People DB", burn: 4, time: "1h" },
    { who: "Hiring agent", action: "Screen 38 candidates", burn: 84, time: "3h" },
  ];
  return (
    <>
      <Crumb label="$OCTA wallet" parent="Token" />
      <h1 className="font-serif-display text-4xl mb-1" style={{ fontWeight: 600 }}>Token usage</h1>
      <p className="text-sm mb-6" style={{ color: "var(--dash-muted)" }}>Bots burn $OCTA on every action. Top up to keep agents running.</p>

      <div className="rounded-3xl p-6 mb-4 text-white" style={{ background: "linear-gradient(135deg, var(--dash-blue), oklch(0.45 0.18 280))" }}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs opacity-70 mb-1">Balance</p>
            <p className="font-serif-display text-5xl" style={{ fontWeight: 500 }}>128,540</p>
            <p className="text-xs opacity-70 mt-1">$OCTA · ≈ $1,285 USD</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
            <Sparkles className="size-3 inline mr-1" /> Early SBT · +5% fee share
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div><p className="opacity-60">Burned today</p><p className="text-lg font-bold mt-0.5">4,218</p></div>
          <div><p className="opacity-60">Burned 30d</p><p className="text-lg font-bold mt-0.5">62,140</p></div>
          <div><p className="opacity-60">Earned (PRs + SBT)</p><p className="text-lg font-bold mt-0.5">+8,400</p></div>
        </div>
        <div className="flex gap-2 mt-6">
          <Link to="/buy" className="flex-1 rounded-full bg-white text-sm py-2.5 font-medium text-center" style={{ color: "var(--dash-blue)" }}>Top up</Link>
          <button disabled className="flex-1 rounded-full text-sm py-2.5 font-medium opacity-70 cursor-not-allowed" style={{ background: "rgba(255,255,255,0.15)" }}>Claim rewards soon</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <BotStat name="Hiring agent" calls={142} burn={1840} />
        <BotStat name="Payroll agent" calls={38} burn={1064} />
        <BotStat name="Review agent" calls={61} burn={912} />
        <BotStat name="Notion sync" calls={208} burn={402} />
      </div>

      <h3 className="text-sm font-semibold mb-3">Recent burn activity</h3>
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}>
        {activity.map((a, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm" style={{ borderTop: i ? "1px solid var(--dash-border)" : "none" }}>
            <div className="size-8 rounded-full grid place-items-center shrink-0" style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}>
              <Bot className="size-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{a.action}</p>
              <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>{a.who} · {a.time} ago</p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--dash-blue)" }}>
              <Flame className="size-3" /> {a.burn}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function BotStat({ name, calls, burn }: { name: string; calls: number; burn: number }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="size-7 rounded-full grid place-items-center" style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}>
          <Bot className="size-3.5" />
        </div>
        <p className="text-sm font-medium">{name}</p>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>Calls today</p>
          <p className="text-xl font-bold">{calls}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>Burned</p>
          <p className="text-xl font-bold" style={{ color: "var(--dash-blue)" }}>{burn}</p>
        </div>
      </div>
    </div>
  );
}

function ReviewDrawer({ worker, onClose }: { worker: Worker; onClose: () => void }) {
  const tasks = [
    { t: "Redesign onboarding flow", status: "Shipped", pct: 100 },
    { t: "Component library v2", status: "In review", pct: 80 },
    { t: "Mobile checkout audit", status: "In progress", pct: 45 },
    { t: "Brand refresh proposal", status: "Blocked", pct: 20 },
  ];

  const sendReview = async () => {
    const text = `${worker.name} review: productivity ${worker.productivity}%, rating ${worker.rating}, tasks this week ${worker.tasksThisWeek}.`;
    try {
      await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: `${worker.name} review`, text }),
      });
      window.alert("Review submitted.");
    } catch (error) {
      console.error("review submit error", error);
      window.alert("Review request failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(20,30,80,0.35)" }} onClick={onClose}>
      <div className="w-full max-w-[480px] h-full overflow-y-auto p-6" style={{ background: "var(--dash-surface)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="size-14 rounded-full" style={{ background: `linear-gradient(135deg, var(--dash-blue-soft), oklch(0.85 0.1 ${260 + worker.name.length * 4}))` }} />
            <div>
              <h2 className="font-serif-display text-2xl">{worker.name}</h2>
              <p className="text-xs" style={{ color: "var(--dash-muted)" }}>{worker.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="size-8 rounded-full grid place-items-center" style={{ background: "var(--dash-blue-soft)" }}><X className="size-4" /></button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <KPI label="Productivity" value={`${worker.productivity}%`} />
          <KPI label="Tasks/wk" value={String(worker.tasksThisWeek)} />
          <KPI label="Rating" value={`${worker.rating}★`} />
        </div>

        <h3 className="text-sm font-semibold mb-3">Current tasks</h3>
        <div className="space-y-2 mb-6">
          {tasks.map((t) => (
            <div key={t.t} className="rounded-xl p-3" style={{ background: "var(--dash-blue-soft)" }}>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">{t.t}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--dash-surface)", color: "var(--dash-muted)" }}>{t.status}</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: "var(--dash-surface)" }}>
                <div className="h-full rounded-full" style={{ width: `${t.pct}%`, background: "var(--dash-blue)" }} />
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold mb-3">Agent review · last 30 days</h3>
        <div className="rounded-xl p-4 text-sm mb-4" style={{ background: "var(--dash-blue-soft)" }}>
          <p className="mb-2"><span className="font-semibold">0cta says:</span> {worker.name.split(" ")[0]} is tracking <span style={{ color: "var(--dash-blue)" }}>{worker.productivity >= 70 ? "above target" : "below target"}</span>. {worker.productivity >= 70 ? "Strong shipping cadence, low review friction." : "Consider scoping smaller tasks and a weekly 1:1."}</p>
          <p className="text-[11px] opacity-70">Generated by Review agent · burned 14 $OCTA</p>
        </div>

        <div className="flex gap-2">
          <button onClick={sendReview} className="flex-1 rounded-full py-2.5 text-sm text-white font-medium" style={{ background: "var(--dash-blue)" }}>Send review to Notion</button>
          <button onClick={() => window.alert(`Schedule a 1:1 with ${worker.name} from your calendar workflow.`)} className="rounded-full py-2.5 px-4 text-sm" style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}>1:1</button>
        </div>
      </div>
    </div>
  );
}

function RightRail() {
  const radius = 60;
  const c = 2 * Math.PI * radius;
  const pct = 75;
  return (
    <aside className="col-span-12 md:col-span-3 p-6 border-l" style={{ borderColor: "var(--dash-border)" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="size-11 rounded-full" style={{ background: "linear-gradient(135deg, var(--dash-blue-soft), var(--dash-blue))" }} />
        <div className="flex-1">
          <p className="text-sm font-semibold">Veya Sung</p>
          <p className="text-xs" style={{ color: "var(--dash-muted)" }}>Art Director · admin</p>
        </div>
        <button className="size-8 rounded-full grid place-items-center" style={{ background: "var(--dash-blue-soft)", color: "var(--dash-muted)" }}>
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <div className="rounded-2xl p-4 mb-6 text-white" style={{ background: "linear-gradient(135deg, var(--dash-blue), oklch(0.45 0.18 280))" }}>
        <div className="flex justify-between items-center mb-2">
          <p className="text-[11px] opacity-70">$OCTA balance</p>
          <Coins className="size-3.5 opacity-70" />
        </div>
        <p className="font-serif-display text-3xl" style={{ fontWeight: 500 }}>128,540</p>
        <div className="flex justify-between text-[11px] mt-2 opacity-80">
          <span><Flame className="size-2.5 inline" /> 4,218 burned today</span>
          <span><TrendingUp className="size-2.5 inline" /> +6%</span>
        </div>
      </div>

      <h3 className="text-sm font-semibold mb-3">Team productivity</h3>
      <div className="relative grid place-items-center mb-6">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--dash-blue-soft)" strokeWidth="10" />
          <circle
            cx="80" cy="80" r={radius} fill="none" stroke="var(--dash-blue)" strokeWidth="10"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} strokeLinecap="round"
            transform="rotate(-90 80 80)"
          />
        </svg>
        <div className="absolute text-center">
          <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>This week</p>
          <p className="text-3xl font-bold" style={{ color: "var(--dash-blue)" }}>{pct}%</p>
          <p className="text-[10px]" style={{ color: "var(--dash-muted)" }}>+20% ↑</p>
        </div>
      </div>

      <h3 className="text-sm font-semibold mb-3">Agent activity</h3>
      <div className="space-y-2">
        <Activity icon={<Mail className="size-3.5" />} title="Offer sent · Maya Chen" sub="2 min · 12 $OCTA" tint="oklch(0.95 0.04 80)" />
        <Activity icon={<FileText className="size-3.5" />} title="Notion · 3 tasks queued" sub="14 min · 4 $OCTA" tint="oklch(0.95 0.04 150)" />
        <Activity icon={<CheckCircle2 className="size-3.5" />} title="Q3 review · Kevin K." sub="1 hr · 18 $OCTA" tint="var(--dash-blue-soft)" />
      </div>
    </aside>
  );
}

function Activity({ icon, title, sub, tint }: { icon: React.ReactNode; title: string; sub: string; tint: string }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: tint }}>
      <div className="size-7 rounded-full grid place-items-center" style={{ background: "var(--dash-surface)", color: "var(--dash-blue)" }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{title}</p>
        <p className="text-[10px]" style={{ color: "var(--dash-muted)" }}>{sub}</p>
      </div>
    </div>
  );
}
