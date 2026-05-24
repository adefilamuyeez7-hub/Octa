import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback, useRef, memo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "../lib/supabaseClient";
import {
  Users,
  ListChecks,
  Wallet,
  Coins,
  Settings,
  Search,
  ChevronRight,
  MoreHorizontal,
  ChevronDown,
  SlidersHorizontal,
  Send,
  Sparkles,
  Mail,
  FileText,
  CheckCircle2,
  Flame,
  Bot,
  ArrowUpRight,
  X,
  TrendingUp,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { appRepository, type AppUserRecord, type TaskRecord } from "../lib/storage";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "0cta — Dashboard" }] }),
});

type Section = "people" | "agent" | "tasks" | "payroll" | "token" | "admin";
type NotionStatus = { oauthReady: boolean; databaseReady: boolean; connected: boolean };

type Worker = {
  name: string;
  role: string;
  projects: number;
  done: number;
  progress: number;
  productivity: number;
  dim?: boolean;
  salary: number;
  tasksThisWeek: number;
  rating: number;
};

function numberFromRecord(record: AppUserRecord, key: string, fallback: number): number {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function userToWorker(user: AppUserRecord, tasks: TaskRecord[]): Worker {
  const userTasks = tasks.filter(
    (task) => task.userId === user.id || task.assigneeId === user.id || task.assignee === user.name,
  );
  const done = userTasks.filter(
    (task) => task.status === "done" || task.status === "completed",
  ).length;
  const projects = Math.max(userTasks.length, numberFromRecord(user, "projects", 0));
  const progress = Math.max(projects - done, 0);
  const productivity =
    projects > 0 ? Math.round((done / projects) * 100) : numberFromRecord(user, "productivity", 0);

  return {
    name: user.name,
    role: user.role ?? "Team member",
    projects,
    done,
    progress,
    productivity,
    salary: numberFromRecord(user, "salary", 0),
    tasksThisWeek: userTasks.length,
    rating: numberFromRecord(user, "rating", 0),
  };
}

function taskTitle(task: TaskRecord): string {
  return task.title || task.text || task.type.replace(/_/g, " ");
}

function Dashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userFeatures, setUserFeatures] = useState({ chatEnabled: true, tasksEnabled: true });
  
  const [section, setSection] = useState<Section>("agent");
  const [reviewing, setReviewing] = useState<Worker | null>(null);
  const [notionStatus, setNotionStatus] = useState<NotionStatus>({
    oauthReady: false,
    databaseReady: false,
    connected: false,
  });
  const [users, setUsers] = useState<AppUserRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; username: string; role?: string; avatar_url?: string } | null>(null);

  const refreshData = useCallback(async () => {
    const db = await appRepository.readDb();
    setUsers(db.users);
    setTasks(db.tasks);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate({ to: "/login" });
          return;
        }

        const s = await appRepository.getSettings();
        
        const userMeta = session.user.user_metadata || {};
        const adminEmails = ["admin@admin.com", "dexter@0cta.com"];
        const isInitialAdmin = session.user.email && adminEmails.includes(session.user.email);
        const currentAdminWallets = s.adminWallets || [];
        const isWalletAdmin = userMeta.wallet_address && currentAdminWallets.includes(userMeta.wallet_address);
        
        const adminMode = isInitialAdmin || isWalletAdmin;
        setIsAdmin(adminMode);

        setCurrentUser({
          name: userMeta.first_name ? `${userMeta.first_name} ${userMeta.last_name}` : "User",
          username: userMeta.username || session.user.email?.split("@")[0] || "user",
          role: adminMode ? "Admin workspace" : "User workspace",
          avatar_url: userMeta.avatar_url
        });
        
        if (!adminMode && s.userFeatures) {
          setUserFeatures(s.userFeatures);
        }

        const db = await appRepository.readDb();
        if (active) {
          setUsers(db.users);
          setTasks(db.tasks);
          
          if (!adminMode) {
             // force section to allowed
             if (s.userFeatures?.chatEnabled) setSection("agent");
             else if (s.userFeatures?.tasksEnabled) setSection("tasks");
          }
        }

        try {
          const response = await fetch("/api/notion/status");
          if (response.ok) {
            const payload = (await response.json()) as Partial<NotionStatus>;
            if (active) {
              setNotionStatus({
                oauthReady: Boolean(payload.oauthReady),
                databaseReady: Boolean(payload.databaseReady),
                connected: Boolean(payload.connected),
              });
            }
          }
        } catch {
          // Notion status unavailable in dev — silently ignored
        }
      } catch (error) {
        console.error("dashboard init error", error);
      }
    })();

    return () => {
      active = false;
    };
  }, [navigate]);

  const team = useMemo(() => users.map((user) => userToWorker(user, tasks)), [users, tasks]);

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{
        background: "var(--dash-bg)",
        color: "var(--dash-ink)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div
          className="absolute -top-32 -right-20 size-[480px] rounded-full opacity-40"
          style={{ background: "var(--dash-blue-soft)" }}
        />
        <div
          className="absolute -bottom-40 -left-20 size-[520px] rounded-full opacity-50"
          style={{ background: "var(--dash-blue-soft)" }}
        />
      </div>

      <div
        className="relative mx-auto max-w-[1400px] grid grid-cols-12 gap-4 rounded-[28px] shadow-[0_30px_80px_-30px_rgba(60,80,180,0.25)] overflow-hidden"
        style={{ background: "var(--dash-surface)" }}
      >
        {/* Mobile: Sidebar as offcanvas toggle */}
        <div
          className="md:hidden col-span-12 flex flex-wrap items-center justify-between p-4 border-b gap-2"
          style={{ borderColor: "var(--dash-border)" }}
        >
          <h2 className="font-serif-display text-xl w-full">0cta</h2>
          <div className="flex gap-2 w-full overflow-x-auto pb-1">
            {(isAdmin || userFeatures.chatEnabled) && (
              <button
                onClick={() => setSection("agent")}
                className="px-3 py-1 text-sm rounded whitespace-nowrap"
                style={{
                  background: section === "agent" ? "var(--dash-blue)" : "transparent",
                  color: section === "agent" ? "white" : "var(--dash-muted)",
                }}
              >
                Chat
              </button>
            )}
            {(isAdmin || userFeatures.tasksEnabled) && (
              <button
                onClick={() => setSection("tasks")}
                className="px-3 py-1 text-sm rounded whitespace-nowrap"
                style={{
                  background: section === "tasks" ? "var(--dash-blue)" : "transparent",
                  color: section === "tasks" ? "white" : "var(--dash-muted)",
                }}
              >
                Tasks
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setSection("people")}
                className="px-3 py-1 text-sm rounded whitespace-nowrap"
                style={{
                  background: section === "people" ? "var(--dash-blue)" : "transparent",
                  color: section === "people" ? "white" : "var(--dash-muted)",
                }}
              >
                People
              </button>
            )}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <Sidebar 
          section={section} 
          setSection={setSection} 
          tasks={tasks} 
          isAdmin={isAdmin}
          userFeatures={userFeatures}
        />

        {/* Main content - Agent chat is primary on mobile */}
        <main
          className={`col-span-12 ${section === "agent" ? "md:col-span-7" : "hidden md:block md:col-span-7"} p-4 md:p-8 min-h-[820px] min-w-0`}
        >
          {section === "agent" && (isAdmin || userFeatures.chatEnabled) && <AgentPanel notionStatus={notionStatus} onDataChange={refreshData} />}
          {section === "tasks" && (isAdmin || userFeatures.tasksEnabled) && (
            <TasksPanel notionStatus={notionStatus} tasks={tasks} onDataChange={refreshData} />
          )}
          {section === "people" && isAdmin && <PeoplePanel team={team} onReview={setReviewing} />}
          {section === "payroll" && isAdmin && <PayrollPanel team={team} />}
          {section === "token" && isAdmin && <TokenPanel tasks={tasks} />}
          {section === "admin" && isAdmin && (
            <AdminPanel
              notionStatus={notionStatus}
              tasks={tasks}
              users={users}
              onDataChange={refreshData}
            />
          )}
        </main>

        {/* Right rail hidden on mobile */}
        <RightRail team={team} tasks={tasks} isAdmin={isAdmin} currentUser={currentUser} />
      </div>

      {reviewing && isAdmin && (
        <ReviewDrawer worker={reviewing} tasks={tasks} onClose={() => setReviewing(null)} />
      )}
    </div>
  );
}

function Sidebar({
  section,
  setSection,
  tasks,
  isAdmin,
  userFeatures
}: {
  section: Section;
  setSection: (s: Section) => void;
  tasks: TaskRecord[];
  isAdmin: boolean;
  userFeatures: { chatEnabled: boolean; tasksEnabled: boolean; };
}) {
  const burnedToday = useMemo(
    () =>
      tasks.filter((task) => task.type.includes("agent") || task.type.includes("notion")).length,
    [tasks],
  );
  
  const nav = [
    { id: "agent" as const, icon: Sparkles, label: "AI Agent", show: isAdmin || userFeatures.chatEnabled },
    { id: "people" as const, icon: Users, label: "People", show: isAdmin },
    { id: "tasks" as const, icon: ListChecks, label: "Tasks · Notion", show: isAdmin || userFeatures.tasksEnabled },
    { id: "payroll" as const, icon: Wallet, label: "Payroll", show: isAdmin },
    { id: "token" as const, icon: Coins, label: "Token", show: isAdmin },
    { id: "admin" as const, icon: ShieldCheck, label: "Admin onboarding", show: isAdmin },
  ].filter(n => n.show);

  return (
    <aside
      className="hidden md:block min-w-0 col-span-12 md:col-span-2 p-6 border-r"
      style={{ borderColor: "var(--dash-border)" }}
    >
      <Link
        to="/"
        className="font-serif-display text-2xl block mb-10"
        style={{ color: "var(--dash-blue)" }}
      >
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
        <Link
          to="/settings"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left"
          style={{ color: "var(--dash-muted)" }}
        >
          <Settings className="size-4" /> Settings
        </Link>
      </nav>

      <div className="mt-10 p-4 rounded-2xl" style={{ background: "var(--dash-blue-soft)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Flame className="size-4" style={{ color: "var(--dash-blue)" }} />
          <span className="text-xs font-semibold">Today's burn</span>
        </div>
        <p className="text-2xl font-bold" style={{ color: "var(--dash-blue)" }}>
          {burnedToday}
        </p>
        <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
          agent actions logged
        </p>
      </div>
    </aside>
  );
}

function PeoplePanel({ team, onReview }: { team: Worker[]; onReview: (w: Worker) => void }) {
  return (
    <>
      <Crumb label="Team" parent="People" />
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif-display text-4xl" style={{ fontWeight: 600 }}>
          People
        </h1>
        <div
          className="flex items-center gap-3 rounded-full px-3 py-2 shadow-sm"
          style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}
        >
          <div className="flex -space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="size-7 rounded-full border-2"
                style={{
                  borderColor: "var(--dash-surface)",
                  background: `oklch(0.${7 + i} 0.1 ${260 + i * 20})`,
                }}
              />
            ))}
          </div>
          <span className="text-sm font-medium pr-2">{team.length}</span>
        </div>
      </div>

      <div className="flex gap-3 mb-8">
        <div
          className="flex items-center gap-2 flex-1 rounded-full px-4 py-2.5 text-sm"
          style={{
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            color: "var(--dash-muted)",
          }}
        >
          <Search className="size-4" /> Search
        </div>
        <div
          className="flex items-center justify-between gap-2 w-48 rounded-full px-4 py-2.5 text-sm"
          style={{
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            color: "var(--dash-muted)",
          }}
        >
          Grade <ChevronDown className="size-4" />
        </div>
        <button
          className="size-10 grid place-items-center rounded-full"
          style={{
            background: "var(--dash-surface)",
            border: "1px solid var(--dash-border)",
            color: "var(--dash-muted)",
          }}
        >
          <SlidersHorizontal className="size-4" />
        </button>
      </div>

      {team.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {team.map((p) => (
              <PersonCard key={p.name} worker={p} onClick={() => onReview(p)} />
            ))}
          </div>

          <p className="text-xs mt-6 text-center" style={{ color: "var(--dash-muted)" }}>
            Click a card to open agent review & task breakdown
          </p>
        </>
      ) : (
        <EmptyState
          title="No people yet"
          detail="Add users through the local data repository or connect a people source before this panel shows team metrics."
        />
      )}
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
        <div
          className="size-14 rounded-full"
          style={{
            background: `linear-gradient(135deg, var(--dash-blue-soft), oklch(0.85 0.1 ${260 + name.length * 4}))`,
          }}
        />
      </div>
      <p className="text-center text-sm font-semibold">{name}</p>
      <p className="text-center text-xs mb-4" style={{ color: "var(--dash-muted)" }}>
        {role}
      </p>

      <div className="grid grid-cols-3 gap-1 text-center">
        <Stat label="Projects" value={projects} />
        <Stat label="Done" value={done} />
        <Stat label="Progress" value={progress} />
      </div>

      <div className="mt-4">
        <div
          className="flex justify-between text-[11px] mb-1.5"
          style={{ color: "var(--dash-muted)" }}
        >
          <span>Productivity:</span>
          <span style={{ color: "var(--dash-blue)", fontWeight: 600 }}>{productivity}%</span>
        </div>
        <div className="h-1 rounded-full" style={{ background: "var(--dash-blue-soft)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${productivity}%`, background: "var(--dash-blue)" }}
          />
        </div>
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-[10px]" style={{ color: "var(--dash-muted)" }}>
        {label}
      </div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div
      className="rounded-2xl p-6 text-sm"
      style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1" style={{ color: "var(--dash-muted)" }}>
        {detail}
      </p>
    </div>
  );
}

function Crumb({ label, parent }: { label: string; parent: string }) {
  return (
    <div
      className="flex items-center gap-2 text-xs mb-6 px-4 py-2.5 rounded-full"
      style={{ background: "var(--dash-blue-soft)", color: "var(--dash-muted)" }}
    >
      {parent} <ChevronRight className="size-3" />{" "}
      <span style={{ color: "var(--dash-ink)" }}>{label}</span>
    </div>
  );
}

type Msg = { from: "you" | "agent"; text: string; meta?: string };

async function createTaskViaApi({
  title,
  text,
  type,
  via,
}: {
  title?: string;
  text: string;
  type: string;
  via?: string;
}) {
  const response = await fetch("/api/tasks/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, text, type, via }),
  });

  if (!response.ok) {
    throw new Error(`Task API failed with status ${response.status}`);
  }

  await appRepository.appendTask({
    type,
    title: title?.trim() || text.trim().slice(0, 80),
    text: text.trim(),
    via: via ?? "api-task",
    createdAt: new Date().toISOString(),
  });

  return response.json();
}

const AgentMessages = memo(function AgentMessages({ messages }: { messages: Msg[] }) {
  return (
    <div className="space-y-3">
      {messages.map((m, i) => (
        <div key={i} className={`flex gap-3 ${m.from === "you" ? "flex-row-reverse" : ""}`}>
          <div
            className="size-8 rounded-full grid place-items-center shrink-0 text-xs font-semibold"
            style={{
              background: m.from === "agent" ? "var(--dash-blue)" : "var(--dash-blue-soft)",
              color: m.from === "agent" ? "white" : "var(--dash-blue)",
            }}
          >
            {m.from === "agent" ? <Bot className="size-4" /> : "V"}
          </div>
          <div
            className={`max-w-[80%] rounded-2xl p-3.5 text-sm ${m.from === "you" ? "text-white" : ""}`}
            style={{
              background: m.from === "you" ? "var(--dash-blue)" : "var(--dash-surface)",
              border: m.from === "you" ? "none" : "1px solid var(--dash-border)",
            }}
          >
            <p>{m.text}</p>
            {m.meta && <p className="text-[10px] mt-1.5 opacity-60">{m.meta}</p>}
            {m.from === "agent" && (
              <div className="flex gap-1.5 mt-2.5">
                <button
                  type="button"
                  className="text-[10px] px-2 py-1 rounded-md"
                  style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}
                >
                  Helpful
                </button>
                <button
                  type="button"
                  className="text-[10px] px-2 py-1 rounded-md"
                  style={{ background: "var(--dash-blue-soft)", color: "var(--dash-muted)" }}
                >
                  Revise
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

// Static — defined outside so it's never recreated between renders
const QUICK_SUGGESTIONS = [
  "Create onboarding tasks for a new hire",
  "Run payroll review for this month",
  "Draft a performance review",
  "Prepare an offboarding checklist",
];

const AgentComposer = memo(function AgentComposer({
  isRunning,
  onSubmit,
}: {
  isRunning: boolean;
  onSubmit: (message: string) => Promise<void>;
}) {
  const [input, setInput] = useState("");
  // Derive from input.length — lightweight, no memoisation overhead needed
  const actionEstimate = Math.max(1, Math.ceil(input.length / 80));

  const submit = useCallback(async () => {
    const message = input.trim();
    if (!message || isRunning) return;
    setInput("");
    await onSubmit(message);
  }, [input, isRunning, onSubmit]);

  return (
    <>
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: "var(--dash-blue-soft)", border: "1px solid var(--dash-border)" }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="e.g. Create onboarding tasks for a new product manager, push the checklist to Notion, and queue payroll setup."
            rows={3}
            disabled={isRunning}
            className="w-full bg-transparent text-sm resize-y focus:outline-none placeholder:opacity-50"
          />
          <div className="flex items-center justify-between mt-2 gap-3">
            <div
              className="flex items-center gap-2 text-[11px]"
              style={{ color: "var(--dash-muted)" }}
            >
              <Flame className="size-3" /> est. actions ~{actionEstimate} · Ctrl/Command+Enter to
              send
            </div>
            <button
              type="submit"
              disabled={isRunning || !input.trim()}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white"
              style={{
                background: "var(--dash-blue)",
                opacity: isRunning || !input.trim() ? 0.7 : 1,
              }}
            >
              <Send className="size-3.5" /> {isRunning ? "Running..." : "Run"}
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {QUICK_SUGGESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setInput(q)}
            className="text-xs px-3 py-1.5 rounded-full hover:opacity-80"
            style={{
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
              color: "var(--dash-muted)",
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </>
  );
});

function AgentDisabled() {
  return (
    <>
      <Crumb label="Conversation" parent="Agent" />
      <h1 className="font-serif-display text-4xl mb-2" style={{ fontWeight: 600 }}>
        AI Agent
      </h1>
      <div
        className="mt-6 rounded-2xl p-8 text-center"
        style={{ background: "var(--dash-blue-soft)", border: "1px solid var(--dash-border)" }}
      >
        <Bot className="size-10 mx-auto mb-4" style={{ color: "var(--dash-blue)", opacity: 0.5 }} />
        <p className="text-sm font-semibold mb-1">Agent temporarily disabled</p>
        <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
          The AI chat interface is paused. Other dashboard sections are fully available.
        </p>
      </div>
    </>
  );
}

const AgentPanel = memo(function AgentPanelImpl({
  notionStatus,
  onDataChange,
}: {
  notionStatus: NotionStatus;
  onDataChange: () => Promise<void>;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "agent",
      text: "Tell me the HR workflow you want handled. I can log the request locally and sync to Notion when connected.",
      meta: "Ready",
    },
  ]);

  // Use a ref so runAgent can always read the latest messages without
  // being listed as a dependency — prevents a new function ref on every
  // message which would break AgentComposer's memo and cause input lag.
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const runAgent = useCallback(
    async (message: string) => {
      if (isRunning) return;

      const nextMessages: Msg[] = [...messagesRef.current, { from: "you", text: message }];
      setMessages(nextMessages);
      setIsRunning(true);

      // 1. Immediately log request locally so it's visible right away
      try {
        const lower = message.toLowerCase();

        // Local client-side mutations — fire before hitting the server
        if (lower.includes("hire") || lower.includes("add user") || lower.includes("onboard")) {
          const nameMatch = message.match(/(?:hire|onboard|add)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/);
          const roleMatch = message.match(/\bas\s+([a-zA-Z][a-zA-Z\s]{1,40}?)(?:\s+with|\s+salary|\s+for|\s+at|\.|$)/i);
          const salaryMatch = message.match(/salary\s*[:\s]*\$?€?(\d{3,6})/i);

          const name = nameMatch ? nameMatch[1].trim() : "New Team Member";
          const role = roleMatch ? roleMatch[1].trim() : "Software Engineer";
          const salary = salaryMatch ? parseInt(salaryMatch[1], 10) : 4500;

          await appRepository.saveUser({
            id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name,
            role,
            salary,
            projects: Math.floor(Math.random() * 4) + 1,
            productivity: Math.floor(Math.random() * 30) + 70,
            rating: Math.floor(Math.random() * 2) + 4,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          await appRepository.appendTask({
            type: "agent_action",
            title: `Hired ${name}`,
            text: `Successfully hired ${name} as ${role} with salary €${salary}.`,
            via: "agent",
            createdAt: new Date().toISOString(),
          });
        } else if (lower.includes("payroll") || lower.includes("pay review")) {
          await appRepository.appendTask({
            type: "payroll_task",
            title: "Process monthly payroll",
            text: "Payroll calculated and processed for all active team members.",
            via: "agent",
            createdAt: new Date().toISOString(),
          });
        } else if (lower.includes("review") || lower.includes("performance")) {
          const nameMatch = message.match(/(?:for|of)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/);
          const name = nameMatch ? nameMatch[1].trim() : "Team Member";
          await appRepository.appendTask({
            type: "review_task",
            title: `Performance review for ${name}`,
            text: `Assembled performance summary and feedback for ${name}.`,
            via: "agent",
            createdAt: new Date().toISOString(),
          });
        } else if (lower.includes("task") || lower.includes("todo") || lower.includes("checklist")) {
          await appRepository.appendTask({
            type: "manual_task",
            title: message.slice(0, 80) || "Agent-assigned task",
            text: message,
            via: "agent",
            createdAt: new Date().toISOString(),
          });
        } else if (lower.includes("fire") || lower.includes("offboard") || lower.includes("remove user")) {
          const nameMatch = message.match(/(?:fire|offboard|remove)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/);
          if (nameMatch) {
            const name = nameMatch[1].trim();
            const db = await appRepository.readDb();
            const target = db.users.find((u) => u.name.toLowerCase() === name.toLowerCase());
            if (target) {
              db.users = db.users.filter((u) => u.id !== target.id);
              await appRepository.writeDb(db);
              await appRepository.appendTask({
                type: "agent_action",
                title: `Offboarded ${name}`,
                text: `Successfully offboarded ${name}.`,
                via: "agent",
                createdAt: new Date().toISOString(),
              });
            }
          }
        } else {
          // Generic request log
          await appRepository.appendTask({
            type: "agent_request",
            title: message.slice(0, 80),
            text: message,
            via: "agent",
            createdAt: new Date().toISOString(),
          });
        }

        // Refresh dashboard state immediately after local writes
        await onDataChange();
      } catch (localErr) {
        console.error("local action error", localErr);
      }

      // 2. Try AI — call server endpoint for secure provider handling
      try {
        const response = await fetch("/api/agent/run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message,
            provider: llmProvider === "local" ? undefined : llmProvider,
            history: nextMessages.map((m) => ({ from: m.from, text: m.text })),
          }),
        });

        if (response.ok) {
          const result = (await response.json()) as { reply: string; meta: string; live: boolean };
          
          setMessages((current) => [
            ...current,
            { from: "agent", text: result.reply, meta: result.meta },
          ]);

          await appRepository.appendTask({
            type: "agent_response",
            title: "Agent response",
            text: result.reply,
            via: result.live ? "agent-live" : "agent-local",
            createdAt: new Date().toISOString(),
          });
          await onDataChange();
        } else {
          console.error("Agent API error", await response.text());
          setMessages((current) => [
            ...current,
            {
              from: "agent",
              text: `Got it — I've logged "${message.slice(0, 60)}${message.length > 60 ? "..." : ""}" locally. All local actions were applied.`,
              meta: "Local mode",
            },
          ]);
        }
      } catch (e) {
        console.error("agent error", e);
        setMessages((current) => [
          ...current,
          {
            from: "agent",
            text: `Got it — I've logged "${message.slice(0, 60)}${message.length > 60 ? "..." : ""}" locally. All local actions were applied.`,
            meta: "Local mode",
          },
        ]);
      } finally {
        setIsRunning(false);
      }
    },
    // isRunning only — messages read via ref so this function is stable
    [isRunning, onDataChange],
  );

  return (
    <>
      <Crumb label="Conversation" parent="Agent" />
      <h1 className="font-serif-display text-4xl mb-2" style={{ fontWeight: 600 }}>
        What should 0cta do?
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--dash-muted)" }}>
        Plain text in. Hires, payroll, reviews and Notion updates out.
      </p>
      <p className="text-xs mb-4" style={{ color: "var(--dash-muted)" }}>
        Live mode uses <code>MOLTBOT_WEBHOOK_URL</code>. Notion logging is{" "}
        {notionStatus.connected ? "connected" : "not connected"}.
      </p>

      <div className="flex min-h-[560px] flex-col">
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-3">Agent feedback</h3>
          <AgentMessages messages={messages} />
        </div>

        <div className="mt-10">
          <AgentComposer isRunning={isRunning} onSubmit={runAgent} />
        </div>
      </div>
    </>
  );
});

function AdminPanel({
  notionStatus,
  tasks,
  users,
  onDataChange,
}: {
  notionStatus: NotionStatus;
  tasks: TaskRecord[];
  users: AppUserRecord[];
  onDataChange: () => Promise<void>;
}) {
  const [burnPolicy, setBurnPolicy] = useState<"per_request" | "per_action" | "monthly_cap">("per_request");
  const [llmProvider, setLlmProvider] = useState<"claude" | "gemini" | "local">("local");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const settings = await appRepository.getSettings();
      if (!active) return;
      if (typeof settings.burnPolicy === "string") setBurnPolicy(settings.burnPolicy);
      if (
        settings.llmProvider === "claude" ||
        settings.llmProvider === "gemini" ||
        settings.llmProvider === "local"
      )
        setLlmProvider(settings.llmProvider);
      if (typeof settings.claudeApiKey === "string") setClaudeApiKey(settings.claudeApiKey);
      if (typeof settings.geminiApiKey === "string") setGeminiApiKey(settings.geminiApiKey);
      if (typeof settings.walletAddress === "string") setWalletAddress(settings.walletAddress);
      if (typeof settings.approvalRequired === "boolean")
        setApprovalRequired(settings.approvalRequired);
    })();

    return () => {
      active = false;
    };
  }, []);

  const onboardingTasks = useMemo(
    () => tasks.filter((task) => task.type === "admin_onboarding_task"),
    [tasks],
  );

  const steps = useMemo(
    () => [
      {
        title: "Create admin workspace",
        detail: "Set up your HR home and invite the first team leads.",
        done: onboardingTasks.length > 0,
      },
      {
        title: "Connect Notion",
        detail: "Link Notion so 0cta can sync tasks, reviews, and hires.",
        done: notionStatus.connected,
      },
      {
        title: "Configure $OCTA rules",
        detail: "Set burn policy, approvals, and payroll automation.",
        done: Boolean(burnPolicy) && (Boolean(walletAddress) || approvalRequired),
      },
      {
        title: "Enable wallet usage",
        detail: "Connect token payment and admin wallet approval flows.",
        done: !!walletAddress,
      },
      {
        title: "Invite first admins",
        detail: "Add lead users and assign admin roles.",
        done: users.length > 0,
      },
    ],
    [
      notionStatus.connected,
      burnPolicy,
      walletAddress,
      approvalRequired,
      onboardingTasks.length,
      users.length,
    ],
  );

  const connectNotion = () => {
    window.location.href = "/api/notion/start?redirect=/dashboard";
  };

  const queueOnboardingChecklist = async () => {
    if (isSavingChecklist) return;
    setIsSavingChecklist(true);

    try {
      const items = [
        "Create the admin workspace and confirm operating owners.",
        "Invite the first admin leads and assign roles.",
        "Review payroll, token, and Notion setup requirements.",
      ];

      for (const item of items) {
        await createTaskViaApi({
          title: item,
          text: item,
          type: "admin_onboarding_task",
          via: "admin-onboarding",
        });
      }

      await onDataChange();
      window.alert("Onboarding checklist queued.");
    } catch (error) {
      console.error("onboarding checklist error", error);
      window.alert("Failed to queue onboarding checklist.");
    } finally {
      setIsSavingChecklist(false);
    }
  };

  const savePolicySettings = async () => {
    try {
      await appRepository.setSettings({
        burnPolicy,
        walletAddress,
        approvalRequired,
        llmProvider,
        claudeApiKey,
        geminiApiKey,
      });
      window.alert("Policy settings saved.");
    } catch (error) {
      console.error("policy save error", error);
      window.alert("Failed to save settings.");
    }
  };

  return (
    <>
      <Crumb label="Launch checklist" parent="Admin" />
      <div className="flex flex-col gap-6">
        <div
          className="rounded-3xl p-6"
          style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif-display text-4xl" style={{ fontWeight: 600 }}>
                Admin onboarding
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--dash-muted)" }}>
                Walk through the first setup steps for your admin team, connect Notion, and enable
                token workflows.
                {!notionStatus.oauthReady
                  ? " Add Notion env vars on Vercel before connecting."
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={queueOnboardingChecklist}
                disabled={isSavingChecklist}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                style={{
                  background: "var(--dash-blue-soft)",
                  color: "var(--dash-blue)",
                  opacity: isSavingChecklist ? 0.7 : 1,
                }}
              >
                <Plus className="size-4" /> {isSavingChecklist ? "Queuing..." : "Queue checklist"}
              </button>
              <button
                type="button"
                onClick={connectNotion}
                disabled={!notionStatus.oauthReady}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white"
                style={{
                  background: "var(--dash-blue)",
                  opacity: notionStatus.oauthReady ? 1 : 0.6,
                }}
              >
                <ShieldCheck className="size-4" />{" "}
                {notionStatus.connected ? "Reconnect Notion" : "Connect Notion"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 mb-6">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl p-5 flex items-start gap-4"
              style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}
            >
              <div
                className="size-9 rounded-2xl grid place-items-center"
                style={{
                  background: step.done ? "var(--dash-blue-soft)" : "var(--dash-blue-soft)",
                  color: step.done ? "var(--dash-blue)" : "var(--dash-muted)",
                }}
              >
                {step.done ? "✓" : "…"}
              </div>
              <div>
                <p className="font-semibold">{step.title}</p>
                <p className="text-sm mt-1" style={{ color: "var(--dash-muted)" }}>
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}
        >
          <h3 className="text-sm font-semibold mb-4">Payment & Burn Policy</h3>
          <div className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-2"
                style={{ color: "var(--dash-muted)" }}
              >
                AI Model Provider
              </label>
              <select
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value as "claude" | "gemini" | "local")}
                className="w-full p-2 rounded text-sm mb-3"
                style={{
                  background: "var(--dash-blue-soft)",
                  color: "var(--dash-ink)",
                  border: "1px solid var(--dash-border)",
                }}
              >
                <option value="local">Local (no API key needed)</option>
                <option value="claude">Anthropic Claude Sonnet</option>
                <option value="gemini">Google Gemini</option>
              </select>
              {llmProvider === "claude" && (
                <div className="mb-4">
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: "var(--dash-muted)" }}
                  >
                    Claude API Key
                  </label>
                  <input
                    type="password"
                    value={claudeApiKey}
                    onChange={(e) => setClaudeApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full p-2 rounded text-sm font-mono"
                    style={{
                      background: "var(--dash-blue-soft)",
                      color: "var(--dash-ink)",
                      border: "1px solid var(--dash-border)",
                    }}
                  />
                </div>
              )}
              {llmProvider === "gemini" && (
                <div className="mb-4">
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: "var(--dash-muted)" }}
                  >
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full p-2 rounded text-sm font-mono"
                    style={{
                      background: "var(--dash-blue-soft)",
                      color: "var(--dash-ink)",
                      border: "1px solid var(--dash-border)",
                    }}
                  />
                  <p className="text-[11px] mt-1.5" style={{ color: "var(--dash-muted)" }}>
                    Get a free key at{" "}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--dash-blue)" }}
                    >
                      aistudio.google.com
                    </a>
                  </p>
                </div>
              )}
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-2"
                style={{ color: "var(--dash-muted)" }}
              >
                Burn Policy
              </label>
              <select
                value={burnPolicy}
                onChange={(e) => setBurnPolicy(e.target.value as "per_request" | "per_action" | "monthly_cap")}
                className="w-full p-2 rounded text-sm"
                style={{
                  background: "var(--dash-blue-soft)",
                  color: "var(--dash-ink)",
                  border: "1px solid var(--dash-border)",
                }}
              >
                <option value="per_request">Per Request ($OCTA)</option>
                <option value="per_action">Per Action</option>
                <option value="monthly_cap">Monthly Cap</option>
              </select>
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-2"
                style={{ color: "var(--dash-muted)" }}
              >
                Wallet Address
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="w-full p-2 rounded text-sm"
                style={{
                  background: "var(--dash-blue-soft)",
                  color: "var(--dash-ink)",
                  border: "1px solid var(--dash-border)",
                }}
              />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={approvalRequired}
                onChange={(e) => setApprovalRequired(e.target.checked)}
              />
              <span>Require admin approval for large transactions</span>
            </label>
            <button
              type="button"
              onClick={savePolicySettings}
              className="w-full rounded py-2 text-sm font-medium text-white"
              style={{ background: "var(--dash-blue)" }}
            >
              Save Policy Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function TasksPanel({
  notionStatus,
  tasks,
  onDataChange,
}: {
  notionStatus: NotionStatus;
  tasks: TaskRecord[];
  onDataChange: () => Promise<void>;
}) {
  const queuedTasks = useMemo(
    () => tasks.filter((task) => task.status !== "done" && task.status !== "completed"),
    [tasks],
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "done" || task.status === "completed"),
    [tasks],
  );
  const notionTasks = useMemo(
    () =>
      tasks.filter(
        (task) => String(task.via ?? "").includes("notion") || task.type.includes("notion"),
      ),
    [tasks],
  );
  const cols = [
    { name: "Queued", color: "var(--dash-blue-soft)", tasks: queuedTasks },
    { name: "Notion activity", color: "oklch(0.95 0.04 150)", tasks: notionTasks },
    { name: "Done", color: "oklch(0.93 0.05 80)", tasks: completedTasks },
  ];

  const createTask = async () => {
    const text = window.prompt("Task to create");
    if (!text?.trim()) return;

    try {
      await createTaskViaApi({
        title: text.trim().slice(0, 80),
        text: text.trim(),
        type: "manual_task",
        via: "manual-task",
      });
      await onDataChange();
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
          <h1 className="font-serif-display text-4xl" style={{ fontWeight: 600 }}>
            Tasks
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--dash-muted)" }}>
            Live local task queue · Notion status shown when connected
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
            style={{
              background: notionStatus.connected ? "oklch(0.95 0.04 150)" : "var(--dash-blue-soft)",
              color: notionStatus.connected ? "oklch(0.4 0.1 150)" : "var(--dash-muted)",
            }}
          >
            <span
              className={`size-1.5 rounded-full ${notionStatus.connected ? "bg-green-600" : "bg-amber-500"}`}
            />{" "}
            {notionStatus.connected
              ? "Notion connected"
              : notionStatus.oauthReady
                ? "Notion auth ready"
                : "Notion not configured"}
          </span>
          <button
            onClick={() => {
              window.location.href = "/api/notion/start?redirect=/dashboard";
            }}
            disabled={!notionStatus.oauthReady}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-white"
            style={{ background: "var(--dash-blue)", opacity: notionStatus.oauthReady ? 1 : 0.6 }}
          >
            <ShieldCheck className="size-3" /> Reconnect Notion
          </button>
          <button
            onClick={createTask}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full text-white"
            style={{ background: "var(--dash-blue)" }}
          >
            <Plus className="size-3" /> New task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {cols.map((c) => (
          <div key={c.name} className="rounded-2xl p-4" style={{ background: c.color }}>
            <p className="text-xs font-semibold mb-3">
              {c.name} <span className="opacity-50">· {c.tasks.length}</span>
            </p>
            {c.tasks.length > 0 ? (
              <div className="space-y-2">
                {c.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl p-3 text-xs"
                    style={{ background: "var(--dash-surface)" }}
                  >
                    <p className="font-medium mb-2">{taskTitle(task)}</p>
                    <div
                      className="flex items-center justify-between text-[10px]"
                      style={{ color: "var(--dash-muted)" }}
                    >
                      <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                      <span
                        className="px-1.5 py-0.5 rounded"
                        style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}
                      >
                        {task.type.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-xl p-3 text-xs"
                style={{ background: "var(--dash-surface)", color: "var(--dash-muted)" }}
              >
                No live records yet.
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
function PayrollPanel({ team }: { team: Worker[] }) {
  const total = team.reduce((s, t) => s + t.salary, 0);
  return (
    <>
      <Crumb label="August 2026" parent="Payroll" />
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-serif-display text-4xl" style={{ fontWeight: 600 }}>
            Payroll
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--dash-muted)" }}>
            Calculated from live people records in local storage
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full text-white"
          style={{ background: "var(--dash-blue)" }}
        >
          Run payroll <ArrowUpRight className="size-3.5" />
        </button>
      </div>

      {team.length === 0 ? (
        <EmptyState
          title="No payroll data yet"
          detail="Add people with salary fields before payroll totals can be calculated."
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <KPI label="Gross monthly" value={`€${total.toLocaleString()}`} />
            <KPI label="Tax + social" value={`€${Math.round(total * 0.39).toLocaleString()}`} />
            <KPI
              label="Net payout"
              value={`€${Math.round(total * 0.61).toLocaleString()}`}
              highlight
            />
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}
          >
            <div
              className="grid grid-cols-12 px-4 py-2.5 text-[11px] uppercase tracking-wider"
              style={{ color: "var(--dash-muted)", background: "var(--dash-blue-soft)" }}
            >
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
                <div
                  key={w.name}
                  className="grid grid-cols-12 px-4 py-3 text-sm border-t items-center"
                  style={{ borderColor: "var(--dash-border)" }}
                >
                  <div className="col-span-4 flex items-center gap-2">
                    <div
                      className="size-7 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, var(--dash-blue-soft), oklch(0.85 0.1 ${260 + w.name.length * 4}))`,
                      }}
                    />
                    <div>
                      <p className="font-medium">{w.name}</p>
                      <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
                        {w.role}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 text-right">€{w.salary.toLocaleString()}</div>
                  <div className="col-span-2 text-right" style={{ color: "var(--dash-muted)" }}>
                    –€{tax.toLocaleString()}
                  </div>
                  <div className="col-span-2 text-right" style={{ color: "var(--dash-muted)" }}>
                    –€{soc.toLocaleString()}
                  </div>
                  <div
                    className="col-span-2 text-right font-semibold"
                    style={{ color: "var(--dash-blue)" }}
                  >
                    €{(w.salary - tax - soc).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div
              className="rounded-2xl p-4 text-xs"
              style={{ background: "var(--dash-blue-soft)" }}
            >
              <p className="font-semibold mb-1.5">Suggested query · audit current deductions</p>
              <code
                className="block text-[11px] p-2 rounded-lg"
                style={{ background: "var(--dash-surface)", color: "var(--dash-ink)" }}
              >
                SELECT employee, gross, tax, social, net FROM payroll ORDER BY net DESC;
              </code>
            </div>
            <div
              className="rounded-2xl p-4 text-xs"
              style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}
            >
              <p className="font-semibold mb-2">Connections</p>
              <div className="space-y-1.5">
                <ConnRow label="Stripe Treasury" status="Connected" />
                <ConnRow label="Wise · payouts" status="Connected" />
                <ConnRow label="QuickBooks" status="Sync 6h" />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function ConnRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span
        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
        style={{ background: "oklch(0.95 0.04 150)", color: "oklch(0.4 0.1 150)" }}
      >
        <span className="size-1 rounded-full bg-green-600" /> {status}
      </span>
    </div>
  );
}

function KPI({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: highlight ? "var(--dash-blue)" : "var(--dash-surface)",
        color: highlight ? "white" : "var(--dash-ink)",
        border: highlight ? "none" : "1px solid var(--dash-border)",
      }}
    >
      <p className="text-[11px] uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function TokenPanel({ tasks }: { tasks: TaskRecord[] }) {
  const activity = useMemo(() => [...tasks].reverse().slice(0, 6), [tasks]);
  const agentTasks = useMemo(() => tasks.filter((task) => task.type.includes("agent")), [tasks]);
  const notionTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.type.includes("notion") || String(task.via ?? "").includes("notion"),
      ),
    [tasks],
  );
  const earlyCardTasks = useMemo(
    () => tasks.filter((task) => task.type.startsWith("early_card")),
    [tasks],
  );
  const manualTasks = useMemo(() => tasks.filter((task) => task.type === "manual_task"), [tasks]);
  return (
    <>
      <Crumb label="$OCTA wallet" parent="Token" />
      <h1 className="font-serif-display text-4xl mb-1" style={{ fontWeight: 600 }}>
        Usage activity
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--dash-muted)" }}>
        Live action counts from the local JSON-backed datastore.
      </p>

      <div
        className="rounded-3xl p-6 mb-4 text-white"
        style={{ background: "linear-gradient(135deg, var(--dash-blue), oklch(0.45 0.18 280))" }}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs opacity-70 mb-1">Stored actions</p>
            <p className="font-serif-display text-5xl" style={{ fontWeight: 500 }}>
              {tasks.length}
            </p>
            <p className="text-xs opacity-70 mt-1">
              tasks, agent requests, Notion events, and Early Card actions
            </p>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <Sparkles className="size-3 inline mr-1" /> Local JSON mode
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <p className="opacity-60">Agent</p>
            <p className="text-lg font-bold mt-0.5">{agentTasks.length}</p>
          </div>
          <div>
            <p className="opacity-60">Notion</p>
            <p className="text-lg font-bold mt-0.5">{notionTasks.length}</p>
          </div>
          <div>
            <p className="opacity-60">Early Card</p>
            <p className="text-lg font-bold mt-0.5">{earlyCardTasks.length}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Link
            to="/buy"
            className="flex-1 rounded-full bg-white text-sm py-2.5 font-medium text-center"
            style={{ color: "var(--dash-blue)" }}
          >
            Get Early Card
          </Link>
          <button
            disabled
            className="flex-1 rounded-full text-sm py-2.5 font-medium opacity-70 cursor-not-allowed"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            Rewards disabled
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <BotStat name="Agent requests" calls={agentTasks.length} burn={agentTasks.length} />
        <BotStat name="Notion sync" calls={notionTasks.length} burn={notionTasks.length} />
        <BotStat name="Manual tasks" calls={manualTasks.length} burn={manualTasks.length} />
        <BotStat name="Early Card" calls={earlyCardTasks.length} burn={earlyCardTasks.length} />
      </div>

      <h3 className="text-sm font-semibold mb-3">Recent activity</h3>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}
      >
        {activity.length > 0 ? (
          activity.map((task, i) => (
            <div
              key={task.id}
              className="flex items-center gap-3 px-4 py-3 text-sm"
              style={{ borderTop: i ? "1px solid var(--dash-border)" : "none" }}
            >
              <div
                className="size-8 rounded-full grid place-items-center shrink-0"
                style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}
              >
                <Bot className="size-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{taskTitle(task)}</p>
                <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
                  {task.type.replace(/_/g, " ")} · {new Date(task.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: "var(--dash-blue)" }}
              >
                <Flame className="size-3" /> 1
              </span>
            </div>
          ))
        ) : (
          <EmptyState
            title="No activity yet"
            detail="Run an agent request, create a task, or complete Early Card actions to populate this feed."
          />
        )}
      </div>
    </>
  );
}

function BotStat({ name, calls, burn }: { name: string; calls: number; burn: number }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="size-7 rounded-full grid place-items-center"
          style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}
        >
          <Bot className="size-3.5" />
        </div>
        <p className="text-sm font-medium">{name}</p>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
            Calls today
          </p>
          <p className="text-xl font-bold">{calls}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
            Records
          </p>
          <p className="text-xl font-bold" style={{ color: "var(--dash-blue)" }}>
            {burn}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewDrawer({
  worker,
  tasks,
  onClose,
}: {
  worker: Worker;
  tasks: TaskRecord[];
  onClose: () => void;
}) {
  const workerTasks = tasks.filter(
    (task) =>
      task.assignee === worker.name ||
      task.text?.includes(worker.name) ||
      task.title?.includes(worker.name),
  );
  const sendReview = async () => {
    const text = `${worker.name} review: productivity ${worker.productivity}%, rating ${worker.rating}, tasks this week ${worker.tasksThisWeek}.`;
    try {
      await createTaskViaApi({
        title: `${worker.name} review`,
        text,
        type: "review_task",
        via: "review",
      });
      window.alert("Review submitted.");
    } catch (error) {
      console.error("review submit error", error);
      window.alert("Review request failed.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(20,30,80,0.35)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] h-full overflow-y-auto p-6"
        style={{ background: "var(--dash-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div
              className="size-14 rounded-full"
              style={{
                background: `linear-gradient(135deg, var(--dash-blue-soft), oklch(0.85 0.1 ${260 + worker.name.length * 4}))`,
              }}
            />
            <div>
              <h2 className="font-serif-display text-2xl">{worker.name}</h2>
              <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                {worker.role}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full grid place-items-center"
            style={{ background: "var(--dash-blue-soft)" }}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          <KPI label="Productivity" value={`${worker.productivity}%`} />
          <KPI label="Tasks/wk" value={String(worker.tasksThisWeek)} />
          <KPI label="Rating" value={`${worker.rating}★`} />
        </div>

        <h3 className="text-sm font-semibold mb-3">Current tasks</h3>
        <div className="space-y-2 mb-6">
          {workerTasks.length > 0 ? (
            workerTasks.map((t) => (
              <div
                key={t.id}
                className="rounded-xl p-3"
                style={{ background: "var(--dash-blue-soft)" }}
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">{taskTitle(t)}</p>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "var(--dash-surface)", color: "var(--dash-muted)" }}
                  >
                    {String(t.status ?? "queued")}
                  </span>
                </div>
                <div className="h-1 rounded-full" style={{ background: "var(--dash-surface)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: t.status === "done" || t.status === "completed" ? "100%" : "35%",
                      background: "var(--dash-blue)",
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div
              className="rounded-xl p-3 text-sm"
              style={{ background: "var(--dash-blue-soft)", color: "var(--dash-muted)" }}
            >
              No tasks are linked to this person yet.
            </div>
          )}
        </div>

        <h3 className="text-sm font-semibold mb-3">Agent review · last 30 days</h3>
        <div
          className="rounded-xl p-4 text-sm mb-4"
          style={{ background: "var(--dash-blue-soft)" }}
        >
          <p className="mb-2">
            <span className="font-semibold">0cta says:</span> {worker.name.split(" ")[0]} is
            tracking{" "}
            <span style={{ color: "var(--dash-blue)" }}>
              {worker.productivity >= 70 ? "above target" : "below target"}
            </span>
            .{" "}
            {worker.productivity >= 70
              ? "Strong shipping cadence, low review friction."
              : "Consider scoping smaller tasks and a weekly 1:1."}
          </p>
          <p className="text-[11px] opacity-70">Generated by Review agent · burned 14 $OCTA</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={sendReview}
            className="flex-1 rounded-full py-2.5 text-sm text-white font-medium"
            style={{ background: "var(--dash-blue)" }}
          >
            Send review to Notion
          </button>
          <button
            onClick={() =>
              window.alert(`Schedule a 1:1 with ${worker.name} from your calendar workflow.`)
            }
            className="rounded-full py-2.5 px-4 text-sm"
            style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}
          >
            1:1
          </button>
        </div>
      </div>
    </div>
  );
}

function RightRail({ team, tasks, isAdmin, currentUser }: { team: Worker[]; tasks: TaskRecord[]; isAdmin: boolean; currentUser: { name: string; username: string; role?: string; avatar_url?: string } | null; }) {
  const radius = 70;
  const c = 2 * Math.PI * radius;
  const pct = useMemo(
    () =>
      team.length > 0
        ? Math.round(team.reduce((sum, worker) => sum + worker.productivity, 0) / team.length)
        : 0,
    [team],
  );
  const activeUser = team[0];
  const recentTasks = useMemo(() => [...tasks].reverse().slice(0, 3), [tasks]);
  
  return (
    <aside
      className="hidden md:block min-w-0 col-span-12 md:col-span-3 p-6 border-l"
      style={{ borderColor: "var(--dash-border)" }}
    >
      <div className="flex items-center gap-3 mb-6">
        {currentUser?.avatar_url ? (
          <img
            src={currentUser.avatar_url}
            alt="Avatar"
            className="size-11 rounded-full object-cover shadow-inner"
          />
        ) : (
          <div
            className="size-11 rounded-full flex items-center justify-center font-serif-display text-xl text-white shadow-inner"
            style={{ background: "linear-gradient(135deg, var(--dash-blue-soft), var(--dash-blue))" }}
          >
            {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold">{currentUser ? currentUser.username : (isAdmin ? "0cta Admin" : "User")}</p>
          <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
            {currentUser?.role ?? (isAdmin ? "Admin workspace" : "User workspace")}
          </p>
        </div>
      </div>

      <div
        className="rounded-2xl p-4 mb-6 text-white"
        style={{ background: "linear-gradient(135deg, var(--dash-blue), oklch(0.45 0.18 280))" }}
      >
        <div className="flex justify-between items-center mb-2">
          <p className="text-[11px] opacity-70">Stored actions</p>
          <Coins className="size-3.5 opacity-70" />
        </div>
        <p className="font-serif-display text-3xl" style={{ fontWeight: 500 }}>
          {tasks.length}
        </p>
      </div>

      {isAdmin && (
        <>
          <h3 className="text-sm font-semibold mb-3">Team productivity</h3>
          <div className="relative grid place-items-center mb-6">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--dash-blue-soft)"
                strokeWidth="10"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="var(--dash-blue)"
                strokeWidth="10"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - pct / 100)}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
                This week
              </p>
              <p className="text-3xl font-bold" style={{ color: "var(--dash-blue)" }}>
                {pct}%
              </p>
              <p className="text-[10px]" style={{ color: "var(--dash-muted)" }}>
                +20% ↑
              </p>
            </div>
          </div>

          <h3 className="text-sm font-semibold mb-3">Agent activity</h3>
          <div className="space-y-2">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <Activity
                  key={task.id}
                  icon={
                    task.type.includes("notion") ? (
                      <FileText className="size-3.5" />
                    ) : (
                      <Mail className="size-3.5" />
                    )
                  }
                  title={taskTitle(task)}
                  sub={`${task.type.replace(/_/g, " ")} · ${new Date(task.createdAt).toLocaleDateString()}`}
                  tint={task.type.includes("notion") ? "oklch(0.95 0.04 150)" : "var(--dash-blue-soft)"}
                />
              ))
            ) : (
              <Activity
                icon={<CheckCircle2 className="size-3.5" />}
                title="No activity yet"
                sub="Run a workflow to populate this rail"
                tint="var(--dash-blue-soft)"
              />
            )}
          </div>
        </>
      )}
    </aside>
  );
}

function Activity({
  icon,
  title,
  sub,
  tint,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  tint: string;
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: tint }}>
      <div
        className="size-7 rounded-full grid place-items-center shrink-0"
        style={{ background: "var(--dash-surface)", color: "var(--dash-blue)" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{title}</p>
        <p className="text-[10px]" style={{ color: "var(--dash-muted)" }}>
          {sub}
        </p>
      </div>
    </div>
  );
}
