import { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError(''); setLoading(true);

    // Simulate auth delay (replace with real API call later)
    await new Promise(r => setTimeout(r, 1200));

    // Demo credentials check — replace with real API call
    const DEMO_USERS = [
      { email: 'doctor@medai.com', password: 'medai123', name: 'Dr. Aisha Khan', role: 'Chief Physician' },
      { email: 'admin@medai.com',  password: 'admin123',  name: 'Admin User',     role: 'Administrator' },
    ];

    const user = DEMO_USERS.find(u => u.email === email && u.password === password);

    if (user) {
      localStorage.setItem('medai_user', JSON.stringify(user));
      onLogin(user);
    } else {
      setError('Invalid credentials. Try doctor@medai.com / medai123');
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      {/* Background glow orbs */}
      <div style={s.orb1} />
      <div style={s.orb2} />

      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>
          <div style={s.logoIcon}>
            <span style={s.pulse} />
            <span style={s.logoSymbol}>⚕</span>
          </div>
          <h1 style={s.logoText}>MedAI</h1>
        </div>

        <p style={s.tagline}>Clinical Intelligence Platform</p>

        <div style={s.divider} />

        <h2 style={s.heading}>Sign in to your account</h2>
        <p style={s.subheading}>Access AI-powered diagnostics and clinical tools</p>

        {error && (
          <div style={s.errorBox}>
            <span style={s.errorIcon}>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email Address</label>
            <input
              id="login-email"
              type="email"
              style={s.input}
              placeholder="doctor@medai.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.passwordWrap}>
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                style={{ ...s.input, paddingRight: 44 }}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPass(p => !p)}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button type="submit" id="login-btn" style={s.submitBtn} disabled={loading}>
            {loading
              ? <span className="loading-dots"><span/><span/><span/></span>
              : 'Sign In'
            }
          </button>
        </form>

        {/* Demo hint */}
        <div style={s.demoBox}>
          <div style={s.demoTitle}>Demo Credentials</div>
          <div style={s.demoRow}>
            <span style={s.demoKey}>Physician:</span>
            <code style={s.demoVal}>doctor@medai.com / medai123</code>
          </div>
          <div style={s.demoRow}>
            <span style={s.demoKey}>Admin:</span>
            <code style={s.demoVal}>admin@medai.com / admin123</code>
          </div>
        </div>

        <p style={s.footer}>
          MedAI v1.0.0 &nbsp;•&nbsp; Powered by Llama 3 + FastAPI
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-base)',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  orb1: {
    position: 'absolute', top: '-10%', left: '-5%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute', bottom: '-10%', right: '-5%',
    width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%', maxWidth: 420,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '36px 32px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeIn 0.4s ease',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    justifyContent: 'center', marginBottom: 6,
  },
  logoIcon: {
    position: 'relative', width: 36, height: 36,
    background: 'linear-gradient(135deg,#4f8ef7,#a78bfa)',
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  pulse: {
    position: 'absolute', inset: -3, borderRadius: 13,
    border: '1.5px solid rgba(79,142,247,0.4)',
    animation: 'pulse 2s infinite',
  },
  logoSymbol: { fontSize: 18, color: '#fff', position: 'relative', zIndex: 1 },
  logoText: {
    fontSize: 26, fontWeight: 800, color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
  },
  tagline: {
    textAlign: 'center', fontSize: 12, color: 'var(--text-muted)',
    letterSpacing: '0.12em', fontWeight: 500, marginBottom: 20,
  },
  divider: {
    height: 1, background: 'var(--border)',
    marginBottom: 24,
  },
  heading: {
    fontSize: 18, fontWeight: 700, color: 'var(--text-primary)',
    marginBottom: 4, textAlign: 'center',
  },
  subheading: {
    fontSize: 13, color: 'var(--text-muted)',
    textAlign: 'center', marginBottom: 22,
  },
  errorBox: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 8, padding: '10px 14px',
    color: '#ef4444', fontSize: 13,
    marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center',
  },
  errorIcon: { fontSize: 15 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em' },
  input: {
    padding: '11px 14px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 10, color: 'var(--text-primary)',
    fontSize: 14, outline: 'none',
    transition: 'border-color 0.15s',
    width: '100%', boxSizing: 'border-box',
  },
  passwordWrap: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', fontSize: 16, cursor: 'pointer',
    color: 'var(--text-muted)', lineHeight: 1, padding: 0,
  },
  submitBtn: {
    width: '100%', padding: '13px',
    background: 'linear-gradient(135deg, #4f8ef7, #6366f1)',
    border: 'none', borderRadius: 10,
    color: '#fff', fontSize: 15, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 48, marginTop: 4,
    boxShadow: '0 4px 20px rgba(79,142,247,0.35)',
    transition: 'opacity 0.15s, transform 0.1s',
  },
  demoBox: {
    marginTop: 24, padding: '14px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 10,
  },
  demoTitle: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 },
  demoRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  demoKey: { fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, minWidth: 60 },
  demoVal: {
    fontSize: 11, color: 'var(--accent)', background: 'rgba(79,142,247,0.1)',
    padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-mono)',
  },
  footer: { textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 20 },
};
