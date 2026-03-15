import { useState } from 'react';
import { mockSymptomAnalysis } from '../utils/mockAI';

const COMMON_SYMPTOMS = [
  'Fever', 'Cough', 'Fatigue', 'Headache',
  'Chest pain', 'Shortness of breath', 'Nausea', 'Joint pain',
  'Rash', 'Night sweats', 'Weight loss', 'Dizziness',
  'Palpitations', 'Abdominal pain', 'Back pain', 'Sore throat',
  'Runny nose', 'Muscle ache',
];

const DURATIONS = ['< 24 hours', '1–3 days', '3–7 days', '1–2 weeks', '> 2 weeks'];
const SEVERITY_COLOR = { High: '#ef4444', Moderate: '#f59e0b', Low: '#22c55e', Normal: '#22c55e' };

export default function SymptomChecker() {
  const [selected, setSelected]   = useState([]);
  const [custom, setCustom]       = useState('');
  const [age, setAge]             = useState(35);
  const [duration, setDuration]   = useState('1–3 days');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const toggleSymptom = (s) => {
    setSelected(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const addCustom = (e) => {
    if (e.key === 'Enter' && custom.trim()) {
      const val = custom.trim();
      if (!selected.includes(val)) setSelected(prev => [...prev, val]);
      setCustom('');
    }
  };

  const analyze = async () => {
    const all = [...selected];
    if (!all.length) { setError('Select at least one symptom.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const res = await mockSymptomAnalysis(all, age, duration);
      setResult(res);
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.layout}>
        <div style={s.card}>
          <h2 style={s.cardTitle}>Select symptoms</h2>
          <div style={s.sectionLabel}>COMMON SYMPTOMS</div>
          <div style={s.grid}>
            {COMMON_SYMPTOMS.map(sym => (
              <button key={sym} onClick={() => toggleSymptom(sym)}
                style={{ ...s.symBtn, ...(selected.includes(sym) ? s.symBtnActive : {}) }}>
                {sym}
              </button>
            ))}
          </div>
          <div style={s.sectionLabel}>ADD CUSTOM SYMPTOM</div>
          <input style={s.customInput} placeholder="e.g. neck stiffness, blurred vision..."
            value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={addCustom} />
          {selected.length > 0 && (
            <div style={s.selectedRow}>
              {selected.map(sym => (
                <span key={sym} style={s.selectedPill}>
                  {sym}
                  <button style={s.removeBtn} onClick={() => toggleSymptom(sym)}>×</button>
                </span>
              ))}
            </div>
          )}
          <div style={s.controls}>
            <div>
              <div style={s.sectionLabel}>PATIENT AGE</div>
              <div style={s.ageRow}>
                <span style={s.ageLabel}>Age: {age} yrs</span>
                <input type="range" min={1} max={100} value={age}
                  onChange={e => setAge(Number(e.target.value))} style={s.slider} />
              </div>
            </div>
            <div>
              <div style={s.sectionLabel}>DURATION</div>
              <select value={duration} onChange={e => setDuration(e.target.value)} style={s.select}>
                {DURATIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          {error && <div style={s.errorBox}>{error}</div>}
          <button style={s.analyzeBtn} onClick={analyze} disabled={loading}>
            {loading ? <span className="loading-dots"><span/><span/><span/></span> : 'Analyze with AI'}
          </button>
        </div>

        <div style={s.card}>
          {!result && !loading && (
            <div style={s.empty}>
              <div style={s.emptyIcon}>🔍</div>
              <div style={s.emptyTitle}>No analysis yet</div>
              <div style={s.emptySub}>Select symptoms and click Analyze</div>
            </div>
          )}
          {loading && (
            <div style={s.empty}>
              <div style={{ marginBottom:16 }}>
                <span className="loading-dots"><span/><span/><span/></span>
              </div>
              <div style={s.emptyTitle}>Analysing symptoms...</div>
              <div style={s.emptySub}>Querying AI models and medical databases</div>
            </div>
          )}
          {result && !loading && (
            <div className="fade-in">
              <h3 style={s.resultTitle}>AI Analysis Result</h3>
              <p style={s.resultSummary}>{result.summary}</p>
              <div style={s.sectionLabel}>POSSIBLE CONDITIONS</div>
              {result.conditions.map((c, i) => (
                <div key={i} style={s.conditionCard}>
                  <div style={s.condHeader}>
                    <span style={s.condName}>{c.name}</span>
                    <div style={s.condRight}>
                      <span style={{ ...s.severityBadge, background: SEVERITY_COLOR[c.severity] + '22', color: SEVERITY_COLOR[c.severity] }}>
                        {c.severity}
                      </span>
                      <span style={s.probability}>{c.probability}%</span>
                    </div>
                  </div>
                  <div style={s.probBar}>
                    <div style={{ ...s.probFill, width: `${c.probability}%`, background: SEVERITY_COLOR[c.severity] }} />
                  </div>
                  <p style={s.condDesc}>{c.description}</p>
                </div>
              ))}
              <div style={s.sectionLabel}>RECOMMENDATIONS</div>
              <ul style={s.recList}>
                {result.recommendations.map((r, i) => (
                  <li key={i} style={s.recItem}>
                    <span style={s.recDot} />{r}
                  </li>
                ))}
              </ul>
              <div style={s.disclaimer}>{result.disclaimer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:        { padding:'20px', maxWidth:1100, margin:'0 auto' },
  layout:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' },
  card:        { background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px', minHeight:500 },
  cardTitle:   { fontSize:16, fontWeight:600, color:'var(--text-primary)', marginBottom:16 },
  sectionLabel:{ fontSize:10, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:10, marginTop:14 },
  grid:        { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 },
  symBtn:      { padding:'8px 10px', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text-secondary)', fontSize:13, textAlign:'center', transition:'all 0.15s' },
  symBtnActive:{ background:'var(--accent)', borderColor:'var(--accent)', color:'#fff', fontWeight:500 },
  customInput: { width:'100%', padding:'9px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-secondary)', fontSize:13, outline:'none', boxSizing:'border-box' },
  selectedRow: { display:'flex', flexWrap:'wrap', gap:6, marginTop:10, marginBottom:4 },
  selectedPill:{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', background:'rgba(79,142,247,0.15)', border:'1px solid var(--accent-dim)', borderRadius:20, fontSize:12, color:'var(--accent)' },
  removeBtn:   { background:'none', border:'none', color:'var(--accent)', fontSize:15, lineHeight:1, padding:0, marginLeft:2 },
  controls:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:6 },
  ageRow:      { display:'flex', flexDirection:'column', gap:4 },
  ageLabel:    { fontSize:13, color:'var(--text-secondary)', fontFamily:'var(--font-mono)' },
  slider:      { width:'100%', accentColor:'var(--accent)' },
  select:      { width:'100%', padding:'8px 10px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', fontSize:13, outline:'none' },
  analyzeBtn:  { width:'100%', marginTop:16, padding:'11px', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, transition:'opacity 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:8, minHeight:42 },
  errorBox:    { background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'8px 12px', color:'#ef4444', fontSize:13, marginTop:10 },
  empty:       { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:8 },
  emptyIcon:   { fontSize:40, marginBottom:8 },
  emptyTitle:  { fontSize:15, fontWeight:500, color:'var(--text-secondary)' },
  emptySub:    { fontSize:13, color:'var(--text-muted)' },
  resultTitle: { fontSize:15, fontWeight:600, marginBottom:8, color:'var(--text-primary)' },
  resultSummary:{ fontSize:13, color:'var(--text-secondary)', marginBottom:4, lineHeight:1.6 },
  conditionCard:{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', marginBottom:10 },
  condHeader:  { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 },
  condName:    { fontSize:14, fontWeight:600, color:'var(--text-primary)' },
  condRight:   { display:'flex', alignItems:'center', gap:8 },
  severityBadge:{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:10 },
  probability: { fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, color:'var(--text-primary)' },
  probBar:     { height:4, background:'var(--border)', borderRadius:2, overflow:'hidden', marginBottom:8 },
  probFill:    { height:'100%', borderRadius:2, transition:'width 0.6s' },
  condDesc:    { fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 },
  recList:     { listStyle:'none', display:'flex', flexDirection:'column', gap:7, marginBottom:14 },
  recItem:     { display:'flex', alignItems:'flex-start', gap:8, fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 },
  recDot:      { width:6, height:6, borderRadius:'50%', background:'var(--accent)', flexShrink:0, marginTop:5 },
  disclaimer:  { fontSize:11, color:'var(--text-muted)', borderTop:'1px solid var(--border)', paddingTop:12, lineHeight:1.5 },
};