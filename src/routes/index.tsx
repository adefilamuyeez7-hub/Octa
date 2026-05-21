import { createFileRoute, Link } from "@tanstack/react-router";
import WalletConnect from "../components/wallet-connect";
import HeroPolished from "../components/hero-polished";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="py-6">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="0cta" className="h-8" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            <span className="font-serif-display text-2xl">0cta</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm opacity-80">
            <a className="px-3 py-2 rounded-full hover:bg-white/5">Home</a>
            <a className="px-3 py-2 rounded-full hover:bg-white/5">DeFi App</a>
            <a className="px-3 py-2 rounded-full hover:bg-white/5">Assets</a>
            <a className="px-3 py-2 rounded-full hover:bg-white/5">Features</a>
            <a className="px-3 py-2 rounded-full hover:bg-white/5">Pricing</a>
            <a className="px-3 py-2 rounded-full hover:bg-white/5">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <WalletConnect />
            <button className="px-4 py-2 rounded-full border border-white/10">Create Account</button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <HeroPolished />
        <div className="mx-auto max-w-6xl w-full p-10 rounded-3xl bg-gradient-to-br from-white/3 via-white/2 to-transparent backdrop-blur-md shadow-2xl border border-white/6 rounded-window">
          <div className="text-center py-12 px-6">
            <h1 className="text-5xl md:text-6xl font-semibold">One-click for Asset <span className="font-extrabold">Defense</span></h1>
            <p className="mt-6 text-lg opacity-80">Dive into the art assets, where innovative blockchain technology meets financial expertise</p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link to="/dashboard" className="px-6 py-3 rounded-full bg-white text-black">Open App</Link>
              <button className="px-6 py-3 rounded-full border border-white/20">Discover More</button>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-8">
        <div className="mx-auto max-w-7xl px-6 text-sm opacity-60 flex justify-between">
          <span>© 2026 0cta Labs</span>
          <span>One-click for Asset Defense</span>
        </div>
      </footer>
    </div>
  );
}
// Old landing sections removed — page focuses on new hero design.
