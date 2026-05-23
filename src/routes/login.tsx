import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { supabase } from "../lib/supabaseClient";
import { appRepository } from "../lib/storage";
import { validateEmail } from "../lib/emailValidation";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({ meta: [{ title: "0cta — Log In" }] }),
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Wallet Connection State (if needed after login)
  const [needsWallet, setNeedsWallet] = useState(false);

  useEffect(() => {
    appRepository.getSettings().then((s) => {
      if (s.loginEnabled === false) {
        navigate({ to: "/maintenance", search: { reason: "maintenance" } });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid || emailCheck.severity === "warn") {
      setError(emailCheck.message || "Invalid email address");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Check if wallet is bound
      if (!data.session?.user.user_metadata?.wallet_address) {
        setNeedsWallet(true);
        setLoading(false);
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  };

  const connectWalletAndSign = async () => {
    setLoading(true);
    setError(null);
    try {
      const eth = (window as any).ethereum;
      if (!eth) {
        throw new Error("No Web3 wallet found. Please install MetaMask or similar.");
      }

      const provider = new ethers.BrowserProvider(eth);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) {
        throw new Error("Wallet connection rejected");
      }
      const address = accounts[0];

      const signer = await provider.getSigner();
      const message = `Welcome to 0cta!\n\nBy signing this message you accept our Terms & Conditions and bind your wallet to your account.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;

      await signer.signMessage(message);

      // Save to Supabase user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { wallet_address: address }
      });
      
      if (updateError) throw updateError;
      
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message || "Failed to connect and sign with wallet");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div style={{ opacity: 0.4, fontSize: "14px" }}>Loading…</div>
      </div>
    );
  }

  if (needsWallet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-md text-center">
          <h1 className="text-2xl font-semibold mb-4">Almost there</h1>
          <p className="text-sm text-white/60 mb-8">
            You need to connect your wallet and sign the Terms & Conditions to access your account.
          </p>
          
          {error && <div className="text-sm text-red-400 mb-6">{error}</div>}
          
          <button
            onClick={connectWalletAndSign}
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Connect Wallet & Sign T&Cs"}
          </button>
        </div>
      </div>
    );
  }

  const emailCheck = validateEmail(email);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <span className="font-serif-display text-3xl">0cta</span>
          </Link>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-white/60">Log in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-white/80" htmlFor="login-email">
              Email
            </label>
            <div className="relative">
              <input
                id="login-email"
                type="email"
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm outline-none focus:border-white/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
              {email.length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                  {emailCheck.severity === "ok" ? (
                    <span className="text-green-400 text-lg">✓</span>
                  ) : emailCheck.severity === "warn" ? (
                    <span className="text-yellow-400 text-sm" title={emailCheck.message}>⚠️</span>
                  ) : (
                    <span className="text-red-400 text-sm" title={emailCheck.message}>✗</span>
                  )}
                </div>
              )}
            </div>
            {email.length > 0 && emailCheck.severity !== "ok" && (
              <div className={`text-xs mt-1 ${emailCheck.severity === "warn" ? "text-yellow-400" : "text-red-400"}`}>
                {emailCheck.message}
              </div>
            )}
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm text-white/80" htmlFor="login-password">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-white/40 hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm outline-none focus:border-white/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/60">
          Don't have an account?{" "}
          <Link to="/signup" className="text-white hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

