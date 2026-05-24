import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CheckCircle2, Heart, Quote, Repeat2, Sparkles, Ticket, Twitter } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { appRepository } from "../lib/storage";
import { supabase } from "../lib/supabaseClient";


const BASE_AGENT_PROMPT = "AI agents on Base will change work by ";
const TWEET_URL = "https://x.com/intent/tweet?text=One%20click%20HR%20Manager%20is%20coming%20to%20Base.";

export const Route = createFileRoute("/buy")({
  component: EarlyCardPage,
  head: () => ({ meta: [{ title: "Early Card" }] }),
});

function EarlyCardPage() {
  const [email, setEmail] = useState("");
  const [quote, setQuote] = useState(BASE_AGENT_PROMPT);
  const [retweetLink, setRetweetLink] = useState("");
  const [quoteLink, setQuoteLink] = useState("");
  const [liked, setLiked] = useState(false);
  const [quoted, setQuoted] = useState(false);
  const [minted, setMinted] = useState(false);
  const [mintedCount, setMintedCount] = useState(0);
  const [totalMints, setTotalMints] = useState(800);
  const [mintPaused, setMintPaused] = useState(false);
  const [tweetUrl, setTweetUrl] = useState("https://x.com/intent/tweet?text=One%20click%20HR%20Manager%20is%20coming%20to%20Base.");
  const [loading, setLoading] = useState(false);

  const [session, setSession] = useState<any>(null);
  const [twitterUser, setTwitterUser] = useState<{ handle?: string; name?: string } | null>(null);

  const isValidTwitterUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    return trimmed.startsWith("https://twitter.com/") || trimmed.startsWith("https://x.com/");
  };

  const remaining = Math.max(totalMints - mintedCount, 0);
  const socialReady = isValidTwitterUrl(retweetLink) && isValidTwitterUrl(quoteLink);
  const isFormValid = email.trim().length > 0 && twitterUser !== null;

  useEffect(() => {
    let active = true;
    (async () => {
      const s = await appRepository.getSettings();
      if (!active) return;
      setTotalMints(s.nftConfig?.totalMint ?? 800);
      setMintedCount(s.nftConfig?.minted ?? 0);
      setMintPaused(s.nftConfig?.mintPaused ?? false);
      setTweetUrl(s.nftConfig?.tweetUrl ?? "https://x.com/intent/tweet?text=One%20click%20HR%20Manager%20is%20coming%20to%20Base.");
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const twitterMetadata = session.user.user_metadata;
        const handle = twitterMetadata?.preferred_username || twitterMetadata?.user_name || session.user.email?.split('@')[0];
        setTwitterUser({
          handle: handle ? `@${handle}` : undefined,
          name: twitterMetadata?.full_name,
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        const twitterMetadata = session.user.user_metadata;
        const handle = twitterMetadata?.preferred_username || twitterMetadata?.user_name || session.user.email?.split('@')[0];
        setTwitterUser({
          handle: handle ? `@${handle}` : undefined,
          name: twitterMetadata?.full_name,
        });
      } else {
        setTwitterUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleTwitterConnect = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: window.location.origin + "/buy",
      },
    });
    if (error) {
      alert(`Twitter connection failed: ${error.message}`);
      setLoading(false);
    }
  };

  const handleTwitterDisconnect = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setTwitterUser(null);
    setLoading(false);
  };

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
    const quoteContent = getQuote();
    if (!quoteContent || quoteContent === BASE_AGENT_PROMPT.trim()) {
      alert("Add your thought on AI agents on Base before submitting.");
      return;
    }

    setLoading(true);
    await recordSocialTask("early_card_quote");
    setQuoted(true);
    setLoading(false);
    
    // Construct tweet text with their custom thought and #0cta at the bottom!
    const tweetText = `One click HR Manager is coming to Base. ${quoteContent}\n\n#0cta`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, "_blank", "noopener,noreferrer");
  };

  const markLikeRetweet = async () => {
    setLoading(true);
    await recordSocialTask("early_card_like_retweet");
    setLiked(true);
    setLoading(false);
    window.open(tweetUrl, "_blank", "noopener,noreferrer");
  };

  const mintPass = async () => {
    const trimmedEmail = getEmail();
    if (!trimmedEmail) {
      alert("Enter an email for your Early Card record.");
      return;
    }
    if (!twitterUser) {
      alert("Please connect your X (Twitter) account first.");
      return;
    }
    if (!socialReady) {
      alert("Complete the social tasks and paste valid Twitter/X links before minting your Early Supporter Pass.");
      return;
    }
    if (remaining <= 0) {
      alert("The Early Supporter Pass mint is full.");
      return;
    }
    if (mintPaused) {
      alert("Minting is currently paused by the admin.");
      return;
    }

    setLoading(true);
    try {
      // 1. Save to Supabase early_supporters table with URL inputs and custom thought
      const { error: dbError } = await supabase
        .from("early_supporters")
        .insert([
          {
            email: trimmedEmail,
            x_handle: twitterUser.handle || "",
            retweet_link: retweetLink.trim(),
            quote_link: quoteLink.trim(),
            thought: quote.trim(),
            created_at: new Date().toISOString(),
          },
        ]);

      if (dbError) {
        if (dbError.code === "23505") {
          alert("This email or X account has already been registered!");
          setLoading(false);
          return;
        }
        console.error("Database insert error:", dbError);
        alert(`Failed to save record to database: ${dbError.message}`);
        setLoading(false);
        return;
      }

      // 2. Append to mock appRepository task list for local tracking
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

      // Also update the global nftConfig stats in the mock DB
      const s = await appRepository.getSettings();
      await appRepository.setSettings({
        ...s,
        nftConfig: {
          ...s.nftConfig,
          mintPaused: s.nftConfig?.mintPaused ?? false,
          totalMint: s.nftConfig?.totalMint ?? 800,
          minted: (s.nftConfig?.minted ?? 0) + 1,
        },
      });

      alert("Success! Your early supporter pass has been minted and your details recorded.");
    } catch (err: any) {
      console.error("Error minting pass:", err);
      alert(`An error occurred: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const canMint = socialReady && remaining > 0 && !minted && !mintPaused && isFormValid;
  const tasks = [
    { label: "Like and retweet the launch tweet", done: isValidTwitterUrl(retweetLink), action: markLikeRetweet, icon: Repeat2 },
    { label: "Submit a quote with your thought on AI agents on Base", done: isValidTwitterUrl(quoteLink), action: submitQuote, icon: Quote },
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

            <div className="mx-auto mt-7 max-w-xl flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 rounded-lg border border-white/10 bg-black/35 p-2 flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-11 w-full bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/30"
                  placeholder="Email Address"
                />
              </div>

              {twitterUser ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-white sm:w-64">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-black font-semibold text-[10px]">X</span>
                    <span className="truncate font-medium text-green-400">{twitterUser.handle}</span>
                  </div>
                  <button
                    onClick={handleTwitterDisconnect}
                    type="button"
                    className="text-xs text-white/55 hover:text-white/80 underline shrink-0"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleTwitterConnect}
                  disabled={loading}
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/45 px-5 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5 sm:w-64 disabled:opacity-50 shrink-0"
                >
                  <Twitter className="size-4 text-[#1DA1F2] fill-current" />
                  Connect X (Twitter)
                </button>
              )}
            </div>

            <p className="mt-3 text-xs">
              {!isFormValid ? (
                <span className="text-[#d7ff00]/80">⚠️ Enter your email and connect your X account to unlock the tasks below.</span>
              ) : (
                <span className="text-green-400/90">✓ Email entered and X connected! You can now complete the tasks.</span>
              )}
            </p>

            <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-3 text-center">
              <Metric label="minted" value={String(mintedCount)} />
              <Metric label="total mint" value={String(totalMints)} />
              <Metric label="remaining" value={String(remaining)} />
            </div>

            <div className="mt-8 flex flex-col gap-4 text-left">
              {/* TASK 1: Like and Retweet */}
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white/8 text-[#d7ff00]">
                      {isValidTwitterUrl(retweetLink) ? <CheckCircle2 className="size-4" /> : <Repeat2 className="size-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white/95">Task 1: Like and retweet the launch tweet</p>
                      <p className="text-xs text-white/45 mt-0.5">Click the action button to open Twitter, then paste the URL below.</p>
                    </div>
                  </div>
                  <button
                    onClick={markLikeRetweet}
                    disabled={!isFormValid || loading}
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 shrink-0"
                  >
                    Open Twitter <ArrowUpRight className="size-3.5" />
                  </button>
                </div>
                
                <div className="mt-1">
                  <input
                    type="url"
                    value={retweetLink}
                    onChange={(e) => setRetweetLink(e.target.value)}
                    disabled={!isFormValid || loading}
                    className="w-full bg-black/45 rounded-md border border-white/10 px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-[#d7ff00]/55 disabled:opacity-40"
                    placeholder="Paste your Retweet or Like link (e.g. https://x.com/...)"
                  />
                </div>
              </div>

              {/* TASK 2: Custom Thought */}
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white/8 text-[#d7ff00] mt-0.5">
                    {isValidTwitterUrl(quoteLink) ? <CheckCircle2 className="size-4" /> : <Quote className="size-4" />}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/95">Task 2: Post a thought on AI agents on Base</p>
                    <p className="text-xs text-white/45 mt-0.5">Type your thought below, click "Tweet Thought", then paste the resulting tweet link.</p>
                  </div>
                </div>

                <div className="mt-2 bg-black/35 rounded-md border border-white/10 p-3">
                  <textarea
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    disabled={!isFormValid || loading}
                    rows={3}
                    className="w-full resize-none bg-transparent text-xs leading-5 text-white outline-none placeholder:text-white/20 disabled:opacity-40"
                    placeholder="Describe how AI agents will change work..."
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={submitQuote}
                      disabled={!isFormValid || loading || !quote.trim() || quote.trim() === BASE_AGENT_PROMPT.trim()}
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#d7ff00] px-3.5 py-1.5 text-xs font-semibold text-black transition hover:bg-[#e4ff33] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45"
                    >
                      <Twitter className="size-3.5 fill-current" /> Tweet Thought
                    </button>
                  </div>
                </div>

                <div className="mt-1">
                  <input
                    type="url"
                    value={quoteLink}
                    onChange={(e) => setQuoteLink(e.target.value)}
                    disabled={!isFormValid || loading}
                    className="w-full bg-black/45 rounded-md border border-white/10 px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-[#d7ff00]/55 disabled:opacity-40"
                    placeholder="Paste your Tweet link (e.g. https://x.com/...)"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#d7ff00]/30 bg-[#d7ff00]/8 p-4 text-left">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Mint Early Supporter Pass on Base</p>
                  <p className="mt-1 text-xs text-white/45">
                    Mint unlocks after the email is entered, X is connected, and both task URLs are verified.
                  </p>
                </div>
                <button
                  onClick={mintPass}
                  disabled={loading || !canMint}
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#d7ff00] px-5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {minted ? <CheckCircle2 className="size-4" /> : <Ticket className="size-4" />}
                  {minted ? "Mint recorded" : socialReady ? "Mint pass" : "Verify tasks first"}
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
