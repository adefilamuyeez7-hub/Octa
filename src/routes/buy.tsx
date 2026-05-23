import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CheckCircle2, Heart, Quote, Repeat2, Sparkles, Ticket } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { appRepository } from "../lib/storage";

const TOTAL_MINTS = 800;
const BASE_AGENT_PROMPT = "AI agents on Base will change work by ";
const TWEET_URL = "https://x.com/intent/tweet?text=One%20click%20HR%20Manager%20is%20coming%20to%20Base.";

export const Route = createFileRoute("/buy")({
  component: EarlyCardPage,
  head: () => ({ meta: [{ title: "Early Card" }] }),
});

function EarlyCardPage() {
  const [email, setEmail] = useState("");
  const [quote, setQuote] = useState(BASE_AGENT_PROMPT);
  const [liked, setLiked] = useState(false);
  const [quoted, setQuoted] = useState(false);
  const [minted, setMinted] = useState(false);
  const [mintedCount, setMintedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const remaining = Math.max(TOTAL_MINTS - mintedCount, 0);
  const socialReady = liked && quoted;

  useEffect(() => {
    let active = true;
    (async () => {
      const db = await appRepository.readDb();
      if (!active) return;
      setMintedCount(db.tasks.filter((task) => task.type === "early_card_mint").length);
    })();

    return () => {
      active = false;
    };
  }, []);

  const getQuote = () => quote.trim();
  const getEmail = () => email.trim();

  const recordSocialTask = async (type: "early_card_like_retweet" | "early_card_quote") => {
    await appRepository.appendTask({
      type,
      title: type === "early_card_quote" ? "Quote submitted" : "Liked and retweeted launch tweet",
      text: type === "early_card_quote" ? getQuote() : "Like and retweet completed",
      createdAt: new Date().toISOString(),
    });
  };

  const submitQuote = async () => {
    const quote = getQuote();
    if (!quote || quote === BASE_AGENT_PROMPT.trim()) {
      alert("Add your thought on AI agents on Base before submitting.");
      return;
    }

    setLoading(true);
    await recordSocialTask("early_card_quote");
    setQuoted(true);
    setLoading(false);
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(quote)}`, "_blank", "noopener,noreferrer");
  };

  const markLikeRetweet = async () => {
    setLoading(true);
    await recordSocialTask("early_card_like_retweet");
    setLiked(true);
    setLoading(false);
    window.open(TWEET_URL, "_blank", "noopener,noreferrer");
  };

  const mintPass = async () => {
    const trimmedEmail = getEmail();
    if (!trimmedEmail) {
      alert("Enter an email for your Early Card record.");
      return;
    }
    if (!socialReady) {
      alert("Complete the social tasks before minting your Early Supporter Pass.");
      return;
    }
    if (remaining <= 0) {
      alert("The Early Supporter Pass mint is full.");
      return;
    }

    setLoading(true);
    await appRepository.appendTask({
      type: "early_card_mint",
      title: "Early Supporter Pass minted on Base",
      text: trimmedEmail,
      email: trimmedEmail,
      chain: "base",
      createdAt: new Date().toISOString(),
    });
    setMinted(true);
    setMintedCount((current) => current + 1);
    setLoading(false);
  };

  const canMint = socialReady && remaining > 0 && !minted;
  const tasks = [
    { label: "Like and retweet the launch tweet", done: liked, action: markLikeRetweet, icon: Repeat2 },
    { label: "Submit a quote with your thought on AI agents on Base", done: quoted, action: submitQuote, icon: Quote },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#090a08] text-white">
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-56 bg-[#d7ff00]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-5 py-10">
        <section className="relative w-full overflow-hidden rounded-[18px] border border-white/15 bg-[#0d0f0d] px-5 py-9 shadow-[0_30px_100px_rgba(0,0,0,0.55)] md:px-12 md:py-12">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -right-28 -top-44 h-[620px] w-[620px] rounded-full border border-white/10" />
            <div className="absolute -right-10 -top-28 h-[480px] w-[480px] rounded-full border border-white/10" />
            <div className="absolute bottom-[-160px] left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full border border-[#d7ff00]/20" />
          </div>

          <div className="relative mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-[#d7ff00] text-black">
              <Sparkles className="size-5" />
            </div>
            <div className="mb-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/55">
              <span className="size-1.5 rounded-full bg-[#d7ff00]" />
              Available in early 2026
            </div>
            <h1 className="text-3xl font-semibold md:text-5xl">Get Early Card</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/55">
              Complete the Base launch tasks, submit your AI-agent quote, and mint one of 800 Early Supporter Passes.
            </p>

            <div className="mx-auto mt-7 max-w-xl rounded-lg border border-white/10 bg-black/35 p-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-11 w-full bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/30"
                placeholder="Email"
              />
            </div>

            <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-3 text-center">
              <Metric label="minted" value={String(mintedCount)} />
              <Metric label="total mint" value={String(TOTAL_MINTS)} />
              <Metric label="remaining" value={String(remaining)} />
            </div>

            <div className="mt-8 grid gap-3 text-left">
              {tasks.map(({ label, done, action, icon: Icon }) => (
                <button
                  key={label}
                  onClick={action}
                  disabled={loading || done}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/80 transition hover:border-[#d7ff00]/60 hover:bg-[#d7ff00]/5 disabled:cursor-default disabled:opacity-75"
                >
                  <span className="grid size-9 place-items-center rounded-md bg-white/8 text-[#d7ff00]">
                    {done ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                  </span>
                  <span className="flex-1">{label}</span>
                  {!done && <ArrowUpRight className="size-4 text-white/35" />}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-white/10 bg-black/35 p-3 text-left">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-xs text-white/45">Submit tweet</label>
                <button
                  onClick={submitQuote}
                  disabled={loading || quoted}
                  className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {quoted ? <CheckCircle2 className="size-3.5" /> : <Quote className="size-3.5" />}
                  {quoted ? "Submitted" : "Submit tweet"}
                </button>
              </div>
              <textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                rows={3}
                className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/30"
                placeholder="Share your thought on AI agents on Base"
              />
            </div>

            <div className="mt-5 rounded-xl border border-[#d7ff00]/30 bg-[#d7ff00]/8 p-4 text-left">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Mint Early Supporter Pass on Base</p>
                  <p className="mt-1 text-xs text-white/45">
                    Mint unlocks after the social tasks are completed. Enter your email before minting.
                  </p>
                </div>
                <button
                  onClick={mintPass}
                  disabled={loading || !canMint}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#d7ff00] px-5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {minted ? <CheckCircle2 className="size-4" /> : <Ticket className="size-4" />}
                  {minted ? "Mint recorded" : socialReady ? "Mint pass" : "Complete tasks first"}
                </button>
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-black/45">
              <div className="flex gap-1 border-b border-white/10 px-3 py-2">
                <span className="size-1.5 rounded-full bg-white/20" />
                <span className="size-1.5 rounded-full bg-white/20" />
                <span className="size-1.5 rounded-full bg-white/20" />
              </div>
              <div className="grid min-h-36 place-items-center p-8">
                <button className="grid size-16 place-items-center rounded-full bg-[#d7ff00] text-black shadow-[0_0_40px_rgba(215,255,0,0.35)]">
                  <Heart className="size-6 fill-current" />
                </button>
                <p className="mt-4 text-xs text-white/45">Early Card tasks unlock the Base supporter pass</p>
              </div>
            </div>

            <Link to="/" className="mt-6 inline-block text-xs text-white/45 hover:text-white">
              Back to 0cta
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/40">{label}</p>
    </div>
  );
}
