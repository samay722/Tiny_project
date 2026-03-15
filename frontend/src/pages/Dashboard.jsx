import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { MOCK_DASHBOARD } from '../utils/mockAI';

const SEV_COLOR  = { High:'#ef4444', Moderate:'#f59e0b', Normal:'#22c55e', Info:'#4f8ef7' };
const TYPE_COLOR = { Symptom:'#4f8ef7', Vision:'#a78bfa', RAG:'#2dd4bf', Agentic:'#f59e0b' };

export default function Dashboard() {
  const [stats]    = useState(MOCK_DASHBOARD.stats);
  const [activity] = useState(MOCK_DASHBOARD.recentActivity);
  const [weekly]   = useState(MOCK_DASHBOARD.weeklyData);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px' }}>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ fontSize:12, color:p.color, fontFamily:'var(--font-mono)' }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={s.page} className="fade-in">
      <div style={s.topBar}>
        <div>
          <h1 style={s.pageTitle}>Analytics Dashboard</h1>
          <div style={s.subtitle}>Real-time AI usage and performance metrics</div>
        </div>
        <div style={s.clockBox}>
          <div style={s.clock}>{time.toLocaleTimeString()}</div>
          <div style={s.date}>{time.toLocaleDateString(undefined, { weekday:'long', month:'short', day:'numeric' })}</div>
        </div>
      </div>

      <div style={s.statsRow}>
        {stats.map((st, i) => (
          <div key={i} style={s.statCard}>
            <div style={s.statLabel}>{st.label}</div>
            <div style={{ ...s.statValue, color: st.color }}>{st.value}</div>
            {st.delta && <div style={{ ...s.statDelta, color: st.delta.startsWith('+') ? '#22c55e' : '#ef4444' }}>{st.delta}</div>}
          </div>
        ))}
      </div>

      <div style={s.gridRow}>
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h3 style={s.cardTitle}>Weekly Usage</h3>
            <div style={s.legend}>
              {[['Symptom','#4f8ef7'],['Vision','#a78bfa'],['RAG','#2dd4bf']].map(([k,c]) => (
                <span key={k} style={s.legendItem}><span style={{...s.legendDot,background:c}}/>{k}</span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekly} barSize={10} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#2e3348" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize:11, fill:'#8892b0' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#8892b0' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="symptom" fill="#4f8ef7" radius={[3,3,0,0]} name="Symptom" />
              <Bar dataKey="vision"  fill="#a78bfa" radius={[3,3,0,0]} name="Vision"  />
              <Bar dataKey="rag"     fill="#2dd4bf" radius={[3,3,0,0]} name="RAG"     />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={s.card}>
          <h3 style={s.cardTitle}>Recent Activity</h3>
          {activity.map((a, i) => (
            <div key={i} style={s.actRow}>
              <span style={{ ...s.actType, background: TYPE_COLOR[a.type]+'22', color: TYPE_COLOR[a.type] }}>
                {a.type}
              </span>
              <div style={s.actBody}>
                <div style={s.actSummary}>{a.summary}</div>
                <div style={s.actTime}>{a.time}</div>
              </div>
              <span style={{ ...s.actSev, background: SEV_COLOR[a.severity]+'22', color: SEV_COLOR[a.severity] }}>
                {a.severity}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Accuracy Trend (7 days)</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={weekly.map((d,i) => ({ ...d, accuracy: 85 + Math.sin(i*0.8)*4 + Math.random()*2 }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3348" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize:11, fill:'#8892b0' }} axisLine={false} tickLine={false} />
            <YAxis domain={[80,100]} tick={{ fontSize:11, fill:'#8892b0' }} axisLine={false} tickLine={false} width={32}/>
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={2} dot={{ fill:'#22c55e', r:3 }} name="Accuracy %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={s.card}>
        <h3 style={s.cardTitle}>Module Status</h3>
        <div style={s.moduleGrid}>
          {[
            { name:'Symptom Checker', status:'Online', uptime:'99.9%', calls:247, color:'#22c55e' },
            { name:'Vision AI',       status:'Online', uptime:'99.7%', calls:89,  color:'#22c55e' },
            { name:'RAG Knowledge',   status:'Online', uptime:'100%',  calls:163, color:'#22c55e' },
            { name:'Agentic AI',      status:'Online', uptime:'98.2%', calls:41,  color:'#22c55e' },
          ].map((m, i) => (
            <div key={i} style={s.moduleCard}>
              <div style={s.moduleHeader}>
                <span style={s.moduleName}>{m.name}</span>
                <span style={{ ...s.moduleStatus, color:m.color, background:m.color+'22' }}>{m.status}</span>
              </div>
              <div style={s.moduleStats}>
                <span>Uptime: <strong style={{color:'var(--text-primary)'}}>{m.uptime}</strong></span>
                <span>Calls: <strong style={{color:'var(--text-primary)'}}>{m.calls}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:         { padding:'20px', maxWidth:1100, margin:'0 auto' },
  topBar:       { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  pageTitle:    { fontSize:20, fontWeight:700, color:'var(--text-primary)', margin:0 },
  subtitle:     { fontSize:13, color:'var(--text-muted)', marginTop:3 },
  clockBox:     { textAlign:'right' },
  clock:        { fontFamily:'var(--font-mono)', fontSize:20, fontWeight:700, color:'var(--accent)' },
  date:         { fontSize:12, color:'var(--text-muted)', marginTop:2 },
  statsRow:     { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:16 },
  statCard:     { background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'16px', textAlign:'center' },
  statLabel:    { fontSize:11, color:'var(--text-muted)', marginBottom:8, fontWeight:500 },
  statValue:    { fontSize:28, fontWeight:700, fontFamily:'var(--font-mono)', lineHeight:1 },
  statDelta:    { fontSize:12, fontWeight:600, marginTop:6 },
  gridRow:      { display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16, marginBottom:16 },
  card:         { background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px', marginBottom:16 },
  cardHeader:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 },
  cardTitle:    { fontSize:14, fontWeight:600, color:'var(--text-primary)', margin:0 },
  legend:       { display:'flex', gap:12 },
  legendItem:   { display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-muted)' },
  legendDot:    { width:8, height:8, borderRadius:'50%' },
  actRow:       { display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' },
  actType:      { fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:10, flexShrink:0, letterSpacing:'0.05em' },
  actBody:      { flex:1, minWidth:0 },
  actSummary:   { fontSize:12, color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  actTime:      { fontSize:11, color:'var(--text-muted)', marginTop:2 },
  actSev:       { fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:10, flexShrink:0, letterSpacing:'0.05em' },
  moduleGrid:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:4 },
  moduleCard:   { background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px' },
  moduleHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  moduleName:   { fontSize:12, fontWeight:600, color:'var(--text-primary)' },
  moduleStatus: { fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:10, letterSpacing:'0.05em' },
  moduleStats:  { display:'flex', flexDirection:'column', gap:3, fontSize:11, color:'var(--text-muted)' },
};