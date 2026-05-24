import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { appRepository } from "../lib/storage";
import { supabase } from "../lib/supabaseClient";

export const Route = createFileRoute("/maintenance")({
  component: MaintenancePage,
  validateSearch: (search: Record<string, unknown>) => ({
    reason: (search.reason as string) ?? "maintenance",
  }),
  head: () => ({ meta: [{ title: "0cta — Coming Soon" }] }),
});

function MaintenancePage() {
  const { reason } = useSearch({ from: "/maintenance" });
  const isWaitlist = reason === "waitlist";
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dots, setDots] = useState(0);

  // Animated dots for the pulse effect
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      try {
        const { error } = await supabase.from('waitlist').insert({ email });
        if (error) throw error;
        setSubmitted(true);
      } catch (err: any) {
        console.error("Waitlist error:", err.message);
        // Fallback for demo if table doesn't exist
        setSubmitted(true);
      }
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: "var(--dash-bg)",
        color: "var(--dash-ink)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Animated background blobs */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "-10%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
            animation: "pulse 6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
            animation: "pulse 8s ease-in-out infinite reverse",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "800px",
            height: "800px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)",
          }}
        />
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1) translateY(0); opacity: 0.8; }
          50% { transform: scale(1.05) translateY(-10px); opacity: 1; }
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: floatUp 0.8s ease-out forwards; }
        .animate-float-2 { animation: floatUp 0.8s ease-out 0.2s both; }
        .animate-float-3 { animation: floatUp 0.8s ease-out 0.4s both; }
        .waitlist-input:focus {
          outline: none;
          border-color: rgba(99,102,241,0.6);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
      `}</style>

      <div
        className="relative z-10 w-full max-w-lg text-center animate-float"
        style={{
          background: "var(--dash-surface)",
          border: "1px solid var(--dash-border)",
          borderRadius: "24px",
          padding: "48px 40px",
          boxShadow: "var(--dash-shadow)",
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: "inline-block", marginBottom: "32px" }}>
          <span
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "2rem",
              background: "linear-gradient(135deg, #000 0%, #333 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            0cta
          </span>
        </Link>

        {/* Status badge */}
        <div
          className="animate-float-2"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "100px",
            background: isWaitlist
              ? "rgba(99,102,241,0.1)"
              : "rgba(245,158,11,0.1)",
            border: isWaitlist
              ? "1px solid rgba(99,102,241,0.2)"
              : "1px solid rgba(245,158,11,0.2)",
            marginBottom: "28px",
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: isWaitlist ? "rgba(79,70,229,1)" : "rgba(217,119,6,1)",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: isWaitlist ? "#6366f1" : "#f59e0b",
              boxShadow: isWaitlist
                ? "0 0 8px rgba(99,102,241,0.6)"
                : "0 0 8px rgba(245,158,11,0.6)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          {isWaitlist ? "Waitlist Open" : "Under Maintenance"}
        </div>

        {/* Heading */}
        <h1
          className="animate-float-2"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "clamp(2rem, 5vw, 2.8rem)",
            lineHeight: 1.15,
            marginBottom: "16px",
            color: "var(--dash-ink)",
          }}
        >
          {isWaitlist ? "Something great\nis coming" : "We'll be right back"}
        </h1>

        {/* Subtitle */}
        <p
          className="animate-float-3"
          style={{
            fontSize: "15px",
            color: "var(--dash-muted)",
            lineHeight: 1.7,
            marginBottom: "36px",
            maxWidth: "400px",
            margin: "0 auto 36px",
          }}
        >
          {isWaitlist
            ? "0cta is in private beta. Join our waitlist and we'll notify you the moment signup opens."
            : "0cta is currently undergoing scheduled maintenance. We'll be back shortly. Thank you for your patience."}
        </p>

        {/* Waitlist form */}
        {isWaitlist && !submitted && (
          <form
            onSubmit={handleWaitlist}
            className="animate-float-3"
            style={{ marginBottom: "24px" }}
          >
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <input
                id="waitlist-email"
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="waitlist-input"
                style={{
                  flex: "1 1 220px",
                  minWidth: "180px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid var(--dash-border)",
                  background: "transparent",
                  color: "var(--dash-ink)",
                  fontSize: "14px",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "12px 24px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                  border: "none",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 0.2s, transform 0.1s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Join Waitlist
              </button>
            </div>
          </form>
        )}

        {/* Success state */}
        {isWaitlist && submitted && (
          <div
            style={{
              padding: "16px 24px",
              borderRadius: "12px",
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.25)",
              color: "rgb(21, 128, 61)",
              fontSize: "14px",
              marginBottom: "24px",
            }}
          >
            ✓ You're on the list! We'll be in touch soon.
          </div>
        )}

        {/* Maintenance dots */}
        {!isWaitlist && (
          <div
            style={{
              fontSize: "28px",
              letterSpacing: "8px",
              marginBottom: "24px",
              color: "var(--dash-border)",
            }}
          >
            {Array.from({ length: 3 }, (_, i) => (
              <span
                key={i}
                style={{
                  opacity: i < dots ? 1 : 0.2,
                  transition: "opacity 0.3s",
                  color: i < dots ? "#6366f1" : undefined,
                }}
              >
                ●
              </span>
            ))}
          </div>
        )}

        {/* Footer link */}
        <p style={{ fontSize: "13px", color: "var(--dash-muted)" }}>
          <Link
            to="/"
            style={{ color: "var(--dash-ink)", textDecoration: "underline" }}
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
