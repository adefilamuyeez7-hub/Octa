import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  SendHorizontal,
} from "lucide-react";
import { appRepository, type AppUserRecord, type TaskRecord } from "../lib/storage";
import { Textarea } from "../components/ui/textarea";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "0cta — Dashboard" }] }),
});

type Section = "chat" | "people" | "tasks" | "payroll" | "token" | "admin";
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

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  tone?: "default" | "highlight";
};

const BOT_SUGGESTIONS = [
  "Summarize who needs a review this week",
  "Draft a reply for a payroll discrepancy",
  "What should I prioritize for onboarding?",
  "Turn today's activity into a leadership update",
];

const BOT_SEED_MESSAGES: ChatMessage[] = [
  {
    id: "seed-1",
    role: "assistant",
    tone: "highlight",
    text: "Morning. I can help you rehearse HR ops requests before we wire the backend. Ask for a summary, draft, or next-step plan.",
  },
  {
    id: "seed-2",
    role: "assistant",
    text: "Try one of the suggested prompts below, or type a messy real-world request and I’ll turn it into a polished response.",
  },
];

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
  const [section, setSection] = useState<Section>("chat");
  const [reviewing, setReviewing] = useState<Worker | null>(null);
  const [notionStatus, setNotionStatus] = useState<NotionStatus>({
    oauthReady: false,
    databaseReady: false,
    connected: false,
  });
  const [users, setUsers] = useState<AppUserRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);

  const refreshData = async () => {
    const db = await appRepository.readDb();
    setUsers(db.users);
    setTasks(db.tasks);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const db = await appRepository.readDb();
        if (active) {
          setUsers(db.users);
          setTasks(db.tasks);
        }

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
          className="md:hidden col-span-12 flex items-center justify-between p-4 border-b"
          style={{ borderColor: "var(--dash-border)" }}
        >
          <h2 className="font-serif-display text-xl">0cta</h2>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={() => setSection("chat")}
              className="px-3 py-1 text-sm rounded"
              style={{
                background: section === "chat" ? "var(--dash-blue)" : "transparent",
                color: section === "chat" ? "white" : "var(--dash-muted)",
              }}
            >
              Chat
            </button>
            <button
              onClick={() => setSection("people")}
              className="px-3 py-1 text-sm rounded"
              style={{
                background: section === "people" ? "var(--dash-blue)" : "transparent",
                color: section === "people" ? "white" : "var(--dash-muted)",
              }}
            >
              People
            </button>
            <button
              onClick={() => setSection("tasks")}
              className="px-3 py-1 text-sm rounded"
              style={{
                background: section === "tasks" ? "var(--dash-blue)" : "transparent",
                color: section === "tasks" ? "white" : "var(--dash-muted)",
              }}
            >
              Tasks
            </button>
            <button
              onClick={() => setSection("payroll")}
              className="px-3 py-1 text-sm rounded"
              style={{
                background: section === "payroll" ? "var(--dash-blue)" : "transparent",
                color: section === "payroll" ? "white" : "var(--dash-muted)",
              }}
            >
              Payroll
            </button>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar section={section} setSection={setSection} tasks={tasks} />
        </div>

        <main className="col-span-12 md:col-span-7 p-4 md:p-8 min-h-[820px]">
          {section === "chat" && <ChatPanel team={team} tasks={tasks} />}
          {section === "people" && <PeoplePanel team={team} onReview={setReviewing} />}
          {section === "tasks" && (
            <TasksPanel notionStatus={notionStatus} tasks={tasks} onDataChange={refreshData} />
          )}
          {section === "payroll" && <PayrollPanel team={team} />}
          {section === "token" && <TokenPanel tasks={tasks} />}
          {section === "admin" && (
            <AdminPanel
              notionStatus={notionStatus}
              tasks={tasks}
              users={users}
              onDataChange={refreshData}
            />
          )}
        </main>

        {/* Right rail hidden on mobile */}
        <div className={`hidden md:block ${section === "chat" ? "md:hidden" : ""}`}>
          <ChatbotRail team={team} tasks={tasks} />
        </div>
      </div>

      {reviewing && (
        <ReviewDrawer worker={reviewing} tasks={tasks} onClose={() => setReviewing(null)} />
      )}
    </div>
  );
}

function Sidebar({
  section,
  setSection,
  tasks,
}: {
  section: Section;
  setSection: (s: Section) => void;
  tasks: TaskRecord[];
}) {
  const burnedToday = useMemo(() => tasks.length, [tasks]);
  const nav = [
    { id: "chat" as const, icon: Sparkles, label: "Chat" },
    { id: "people" as const, icon: Users, label: "People" },
    { id: "tasks" as const, icon: ListChecks, label: "Tasks · Notion" },
    { id: "payroll" as const, icon: Wallet, label: "Payroll" },
    { id: "token" as const, icon: Coins, label: "Token" },
    { id: "admin" as const, icon: ShieldCheck, label: "Admin onboarding" },
  ];
  return (
    <aside
      className="col-span-12 md:col-span-2 p-6 border-r"
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
          actions logged
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
            Click a card to open the review & task breakdown
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
  const [burnPolicy, setBurnPolicy] = useState("per_request");
  const [walletAddress, setWalletAddress] = useState("");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [isSavingChecklist, setIsSavingChecklist] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const settings = await appRepository.getSettings();
      if (!active) return;
      if (typeof settings.burnPolicy === "string") setBurnPolicy(settings.burnPolicy);
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
      await appRepository.setSettings({ burnPolicy, walletAddress, approvalRequired });
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
                Burn Policy
              </label>
              <select
                value={burnPolicy}
                onChange={(e) => setBurnPolicy(e.target.value)}
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
              tasks, Notion events, and Early Card actions
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
            <p className="opacity-60">Tasks</p>
            <p className="text-lg font-bold mt-0.5">{tasks.length}</p>
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
        <BotStat name="Task queue" calls={tasks.length} burn={tasks.length} />
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
            detail="Create a task, sync Notion, or complete Early Card actions to populate this feed."
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

        <h3 className="text-sm font-semibold mb-3">Review · last 30 days</h3>
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
          <p className="text-[11px] opacity-70">Generated by review workflow · burned 14 $OCTA</p>
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

function RightRail({ team, tasks }: { team: Worker[]; tasks: TaskRecord[] }) {
  const radius = 60;
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
  const notionCount = useMemo(
    () => tasks.filter((task) => task.type.includes("notion")).length,
    [tasks],
  );
  return (
    <aside
      className="col-span-12 md:col-span-3 p-6 border-l"
      style={{ borderColor: "var(--dash-border)" }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="size-11 rounded-full"
          style={{ background: "linear-gradient(135deg, var(--dash-blue-soft), var(--dash-blue))" }}
        />
        <div className="flex-1">
          <p className="text-sm font-semibold">{activeUser?.name ?? "0cta Admin"}</p>
          <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
            {activeUser?.role ?? "Admin workspace"}
          </p>
        </div>
        <button
          className="size-8 rounded-full grid place-items-center"
          style={{ background: "var(--dash-blue-soft)", color: "var(--dash-muted)" }}
        >
          <MoreHorizontal className="size-4" />
        </button>
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
        <div className="flex justify-between text-[11px] mt-2 opacity-80">
          <span>
            <Flame className="size-2.5 inline" /> {tasks.length} actions
          </span>
          <span>
            <TrendingUp className="size-2.5 inline" /> {notionCount} Notion
          </span>
        </div>
      </div>

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

      <h3 className="text-sm font-semibold mb-3">Recent activity</h3>
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
        className="size-7 rounded-full grid place-items-center"
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

function buildMockReply(message: string, team: Worker[], tasks: TaskRecord[]): string {
  const lower = message.toLowerCase();
  const activeReviews = team.filter((worker) => worker.productivity < 70).length;
  const openTasks = tasks.filter(
    (task) => task.status !== "done" && task.status !== "completed",
  ).length;

  if (lower.includes("review")) {
    return `Here’s the quick review readout: ${activeReviews || team.length || 0} teammates would benefit from follow-up, and I’d start with the people carrying lower productivity or rising task load. I’d package that as a concise manager brief plus one recommended next step per person.`;
  }

  if (lower.includes("payroll")) {
    return "I’d respond with a calm payroll note: confirm the variance, name the pay period affected, and offer a same-day reconciliation path. If you want, I can also frame the response in a more executive or employee-friendly tone.";
  }

  if (lower.includes("onboarding") || lower.includes("hire")) {
    return `For onboarding, I’d prioritize three things first: workspace access, role-specific checklist ownership, and a 7-day pulse check. Right now you have ${openTasks} open tracked actions, so I’d keep the first-week plan narrow and accountable.`;
  }

  if (lower.includes("summary") || lower.includes("update")) {
    return `Leadership snapshot: ${team.length || 0} people in view, ${openTasks} active tasks, and the strongest opportunity is converting recent workflow activity into clearer follow-ups. I’d keep the update to wins, risks, and next actions.`;
  }

  return "That’s a strong candidate for the assistant. I’d turn it into a direct operational reply, pull out the decision to make, and end with two concrete next steps so the user knows exactly what happens after they hit send.";
}

function ChatPanel({ team, tasks }: { team: Worker[]; tasks: TaskRecord[] }) {
  return (
    <>
      <Crumb label="Conversation" parent="Chat" />
      <h1 className="font-serif-display text-4xl mb-2" style={{ fontWeight: 600 }}>
        0cta assistant
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--dash-muted)" }}>
        Frontend-only chatbot simulation focused on the conversation flow, suggested prompts, and
        composer experience.
      </p>
      <div className="-mx-1">
        <ChatbotRail team={team} tasks={tasks} standalone />
      </div>
    </>
  );
}

function ChatbotRail({
  team,
  tasks,
  standalone = false,
}: {
  team: Worker[];
  tasks: TaskRecord[];
  standalone?: boolean;
}) {
  const activeUser = team[0];
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(BOT_SEED_MESSAGES);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const averageProductivity = useMemo(
    () =>
      team.length > 0
        ? Math.round(team.reduce((sum, worker) => sum + worker.productivity, 0) / team.length)
        : 0,
    [team],
  );

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = (rawText: string) => {
    const text = rawText.trim();
    if (!text || isThinking) return;

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text,
      },
    ]);
    setDraft("");
    setIsThinking(true);

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: buildMockReply(text, team, tasks),
        },
      ]);
      setIsThinking(false);
    }, 700);
  };

  return (
    <aside
      className={`col-span-12 p-4 md:p-6 ${standalone ? "" : "md:col-span-3 border-l"}`}
      style={standalone ? undefined : { borderColor: "var(--dash-border)" }}
    >
      <div className="mb-6 flex items-center gap-3">
        <div
          className="size-11 rounded-full"
          style={{ background: "linear-gradient(135deg, var(--dash-blue-soft), var(--dash-blue))" }}
        />
        <div className="flex-1">
          <p className="text-sm font-semibold">{activeUser?.name ?? "0cta Admin"}</p>
          <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
            {activeUser?.role ?? "Admin workspace"}
          </p>
        </div>
        <div
          className="rounded-full px-2.5 py-1 text-[10px] font-medium"
          style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}
        >
          bot preview
        </div>
      </div>

      <div
        className="flex min-h-[760px] flex-col overflow-hidden rounded-[30px]"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.98 0.025 252) 0%, var(--dash-surface) 26%, oklch(0.995 0.01 250) 100%)",
          border: "1px solid var(--dash-border)",
          boxShadow: "0 24px 60px -38px rgba(54, 76, 165, 0.45)",
        }}
      >
        <div className="border-b px-4 py-4 md:px-5" style={{ borderColor: "var(--dash-border)" }}>
          <div className="mb-3 flex items-center gap-3">
            <div
              className="grid size-11 place-items-center rounded-2xl text-white"
              style={{
                background: "linear-gradient(135deg, var(--dash-blue), oklch(0.55 0.17 288))",
              }}
            >
              <Bot className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">0cta assistant</p>
              <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                Simulated chat UI with local-only responses
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div
              className="rounded-2xl p-3"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid var(--dash-border)" }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "var(--dash-muted)" }}
              >
                Avg output
              </p>
              <p className="mt-1 text-xl font-semibold" style={{ color: "var(--dash-blue)" }}>
                {averageProductivity}%
              </p>
            </div>
            <div
              className="rounded-2xl p-3"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid var(--dash-border)" }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "var(--dash-muted)" }}
              >
                Open tasks
              </p>
              <p className="mt-1 text-xl font-semibold">{tasks.length}</p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4 md:px-5">
          <div className="mb-3 flex items-center justify-between">
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--dash-muted)" }}
            >
              Suggested questions
            </p>
            <span
              className="rounded-full px-2 py-1 text-[10px]"
              style={{ background: "var(--dash-blue-soft)", color: "var(--dash-blue)" }}
            >
              simulation
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {BOT_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => sendMessage(suggestion)}
                disabled={isThinking}
                className="rounded-full px-3 py-2 text-left text-[11px] transition-transform hover:-translate-y-0.5"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  border: "1px solid var(--dash-border)",
                  color: "var(--dash-ink)",
                  opacity: isThinking ? 0.7 : 1,
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={scrollRef}
          className="mx-4 my-4 flex-1 space-y-3 overflow-y-auto rounded-[24px] px-1 py-1 md:mx-5"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[88%] rounded-[24px] px-4 py-3 text-sm leading-6"
                style={{
                  background:
                    message.role === "user"
                      ? "var(--dash-blue)"
                      : message.tone === "highlight"
                        ? "linear-gradient(135deg, rgba(82, 115, 255, 0.12), rgba(150, 176, 255, 0.2))"
                        : "rgba(255,255,255,0.82)",
                  color: message.role === "user" ? "white" : "var(--dash-ink)",
                  border:
                    message.role === "user" ? "none" : "1px solid rgba(115, 135, 210, 0.14)",
                  boxShadow:
                    message.role === "user"
                      ? "0 16px 34px -24px rgba(54, 76, 165, 0.95)"
                      : "0 12px 24px -22px rgba(30, 41, 90, 0.35)",
                }}
              >
                {message.text}
              </div>
            </div>
          ))}

          {isThinking ? (
            <div className="flex justify-start">
              <div
                className="rounded-[24px] px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.82)",
                  border: "1px solid rgba(115, 135, 210, 0.14)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="size-2 rounded-full"
                      style={{
                        background: "var(--dash-blue)",
                        opacity: 0.3 + dot * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t px-4 py-4 md:px-5" style={{ borderColor: "var(--dash-border)" }}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(draft);
            }}
            className="rounded-[26px] p-3"
            style={{
              background: "rgba(255,255,255,0.84)",
              border: "1px solid rgba(115, 135, 210, 0.16)",
            }}
          >
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  (event.metaKey || event.ctrlKey)
                ) {
                  event.preventDefault();
                  sendMessage(draft);
                }
              }}
              placeholder="Ask 0cta to summarize, draft, prioritize, or turn rough notes into a polished HR response..."
              className="min-h-[110px] resize-none border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-blue-400 placeholder:opacity-60"
              style={{
                color: "var(--dash-ink)",
                placeholderColor: "var(--dash-muted)",
                caretColor: "var(--dash-blue)",
                backgroundColor: "transparent",
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                lineHeight: "1.5",
              }}
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px]" style={{ color: "var(--dash-muted)" }}>
                Press Enter for a new line. Use Ctrl/Cmd+Enter to send.
              </p>
              <button
                type="submit"
                disabled={!draft.trim() || isThinking}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white transition-opacity"
                style={{
                  background: "var(--dash-blue)",
                  opacity: !draft.trim() || isThinking ? 0.6 : 1,
                }}
              >
                {isThinking ? "Thinking..." : "Send"} <SendHorizontal className="size-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </aside>
  );
}
