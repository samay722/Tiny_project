import { useState, useEffect, useRef } from 'react';
import { mockAgenticTask } from '../utils/mockAI';

const PRESET_TASKS = [
  { label:'Drug Interaction Check', prompt:'Check drug interactions for: Warfarin 5mg, Aspirin 100mg, Metformin 500mg, Atorvastatin 20mg' },
  { label:'Treatment Protocol',     prompt:'Generate treatment protocol for newly diagnosed Type 2 Diabetes patient, age 55, BMI 30' },
  { label:'Differential Diagnosis', prompt:'Provide ranked differential diagnosis for: 45yo male, acute onset fever 39.2°C, productive cough, chest tightness, SpO2 93%' },
  { label:'Lab Report Summary',     prompt:'Summarise and flag critical values from: HbA1c 9.2%, FBG 14.1mmol/L, LDL 4.8, BP 158/96, eGFR 62' },
  { label:'Medication Dosage',      prompt:'Calculate safe dosage for Amoxicillin in a 7-year-old child weighing 24kg with acute otitis media' },
];

const STEP_COLORS = { done:'#22c55e', running:'#4f8ef7', pending:'#4a5168', error:'#ef4444' };

export default function AgenticAI() {
  const [task, setTask]         = useState('');
  const [steps, setSteps]       = useState([]);
  const [running, setRunning]   = useState(false);
  const [finalResult, setFinal] = useState(null);
  const [log, setLog]           = useState([]);
  const logRef = useRef();

  const addLog = (msg) => setLog(l => [...l, { time: new Date().toLocaleTimeString(), msg }]);

  const runTask = async (t) => {
    const text = t || task;
    if (!text.trim()) return;
    setSteps([]); setFinal(null); setLog([]); setRunning(true);
    addLog(`Task initiated: "${text.slice(0,60)}..."`);
    const initialSteps = await mockAgenticTask(text);
    setSteps(initialSteps);
    for (let i = 0; i < initialSteps.length; i++) {
      await new Promise(r => setTimeout(r, 900 + Math.random()*600));
      setSteps(prev => prev.map((s, idx) => ({
        ...s,
        status: idx < i ? 'done' : idx === i ? 'done' : idx === i+1 ? 'running' : 'pending',
        detail: idx === i ? getStepDetail(idx, text) : s.detail,
      })));
      addLog(`Step ${i+1} completed: ${initialSteps[i].label}`);
    }
    setFinal(generateResult(text));
    addLog('Task complete. Report generated.');
    setRunning(false);
  };

  const getStepDetail = (idx, text) => {
    const details = [
      `Parsed: "${text.slice(0,50)}${text.length>50?'...':''}"`,
      'Retrieved 24 relevant documents from medical databases',
      'Matched against 8 clinical guidelines',
      'Synthesised findings from 3 primary sources',
      'Structured report ready',
    ];
    return details[idx] || '';
  };

  const generateResult = (text) => ({
    summary: `Agentic analysis completed for: "${text.slice(0,80)}${text.length>80?'...':''}"`,
    sections: [
      { title:'Primary Finding', content:'Analysis identified key clinical considerations based on the provided parameters. Multiple data sources were cross-referenced to ensure accuracy.' },
      { title:'Evidence Base', content:'Recommendations are supported by current clinical guidelines including WHO protocols, NICE guidelines, and peer-reviewed literature.' },
      { title:'Action Items', content:'1. Immediate clinical review recommended.\n2. Follow-up investigations as indicated.\n3. Patient education and monitoring plan established.' },
      { title:'Confidence', content:'Analysis confidence: 87.3% — based on quality and consistency of indexed sources.' },
    ],
  });

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  return (
    <div style={s.page}>
      <div style={s.layout}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={s.card}>
            <h2 style={s.cardTitle}>Agentic AI</h2>
            <p style={s.cardSub}>Give the AI a complex medical task. It autonomously plans, retrieves data, and generates a structured report.</p>
            <textarea style={s.textarea} value={task} onChange={e => setTask(e.target.value)}
              placeholder="Describe a medical task for the AI agent to complete..." rows={4} />
            <button style={s.btn} onClick={() => runTask()} disabled={running || !task.trim()}>
              {running ? <span className="loading-dots"><span/><span/><span/></span> : 'Run Agent'}
            </button>
            <div style={s.sectionLabel}>PRESET TASKS</div>
            {PRESET_TASKS.map((p, i) => (
              <button key={i} style={s.presetBtn} onClick={() => { setTask(p.prompt); runTask(p.prompt); }}>
                <span style={s.presetLabel}>{p.label}</span>
                <span style={s.presetArrow}>→</span>
              </button>
            ))}
          </div>
          {log.length > 0 && (
            <div style={s.card}>
              <div style={s.sectionLabel}>AGENT LOG</div>
              <div style={s.logBox} ref={logRef}>
                {log.map((l, i) => (
                  <div key={i} style={s.logLine}>
                    <span style={s.logTime}>{l.time}</span>
                    <span style={s.logMsg}>{l.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {steps.length > 0 && (
            <div style={s.card}>
              <div style={s.sectionLabel}>EXECUTION PLAN</div>
              {steps.map((step, i) => (
                <div key={i} style={s.stepRow}>
                  <div style={{ ...s.stepDot, background: STEP_COLORS[step.status] }}>
                    {step.status === 'done'    && <span style={{fontSize:10}}>✓</span>}
                    {step.status === 'running' && <span className="loading-dots" style={{transform:'scale(0.6)'}}><span/><span/><span/></span>}
                    {step.status === 'pending' && <span style={{fontSize:10, color:'#4a5168'}}>{i+1}</span>}
                  </div>
                  <div style={s.stepBody}>
                    <div style={{ ...s.stepLabel, color: step.status === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {step.label}
                    </div>
                    {step.detail && <div style={s.stepDetail}>{step.detail}</div>}
                  </div>
                  <span style={{ ...s.stepStatus, color: STEP_COLORS[step.status] }}>{step.status}</span>
                </div>
              ))}
            </div>
          )}
          {finalResult && (
            <div style={s.card} className="fade-in">
              <h3 style={s.resultTitle}>Agent Report</h3>
              <p style={s.resultSummary}>{finalResult.summary}</p>
              {finalResult.sections.map((sec, i) => (
                <div key={i} style={s.section}>
                  <div style={s.secTitle}>{sec.title}</div>
                  <p style={s.secContent}>{sec.content}</p>
                </div>
              ))}
            </div>
          )}
          {!steps.length && !running && (
            <div style={{ ...s.card, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:360, gap:8 }}>
              <div style={{fontSize:44,marginBottom:8}}>🤖</div>
              <div style={{fontSize:15,fontWeight:500,color:'var(--text-secondary)'}}>No active task</div>
              <div style={{fontSize:13,color:'var(--text-muted)'}}>Enter a task or use a preset to start the agent</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:         { padding:'20px', maxWidth:1100, margin:'0 auto' },
  layout:       { display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:16, alignItems:'start' },
  card:         { background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px' },
  cardTitle:    { fontSize:16, fontWeight:600, color:'var(--text-primary)', marginBottom:6 },
  cardSub:      { fontSize:13, color:'var(--text-muted)', marginBottom:14, lineHeight:1.5 },
  sectionLabel: { fontSize:10, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:10, marginTop:14 },
  textarea:     { width:'100%', padding:'10px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', fontSize:13, outline:'none', resize:'vertical', lineHeight:1.6, boxSizing:'border-box' },
  btn:          { width:'100%', marginTop:10, padding:'11px', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', minHeight:42 },
  presetBtn:    { width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, marginBottom:7, color:'var(--text-secondary)', fontSize:13 },
  presetLabel:  { fontWeight:500 },
  presetArrow:  { color:'var(--accent)', fontSize:16 },
  logBox:       { background:'var(--bg-base)', borderRadius:8, padding:'10px', maxHeight:160, overflowY:'auto', border:'1px solid var(--border)' },
  logLine:      { display:'flex', gap:10, marginBottom:5, fontSize:11 },
  logTime:      { color:'var(--text-muted)', fontFamily:'var(--font-mono)', flexShrink:0 },
  logMsg:       { color:'var(--teal)' },
  stepRow:      { display:'flex', alignItems:'flex-start', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' },
  stepDot:      { width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 },
  stepBody:     { flex:1 },
  stepLabel:    { fontSize:13, fontWeight:500, marginBottom:3 },
  stepDetail:   { fontSize:11, color:'var(--text-muted)' },
  stepStatus:   { fontSize:11, fontFamily:'var(--font-mono)', fontWeight:600, flexShrink:0 },
  resultTitle:  { fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:6 },
  resultSummary:{ fontSize:13, color:'var(--text-muted)', marginBottom:14, lineHeight:1.5 },
  section:      { padding:'12px 14px', background:'var(--bg-elevated)', borderRadius:8, marginBottom:10, border:'1px solid var(--border)' },
  secTitle:     { fontSize:12, fontWeight:700, color:'var(--accent)', marginBottom:6, letterSpacing:'0.04em' },
  secContent:   { fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, margin:0, whiteSpace:'pre-line' },
};