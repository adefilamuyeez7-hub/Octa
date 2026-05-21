import { createFileRoute, Link } from "@tanstack/react-router";
import WalletConnect from "../components/wallet-connect";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="0cta"
              className="h-8"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="font-serif-display text-2xl">0cta</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm opacity-80">
            <Link to="/" className="rounded-full px-3 py-2 hover:bg-white/5">
              Home
            </Link>
            <Link to="/dashboard" className="rounded-full px-3 py-2 hover:bg-white/5">
              Dashboard
            </Link>
            <Link to="/buy" className="rounded-full px-3 py-2 hover:bg-white/5">
              Early Card
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <WalletConnect />
            <Link to="/dashboard" className="rounded-full border border-white/10 px-4 py-2">
              Open Workspace
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="rounded-[2rem] border border-white/8 bg-gradient-to-br from-white/6 via-white/[0.03] to-transparent p-10 shadow-2xl backdrop-blur-md md:p-16">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-white/55">HR operations workspace</p>
              <h1 className="mt-5 text-5xl font-semibold leading-none md:text-7xl">
                One click
                <br />
                HR Manager
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-white/72 md:text-xl">
                Manage onboarding, team tasks, admin setup, and AI-assisted HR workflows from one workspace built to move fast.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link to="/dashboard" className="rounded-full bg-white px-6 py-3 font-medium text-black">
                  Open Workspace
                </Link>
                <Link to="/buy" className="rounded-full border border-white/20 px-6 py-3 text-white/90">
                  Get Early Card
                </Link>
              </div>
              <div className="mt-10 grid gap-4 text-sm text-white/68 md:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">Admin onboarding checklists</div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">Notion sync for tasks and reviews</div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">AI agent support for HR requests</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8">
        <div className="mx-auto flex max-w-7xl justify-between px-6 text-sm opacity-60">
          <span>Copyright 2026 0cta Labs</span>
          <span>One click HR Manager</span>
        </div>
      </footer>
    </div>
  );
}
