import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { supabase } from "../lib/supabaseClient";
import { appRepository } from "../lib/storage";
import { validateEmail } from "../lib/emailValidation";

export const Route = createFileRoute("/signup")({
  component: Signup,
  head: () => ({ meta: [{ title: "0cta — Sign Up" }] }),
});

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "otp" | "wallet">("form");
  
  // Step 1: Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Real-time username validation
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
  const [showPassword, setShowPassword] = useState(false);
  const checkTimeout = useRef<NodeJS.Timeout | null>(null);

  // Step 2: OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Global auth state
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gate: check if signup/waitlist is open
  useEffect(() => {
    appRepository.getSettings().then((s) => {
      if (s.waitlistMode === true) {
        navigate({ to: "/maintenance", search: { reason: "waitlist" } });
      } else if (s.signupEnabled === false) {
        navigate({ to: "/maintenance", search: { reason: "maintenance" } });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  // Username validation debounce
  useEffect(() => {
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    
    if (username.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    checkTimeout.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('check_username_available', {
          requested_username: username.toLowerCase()
        });
        
        if (error) throw error;
        setUsernameStatus(data ? "available" : "taken");
      } catch (err) {
        console.error("Username check failed", err);
        setUsernameStatus("error");
      }
    }, 500);

    return () => {
      if (checkTimeout.current) clearTimeout(checkTimeout.current);
    };
  }, [username]);

  // Handle Step 1: Sign up
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid || emailCheck.severity === "warn") {
      setError(emailCheck.message || "Invalid email address");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (usernameStatus === "taken") {
      setError("Username is already taken");
      setLoading(false);
      return;
    }

    if (!firstName || !lastName || !gender) {
      setError("Please fill out all required fields");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          username: username.toLowerCase(),
          gender: gender
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      setStep("otp");
      setLoading(false);
    }
  };

  // Handle Step 2: OTP
  const handleOtpChange = (index: number, value: string) => {
    // Allow any alphanumeric character
    if (!/^[a-zA-Z0-9]*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
    if (!pastedData) return;
    
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    // Focus next available or last
    const nextIndex = Math.min(pastedData.length, 7);
    inputRefs.current[nextIndex]?.focus();
  };

  const verifyOtp = async () => {
    const token = otp.join("");
    if (token.length !== 8) {
      setError("Please enter the full 8-character code");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup"
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
    } else {
      setStep("wallet");
      setLoading(false);
    }
  };

  // Handle Step 3: Wallet
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

      // Save wallet to metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { wallet_address: address }
      });

      if (updateError) throw updateError;
      
      // Also sync profile to public.users via a trigger or direct insert if we want
      // Assuming Supabase trigger handles the creation, we just navigate
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

  // Password strength logic
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score: 0, label: "", color: "bg-transparent" };
    if (pass.length > 7) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    if (pass.length < 6) return { score: 1, label: "Too short", color: "bg-red-500" };
    if (score === 1) return { score: 1, label: "Weak", color: "bg-red-400" };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-yellow-400" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-blue-400" };
    if (score === 4) return { score: 4, label: "Strong", color: "bg-green-400" };
    return { score: 0, label: "", color: "bg-transparent" };
  };

  const strength = calculateStrength(password);

  const emailCheck = validateEmail(email);
  const isFormValid = emailCheck.severity !== "error" && password.length >= 6 && usernameStatus === "available" && firstName && lastName && gender;

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white py-12">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-md">
        
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <span className="font-serif-display text-3xl">0cta</span>
          </Link>
          <h1 className="text-2xl font-semibold">
            {step === "form" && "Create an account"}
            {step === "otp" && "Verify your email"}
            {step === "wallet" && "Secure your account"}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {step === "form" && "Join 0cta to start managing HR on-chain"}
            {step === "otp" && `We sent a 6-digit code to ${email}`}
            {step === "wallet" && "Connect your wallet to accept T&Cs"}
          </p>
        </div>

        {/* STEP 1: Profile & Credentials */}
        {step === "form" && (
          <form onSubmit={handleSignup} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-white/80" htmlFor="signup-fn">First Name</label>
                <input
                  id="signup-fn" type="text" required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-white/20"
                  value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-white/80" htmlFor="signup-ln">Last Name</label>
                <input
                  id="signup-ln" type="text" required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-white/20"
                  value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/80" htmlFor="signup-username">Username</label>
              <div className="relative">
                <input
                  id="signup-username" type="text" required minLength={3} maxLength={20} pattern="^[a-zA-Z0-9_]+$"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm outline-none focus:border-white/20"
                  value={username} onChange={(e) => setUsername(e.target.value)} placeholder="jane_doe"
                />
                {username.length > 2 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {usernameStatus === "checking" && <span className="text-white/40 text-xs">...</span>}
                    {usernameStatus === "available" && <span className="text-green-400 text-lg">✓</span>}
                    {usernameStatus === "taken" && <span className="text-red-400 text-sm" title="Taken">✗</span>}
                  </div>
                )}
              </div>
              {usernameStatus === "taken" && <div className="text-xs mt-1 text-red-400">Username is already taken</div>}
              {username.length > 0 && username.length < 3 && <div className="text-xs mt-1 text-white/40">Min 3 characters</div>}
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/80" htmlFor="signup-gender">Gender</label>
              <select
                id="signup-gender" required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-white/20 appearance-none text-white"
                value={gender} onChange={(e) => setGender(e.target.value)}
              >
                <option value="" disabled className="bg-black">Select gender</option>
                <option value="Male" className="bg-black">Male</option>
                <option value="Female" className="bg-black">Female</option>
                <option value="Other" className="bg-black">Other</option>
                <option value="Prefer not to say" className="bg-black">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/80" htmlFor="signup-email">Email</label>
              <div className="relative">
                <input
                  id="signup-email" type="email" required
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

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-sm text-white/80" htmlFor="signup-password">Password</label>
                {password.length > 0 && (
                  <span className={`text-xs ${strength.color.replace('bg-', 'text-')}`}>
                    {strength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="signup-password" type={showPassword ? "text" : "password"} required minLength={6}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm outline-none focus:border-white/20"
                  value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
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
              
              {/* Password strength visual bar */}
              {password.length > 0 && (
                <div className="mt-2 flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full transition-all duration-300 ${strength.score >= 1 ? strength.color : "bg-transparent"} w-1/4`} />
                  <div className={`h-full transition-all duration-300 ${strength.score >= 2 ? strength.color : "bg-transparent"} w-1/4`} />
                  <div className={`h-full transition-all duration-300 ${strength.score >= 3 ? strength.color : "bg-transparent"} w-1/4`} />
                  <div className={`h-full transition-all duration-300 ${strength.score >= 4 ? strength.color : "bg-transparent"} w-1/4`} />
                </div>
              )}
            </div>

            {error && <div className="text-sm text-red-400">{error}</div>}

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="mt-6 w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? "Sending code..." : "Continue"}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === "otp" && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index} ref={(el) => (inputRefs.current[index] = el)} type="text" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-white/20 bg-white/5 outline-none focus:border-white/50 focus:bg-white/10 transition-colors"
                />
              ))}
            </div>

            {error && <div className="text-sm text-red-400">{error}</div>}

            <button
              onClick={verifyOtp} disabled={loading || otp.join("").length !== 8}
              className="w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            
            <button
              onClick={() => { setStep("form"); setError(null); setOtp(["", "", "", "", "", "", "", ""]); }}
              className="text-xs text-white/40 hover:text-white/80 transition-colors"
            >
              Wrong email? Go back
            </button>
          </div>
        )}

        {/* STEP 3: Wallet Connect */}
        {step === "wallet" && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-purple-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-purple-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                </svg>
              </div>
            </div>

            <p className="text-sm text-white/70 leading-relaxed px-4">
              Connect your Web3 wallet to sign our Terms & Conditions and secure your account.
            </p>

            {error && <div className="text-sm text-red-400">{error}</div>}

            <button
              onClick={connectWalletAndSign} disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 shadow-lg shadow-purple-500/25"
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        )}

        {/* Bottom link (only on form step) */}
        {step === "form" && (
          <p className="mt-6 text-center text-sm text-white/60">
            Already have an account?{" "}
            <Link to="/login" className="text-white hover:underline">Log in</Link>
          </p>
        )}
      </div>
    </div>
  );
}

