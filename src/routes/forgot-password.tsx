import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { validateEmail } from "../lib/emailValidation";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
  head: () => ({ meta: [{ title: "0cta — Reset Password" }] }),
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setError(emailCheck.message || "Invalid email address");
      setLoading(false);
      return;
    }

    // Set the redirectTo URL to the reset-password route
    const redirectUrl = `${window.location.origin}/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  const emailCheck = validateEmail(email);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-md">
        
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <span className="font-serif-display text-3xl">0cta</span>
          </Link>
          <h1 className="text-2xl font-semibold">Reset Password</h1>
          <p className="mt-2 text-sm text-white/60">
            {success ? "Check your inbox for a recovery link." : "Enter your email to receive a recovery link."}
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(34,197,94,0.2)] mx-auto">
              ✓
            </div>
            <p className="text-sm text-white/70">
              We have sent a secure recovery link to <strong>{email}</strong>. Please check your inbox and spam folders.
            </p>
            <Link to="/login" className="block w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-white/80" htmlFor="reset-email">Email</label>
              <div className="relative">
                <input
                  id="reset-email" type="email" required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm outline-none focus:border-white/20"
                  value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
                />
                {email.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {emailCheck.severity === "ok" ? <span className="text-green-400 text-lg">✓</span> : 
                     emailCheck.severity === "warn" ? <span className="text-yellow-400 text-sm" title={emailCheck.message}>⚠️</span> : 
                     <span className="text-red-400 text-sm" title={emailCheck.message}>✗</span>}
                  </div>
                )}
              </div>
              {email.length > 0 && emailCheck.severity !== "ok" && (
                <div className={`text-xs mt-1 ${emailCheck.severity === "warn" ? "text-yellow-400" : "text-red-400"}`}>{emailCheck.message}</div>
              )}
            </div>

            {error && <div className="text-sm text-red-400">{error}</div>}

            <button
              type="submit"
              disabled={loading || (email.length > 0 && emailCheck.severity === "error")}
              className="mt-6 w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? "Sending Link..." : "Send Recovery Link"}
            </button>
            
            <p className="mt-6 text-center text-sm text-white/60">
              Remembered your password?{" "}
              <Link to="/login" className="text-white hover:underline">Log in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
