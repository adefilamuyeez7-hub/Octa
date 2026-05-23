import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { appRepository } from "../lib/storage";

export const Route = createFileRoute("/")(({
  component: Landing,
}));

function Landing() {
  const [settings, setSettings] = useState<{
    loginEnabled: boolean;
    signupEnabled: boolean;
    waitlistMode: boolean;
  }>({ loginEnabled: true, signupEnabled: true, waitlistMode: false });

  useEffect(() => {
    appRepository.getSettings().then((s) => {
      setSettings({
        loginEnabled: s.loginEnabled !== false,
        signupEnabled: s.signupEnabled !== false,
        waitlistMode: s.waitlistMode === true,
      });
    });
  }, []);

  const loginDest = settings.loginEnabled ? "/login" : "/maintenance?reason=maintenance";
  const joinDest = settings.waitlistMode
    ? "/maintenance?reason=waitlist"
    : settings.signupEnabled
    ? "/signup"
    : "/maintenance?reason=maintenance";

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
            <Link to="/buy" className="rounded-full px-3 py-2 hover:bg-white/5">
              Waitlist
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {settings.loginEnabled ? (
              <Link
                to="/login"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 transition-opacity"
              >
                Login
              </Link>
            ) : (
              <span className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/40 cursor-not-allowed">
                Login
              </span>
            )}
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
                <Link
                  to={joinDest}
                  className="rounded-full bg-white px-6 py-3 font-medium text-black hover:bg-white/90 transition-opacity"
                >
                  {settings.waitlistMode ? "Join Waitlist" : settings.signupEnabled ? "Get Started" : "Join Waitlist"}
                </Link>
                <Link
                  to={loginDest}
                  className="rounded-full border border-white/20 px-6 py-3 text-white/90 hover:bg-white/5 transition-colors"
                >
                  {settings.loginEnabled ? "Sign In" : "Coming Soon"}
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
