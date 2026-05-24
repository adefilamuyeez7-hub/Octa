import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { appRepository } from "../lib/storage";
import { supabase } from "../lib/supabaseClient";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "0cta — Settings" }] }),
});

// ----- Components -----
function Toggle({ id, checked, onChange, label, description, danger }: any) {
  return (
    <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border ${danger ? 'border-red-500/20 bg-red-500/5' : 'border-[var(--dash-border)] bg-black/5 dark:bg-white/5'}`}>
      <div className="flex-1">
        <div className="text-sm font-medium" style={{ color: "var(--dash-ink)" }}>{label}</div>
        {description && <div className="text-xs mt-1 leading-relaxed opacity-70" style={{ color: "var(--dash-muted)" }}>{description}</div>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative shrink-0 w-11 h-6 rounded-full transition-colors"
        style={{
          background: checked ? (danger ? "var(--dash-red, #ef4444)" : "var(--dash-blue)") : "var(--dash-border)",
        }}
      >
        <span
          className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all"
          style={{ left: checked ? "23px" : "3px" }}
        />
      </button>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-xs font-semibold uppercase tracking-wider mb-4 pb-2 border-b"
      style={{
        color: "var(--dash-muted)",
        borderColor: "var(--dash-border)",
      }}
    >
      {children}
    </h2>
  );
}

function TextInput({ id, label, value, onChange, placeholder, type = "text", hint }: any) {
  return (
    <label className="block w-full">
      <div className="text-xs font-medium mb-1.5" style={{ color: "var(--dash-muted)" }}>{label}</div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-lg text-sm border focus:outline-none transition-colors"
        style={{
          background: "transparent",
          borderColor: "var(--dash-border)",
          color: "var(--dash-ink)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--dash-blue)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--dash-border)")}
      />
      {hint && <div className="text-[11px] mt-1.5 opacity-70" style={{ color: "var(--dash-muted)" }}>{hint}</div>}
    </label>
  );
}

// ----- Main page -----
function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveMsg, setProfileSaveMsg] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; username: string; avatar_url?: string } | null>(null);

  // User profile editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Platform access
  const [loginEnabled, setLoginEnabled] = useState(true);
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [waitlistMode, setWaitlistMode] = useState(false);

  // General
  const [siteName, setSiteName] = useState("0cta");

  // Chatbot
  const [llmProvider, setLlmProvider] = useState<"local" | "claude" | "gemini" | "groq">("gemini");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [groqApiKey, setGroqApiKey] = useState("");

  // Admin wallets
  const [adminWallet1, setAdminWallet1] = useState("");
  const [adminWallet2, setAdminWallet2] = useState("");

  // User features
  const [chatEnabled, setChatEnabled] = useState(true);
  const [tasksEnabled, setTasksEnabled] = useState(true);

  // Token policy
  const [burnPolicy, setBurnPolicy] = useState<"per_request" | "per_action" | "monthly_cap">("per_request");
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    (async () => {
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
      const isWalletAdmin =
        userMeta.wallet_address && currentAdminWallets.includes(userMeta.wallet_address);

      setIsAdmin(isInitialAdmin || isWalletAdmin);

      setCurrentUser({
        email: session.user.email || "",
        name: userMeta.first_name ? `${userMeta.first_name} ${userMeta.last_name}` : "User",
        username: userMeta.username || session.user.email?.split("@")[0] || "user",
        avatar_url: userMeta.avatar_url,
      });

      setFirstName(userMeta.first_name || "");
      setLastName(userMeta.last_name || "");
      setAvatarUrl(userMeta.avatar_url || "");

      // Platform access
      setLoginEnabled(s.loginEnabled !== false);
      setSignupEnabled(s.signupEnabled !== false);
      setWaitlistMode(s.waitlistMode === true);

      // General
      setSiteName(s.siteName ?? "0cta");

      // Chatbot
      setLlmProvider(s.llmProvider ?? "local");
      setClaudeApiKey(s.claudeApiKey ?? "");
      setGeminiApiKey(s.geminiApiKey ?? "");
      setGroqApiKey(s.groqApiKey ?? "");

      // Admin wallets
      const wallets = s.adminWallets ?? [];
      setAdminWallet1(wallets[0] ?? "");
      setAdminWallet2(wallets[1] ?? "");

      // User features
      setChatEnabled(s.userFeatures?.chatEnabled ?? true);
      setTasksEnabled(s.userFeatures?.tasksEnabled ?? true);

      // Token
      setBurnPolicy(s.burnPolicy ?? "per_request");
      setWalletAddress(s.walletAddress ?? "");

      setLoading(false);
    })();
  }, [navigate]);

  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileSaveMsg("");
    try {
      let finalAvatarUrl = avatarUrl;
      
      if (avatarFile) {
        const { data: { session } } = await supabase.auth.getSession();
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${session?.user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);
          
        if (uploadError) {
          throw new Error("Failed to upload image. Ensure the 'avatars' storage bucket is created in Supabase.");
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        finalAvatarUrl = publicUrl;
      }

      const updates: any = { data: { first_name: firstName, last_name: lastName, avatar_url: finalAvatarUrl } };
      if (password) {
        updates.password = password;
      }
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      setProfileSaveMsg("Profile updated ✓");
      setCurrentUser(prev => prev ? { ...prev, name: `${firstName} ${lastName}`.trim(), avatar_url: finalAvatarUrl } : null);
      setAvatarUrl(finalAvatarUrl);
      setPassword("");
      setAvatarFile(null);
    } catch (err: any) {
      setProfileSaveMsg("Error: " + err.message);
    }
    setProfileSaving(false);
    setTimeout(() => setProfileSaveMsg(""), 3000);
  };

  const saveAdminSettings = async () => {
    if (!isAdmin) return;
    setSaving(true);
    setSaveMsg("");
    const adminWallets = [adminWallet1, adminWallet2].filter(Boolean);
    await appRepository.setSettings({
      siteName,
      loginEnabled,
      signupEnabled,
      waitlistMode,
      llmProvider,
      claudeApiKey,
      geminiApiKey,
      groqApiKey,
      adminWallets,
      userFeatures: { chatEnabled, tasksEnabled },
      burnPolicy,
      walletAddress,
      tokenEnabled: true,
      walletEnabled: true,
    });
    setSaving(false);
    setSaveMsg("Settings saved ✓");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--dash-bg)", color: "var(--dash-muted)" }}>
        Loading settings...
      </div>
    );
  }

  const selectClasses = "w-full px-3.5 py-2.5 rounded-lg text-sm border focus:outline-none transition-colors cursor-pointer appearance-none";

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
        className="relative mx-auto max-w-[1400px] grid grid-cols-12 gap-4 rounded-[28px] shadow-[0_30px_80px_-30px_rgba(60,80,180,0.25)] overflow-hidden min-h-[85vh]"
        style={{ background: "var(--dash-surface)" }}
      >
        {/* Settings Sidebar */}
        <aside
          className="hidden md:flex flex-col col-span-12 md:col-span-3 p-6"
          style={{ borderRight: "1px solid var(--dash-border)" }}
        >
          <div className="mb-8">
            <h1 className="font-serif-display text-2xl mb-1">0cta Settings</h1>
          </div>
          
          <nav className="flex-1 flex flex-col gap-1">
             <Link to="/dashboard" className="px-3 py-2.5 rounded-lg text-sm transition-opacity hover:opacity-70 font-medium" style={{ color: "var(--dash-muted)" }}>
               ← Back to Dashboard
             </Link>
             <div className="px-3 py-2.5 rounded-lg text-sm font-medium mt-2 shadow-sm" style={{ background: "var(--dash-blue)", color: "white" }}>
               {isAdmin ? "Admin Settings" : "Account Settings"}
             </div>
          </nav>

          <div className="mt-auto">
             <button
               onClick={handleSignOut}
               className="w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left text-red-500 hover:bg-red-50"
             >
               Sign Out
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="col-span-12 md:col-span-9 flex flex-col min-h-0 p-8 overflow-y-auto">
          <div className="max-w-[700px] w-full flex flex-col gap-12 pb-12">
            
            {/* ── User Profile ── */}
            <section>
              <SectionHeading>Your Profile</SectionHeading>
              
              <div className="flex items-center gap-4 p-5 rounded-2xl border mb-8" style={{ borderColor: "var(--dash-border)", background: "rgba(0,0,0,0.02)" }}>
                 <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold font-serif-display text-white shadow-inner" style={{ background: "linear-gradient(135deg, var(--dash-blue-soft), var(--dash-blue))" }}>
                    {currentUser?.name?.charAt(0).toUpperCase()}
                 </div>
                 <div>
                    <div className="font-semibold text-lg">{currentUser?.name}</div>
                    <div className="text-sm mt-0.5 opacity-70" style={{ color: "var(--dash-muted)" }}>{currentUser?.username} • {currentUser?.email}</div>
                 </div>
              </div>

              <div className="flex flex-col gap-5">
                {/* Avatar Upload */}
                <div className="flex items-center gap-6">
                  {avatarFile ? (
                    <img src={URL.createObjectURL(avatarFile)} alt="Avatar preview" className="w-16 h-16 rounded-full object-cover shadow-sm border border-[var(--dash-border)]" />
                  ) : currentUser?.avatar_url ? (
                    <img src={currentUser.avatar_url} alt="Current avatar" className="w-16 h-16 rounded-full object-cover shadow-sm border border-[var(--dash-border)]" />
                  ) : (
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold font-serif-display text-white shadow-inner" style={{ background: "linear-gradient(135deg, var(--dash-blue-soft), var(--dash-blue))" }}>
                      {currentUser?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors border" style={{ borderColor: "var(--dash-border)", background: "transparent", color: "var(--dash-ink)" }}>
                      Upload Picture
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                    </label>
                    <div className="text-xs mt-2 opacity-60" style={{ color: "var(--dash-muted)" }}>Recommended: Square JPG or PNG. Max 2MB.</div>
                  </div>
                </div>

                <div className="flex gap-4 mt-2">
                  <div className="flex-1">
                    <TextInput id="first-name" label="First Name" value={firstName} onChange={setFirstName} placeholder="First Name" />
                  </div>
                  <div className="flex-1">
                    <TextInput id="last-name" label="Last Name" value={lastName} onChange={setLastName} placeholder="Last Name" />
                  </div>
                </div>
                <div>
                   <TextInput type="password" id="password" label="New Password" value={password} onChange={setPassword} placeholder="Leave blank to keep current password" />
                </div>
                
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={saveProfile}
                    disabled={profileSaving}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity shadow-sm"
                    style={{ background: "var(--dash-blue)", opacity: profileSaving ? 0.7 : 1 }}
                  >
                    {profileSaving ? "Saving..." : "Save Profile"}
                  </button>
                  {profileSaveMsg && <span className="text-sm text-green-600 font-medium">{profileSaveMsg}</span>}
                </div>
              </div>
            </section>

            {isAdmin && (
              <>
                {/* ── Platform Access Controls ── */}
                <section>
                  <SectionHeading>Platform Access</SectionHeading>
                  <div className="flex flex-col gap-3">
                    <Toggle
                      id="toggle-login"
                      checked={loginEnabled}
                      onChange={setLoginEnabled}
                      label="Login Enabled"
                      description="When OFF, users visiting /login are redirected to the maintenance page."
                    />
                    <Toggle
                      id="toggle-signup"
                      checked={signupEnabled}
                      onChange={setSignupEnabled}
                      label="Signup Enabled"
                      description="When OFF, new account creation is blocked and users see the maintenance page."
                    />
                    <Toggle
                      id="toggle-waitlist"
                      checked={waitlistMode}
                      onChange={setWaitlistMode}
                      label="Waitlist Mode"
                      description='When ON, /signup redirects to the waitlist page. Users can join the waitlist but cannot sign up. Turn OFF when ready to open registration.'
                      danger={false}
                    />
                  </div>
                  {waitlistMode && (
                    <div className="mt-3 p-3.5 rounded-xl text-sm text-purple-700 bg-purple-50 border border-purple-100">
                      🕐 <strong>Waitlist is active.</strong> Signup is paused. When you're ready to launch, toggle Waitlist Mode OFF and ensure Signup is enabled.
                    </div>
                  )}
                </section>

                {/* ── Admin Wallets ── */}
                <section>
                  <SectionHeading>Admin Wallet Authorization</SectionHeading>
                  <p className="text-sm mb-4 leading-relaxed opacity-80" style={{ color: "var(--dash-muted)" }}>
                    Only these two wallets (plus hardcoded admin emails) can access this settings page and the full admin dashboard.
                  </p>
                  <div className="flex flex-col gap-4">
                    <TextInput
                      id="admin-wallet-1"
                      label="Developer Wallet 1"
                      value={adminWallet1}
                      onChange={setAdminWallet1}
                      placeholder="0x..."
                    />
                    <TextInput
                      id="admin-wallet-2"
                      label="Developer Wallet 2"
                      value={adminWallet2}
                      onChange={setAdminWallet2}
                      placeholder="0x..."
                      hint="Up to 2 developer wallets can be granted full admin access."
                    />
                  </div>
                </section>

                {/* ── User Feature Controls ── */}
                <section>
                  <SectionHeading>User Feature Controls</SectionHeading>
                  <p className="text-sm mb-4 leading-relaxed opacity-80" style={{ color: "var(--dash-muted)" }}>
                    Toggle which panels are visible to regular (non-admin) users on their dashboard.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Toggle
                      id="toggle-chat"
                      checked={chatEnabled}
                      onChange={setChatEnabled}
                      label="Enable AI Chat for Users"
                      description="Shows the AI assistant panel on the user dashboard."
                    />
                    <Toggle
                      id="toggle-tasks"
                      checked={tasksEnabled}
                      onChange={setTasksEnabled}
                      label="Enable Tasks View for Users"
                      description="Shows the tasks panel on the user dashboard."
                    />
                  </div>
                </section>

                {/* ── AI / Chatbot Provider ── */}
                <section>
                  <SectionHeading>AI Chatbot Provider</SectionHeading>
                  <div className="flex flex-col gap-4">
                    <label className="block w-full">
                      <div className="text-xs font-medium mb-1.5" style={{ color: "var(--dash-muted)" }}>LLM Provider</div>
                      <select
                        id="llm-provider"
                        value={llmProvider}
                        onChange={(e) => setLlmProvider(e.target.value as "local" | "claude" | "gemini" | "groq")}
                        className={selectClasses}
                        style={{ borderColor: "var(--dash-border)", background: "transparent", color: "var(--dash-ink)" }}
                      >
                        <option value="local">Local Mock Mode (Free — no API key needed)</option>
                        <option value="claude">Anthropic Claude Sonnet</option>
                        <option value="gemini">Google Gemini</option>
                        <option value="groq">Groq (Llama / Mixtral — Free tier available)</option>
                      </select>
                      <div className="text-[11px] mt-1.5 opacity-70" style={{ color: "var(--dash-muted)" }}>Select which AI model powers the 0cta assistant.</div>
                    </label>

                    {llmProvider === "claude" && (
                      <TextInput
                        id="claude-key"
                        label="Claude API Key"
                        type="password"
                        value={claudeApiKey}
                        onChange={setClaudeApiKey}
                        placeholder="sk-ant-..."
                        hint="Uses the Anthropic Messages API with Claude Sonnet."
                      />
                    )}

                    {llmProvider === "gemini" && (
                      <TextInput
                        id="gemini-key"
                        label="Gemini API Key"
                        type="password"
                        value={geminiApiKey}
                        onChange={setGeminiApiKey}
                        placeholder="AIzaSy..."
                      />
                    )}

                    {llmProvider === "groq" && (
                      <TextInput
                        id="groq-key"
                        label="Groq API Key"
                        type="password"
                        value={groqApiKey}
                        onChange={setGroqApiKey}
                        placeholder="gsk_..."
                        hint="Get a free key at console.groq.com"
                      />
                    )}
                  </div>
                </section>

                {/* ── General ── */}
                <section>
                  <SectionHeading>General Platform</SectionHeading>
                  <TextInput
                    id="site-name"
                    label="Site Name"
                    value={siteName}
                    onChange={setSiteName}
                    placeholder="0cta"
                  />
                </section>

                {/* ── Token & Payroll ── */}
                <section>
                  <SectionHeading>Token &amp; Payroll Policies</SectionHeading>
                  <div className="flex flex-col gap-4">
                    <label className="block w-full">
                      <div className="text-xs font-medium mb-1.5" style={{ color: "var(--dash-muted)" }}>Token Burn Policy</div>
                      <select
                        id="burn-policy"
                        value={burnPolicy}
                        onChange={(e) => setBurnPolicy(e.target.value as "per_request" | "per_action" | "monthly_cap")}
                        className={selectClasses}
                        style={{ borderColor: "var(--dash-border)", background: "transparent", color: "var(--dash-ink)" }}
                      >
                        <option value="per_request">Burn per Request</option>
                        <option value="per_action">Burn per Action</option>
                        <option value="monthly_cap">Monthly Cap</option>
                      </select>
                    </label>
                    <TextInput
                      id="treasury-wallet"
                      label="Treasury Wallet Address"
                      value={walletAddress}
                      onChange={setWalletAddress}
                      placeholder="0x..."
                      hint="Platform treasury address for token operations."
                    />
                  </div>
                </section>

                {/* Admin Save Button */}
                <div className="pt-6 border-t flex items-center gap-4 mt-4" style={{ borderColor: "var(--dash-border)" }}>
                  <button
                    id="save-settings-btn"
                    onClick={saveAdminSettings}
                    disabled={saving}
                    className="px-6 py-3 rounded-xl text-sm font-medium text-white transition-opacity shadow-sm"
                    style={{ background: "var(--dash-blue)", opacity: saving ? 0.7 : 1 }}
                  >
                    {saving ? "Saving..." : "Save Admin Settings"}
                  </button>
                  {saveMsg && <span className="text-sm text-green-600 font-medium">{saveMsg}</span>}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
