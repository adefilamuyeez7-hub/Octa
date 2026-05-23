import { useState } from 'react';

export default function Landing({ onEnter }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEnter = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    onEnter();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .fade-in { animation: fadeUp 0.6s ease-out; }
        .slide-down { animation: slideDown 0.6s ease-out; }
        .loading-pulse { animation: pulse 1.2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <header style={{ padding: '24px 0' }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
          }}>
            <span style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: '24px',
              fontWeight: 'semibold',
              letterSpacing: '-0.5px',
            }}>
              0cta<span style={{ color: '#60b3ff' }}>Yee</span>
            </span>
          </div>
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            fontSize: '14px',
            opacity: 0.8,
          }}>
            <button style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'background 0.3s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              Home
            </button>
            <button
              onClick={handleEnter}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'background 0.3s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              Dashboard
            </button>
          </nav>
          <button
            onClick={handleEnter}
            disabled={isLoading}
            style={{
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '8px 16px',
              background: 'transparent',
              color: '#ffffff',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s',
              opacity: isLoading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.background = 'transparent';
            }}
          >
            {isLoading ? 'Loading...' : 'Open Workspace'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}>
        <div style={{
          maxWidth: '1280px',
          width: '100%',
          padding: '80px 24px',
        }}>
          <div style={{
            borderRadius: '32px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
            padding: '60px',
            backdropFilter: 'blur(10px)',
            maxWidth: '1000px',
          }}>
            <div>
              <p style={{
                fontSize: '12px',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
                margin: 0,
                animation: 'slideDown 0.6s ease-out',
              }}>
                HR operations workspace
              </p>
              <h1 style={{
                marginTop: '20px',
                fontSize: '56px',
                fontWeight: '600',
                lineHeight: '1.1',
                margin: '20px 0 0 0',
                maxWidth: '600px',
                animation: 'fadeUp 0.6s ease-out 0.1s both',
              }}>
                One click<br />HR Manager
              </h1>
              <p style={{
                marginTop: '24px',
                maxWidth: '800px',
                fontSize: '18px',
                color: 'rgba(255,255,255,0.72)',
                lineHeight: '1.6',
                animation: 'fadeUp 0.6s ease-out 0.2s both',
              }}>
                Manage onboarding, team tasks, admin setup, and AI-assisted HR workflows from one workspace built to move fast.
              </p>

              {/* CTA Buttons */}
              <div style={{
                marginTop: '40px',
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                animation: 'fadeUp 0.6s ease-out 0.3s both',
              }}>
                <button
                  onClick={handleEnter}
                  disabled={isLoading}
                  style={{
                    borderRadius: '9999px',
                    background: '#ffffff',
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#000000',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    opacity: isLoading ? 0.7 : 1,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,255,255,0.15)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {isLoading ? <span className="loading-pulse">Loading...</span> : 'Open Workspace'}
                </button>
                <button style={{
                  borderRadius: '9999px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '12px 24px',
                  fontSize: '15px',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.9)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
                >
                  Learn More
                </button>
              </div>

              {/* Features Grid */}
              <div style={{
                marginTop: '40px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.68)',
                animation: 'fadeUp 0.6s ease-out 0.4s both',
              }}>
                <div style={{
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '16px',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
                >
                  Admin onboarding checklists
                </div>
                <div style={{
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '16px',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
                >
                  Notion sync for tasks and reviews
                </div>
                <div style={{
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '16px',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
                >
                  AI agent support for HR requests
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '32px 0',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '14px',
          opacity: 0.6,
        }}>
          <span>Copyright 2026 0cta Labs</span>
          <span>One click HR Manager</span>
        </div>
      </footer>
    </div>
  );
}
