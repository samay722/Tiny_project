export default function Navbar({ tabs, activeTab, onTabChange, user, onLogout }) {
  return (
    <nav style={s.nav}>
      {/* Logo */}
      <div style={s.logo}>
        <div className="pulse-dot" />
        <span style={s.logoText}>MedAI</span>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              ...s.tab,
              ...(activeTab === tab ? s.tabActive : {}),
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Right side — AI status + user info + logout */}
      <div style={s.right}>
        {/* AI Online badge */}
        <div style={s.status}>
          <div className="pulse-dot" style={{ width:7, height:7 }} />
          <span style={{ color:'#22c55e', fontSize:12, fontWeight:500 }}>AI Online</span>
        </div>

        {/* User info */}
        {user && (
          <div style={s.userBox}>
            <div style={s.avatar}>
              {user.name.charAt(0)}
            </div>
            <div style={s.userInfo}>
              <div style={s.userName}>{user.name}</div>
              <div style={s.userRole}>{user.role}</div>
            </div>
          </div>
        )}

        {/* Logout button */}
        {onLogout && (
          <button style={s.logoutBtn} onClick={onLogout} title="Sign out">
            ⏻
          </button>
        )}
      </div>
    </nav>
  );
}

const s = {
  nav: {
    display: 'flex', alignItems: 'center',
    gap: 8, padding: '0 20px', height: 52,
    background: '#141720',
    borderBottom: '1px solid #2e3348',
    flexShrink: 0, position: 'sticky', top: 0, zIndex: 100,
  },
  logo: {
    display: 'flex', alignItems: 'center',
    gap: 7, marginRight: 12, flexShrink: 0,
  },
  logoText: {
    fontFamily: 'var(--font-mono)', fontSize: 15,
    fontWeight: 700, color: '#e8ecf4', letterSpacing: '0.02em',
  },
  tabs: {
    display: 'flex', alignItems: 'center',
    gap: 2, flex: 1,
  },
  tab: {
    padding: '6px 14px', borderRadius: 8, border: 'none',
    background: 'none', color: '#8892b0', fontSize: 13,
    fontWeight: 500, transition: 'all 0.15s', whiteSpace: 'nowrap',
  },
  tabActive: { background: '#4f8ef7', color: '#fff' },
  right: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  status: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '4px 12px',
    background: 'rgba(34,197,94,0.08)', borderRadius: 20,
    border: '1px solid rgba(34,197,94,0.2)',
  },
  userBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '4px 10px', borderRadius: 10,
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'linear-gradient(135deg,#4f8ef7,#a78bfa)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  userInfo: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 },
  userRole: { fontSize: 10, color: 'var(--text-muted)', marginTop: 1 },
  logoutBtn: {
    width: 30, height: 30, borderRadius: 8,
    border: '1px solid var(--border)', background: 'none',
    color: 'var(--text-muted)', fontSize: 14, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'color 0.15s, border-color 0.15s',
  },
};