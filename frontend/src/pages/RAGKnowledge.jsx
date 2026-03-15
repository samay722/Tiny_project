import { useState } from 'react';
import { mockRAGQuery } from '../utils/mockAI';

const SAMPLE_QUERIES = [
  'What are the diagnostic criteria for Type 2 Diabetes?',
  'First-line treatment for hypertension in elderly patients',
  'Differential diagnosis for acute chest pain',
  'Drug interactions with warfarin',
  'Sepsis management protocol 2024',
  'Paediatric fever management guidelines',
];

export default function RAGKnowledge() {
  const [question, setQuestion] = useState('');
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [history, setHistory]   = useState([]);

  const query = async (q) => {
    const text = q || question;
    if (!text.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await mockRAGQuery(text);
      setResult({ question: text, ...res });
      setHistory(h => [{ question: text, answer: res.answer }, ...h].slice(0, 5));
      setQuestion('');
    } finally {
      setLoading(false);
    }
  };

  const SOURCE_COLORS = { Guideline:'#4f8ef7', Reference:'#a78bfa', Research:'#2dd4bf', Database:'#22c55e' };

  return (
    <div style={s.page}>
      <div style={s.layout}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={s.card}>
            <h2 style={s.cardTitle}>RAG Knowledge Base</h2>
            <p style={s.cardSub}>Ask medical questions. AI retrieves answers from indexed clinical databases, guidelines, and research papers.</p>
            <div style={s.inputRow}>
              <input style={s.input} value={question} onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && query()} placeholder="Ask a clinical question..." />
              <button style={s.sendBtn} onClick={() => query()} disabled={loading || !question.trim()}>
                {loading ? '...' : '→'}
              </button>
            </div>
            <div style={s.sectionLabel}>SAMPLE QUERIES</div>
            <div style={s.sampleList}>
              {SAMPLE_QUERIES.map((q, i) => (
                <button key={i} style={s.sampleBtn} onClick={() => query(q)}>{q}</button>
              ))}
            </div>
          </div>
          {history.length > 0 && (
            <div style={s.card}>
              <div style={s.sectionLabel}>RECENT QUERIES</div>
              {history.map((h, i) => (
                <button key={i} style={s.historyItem} onClick={() => query(h.question)}>
                  <span style={s.histIcon}>↺</span>
                  <span style={s.histText}>{h.question}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={s.card}>
          {!result && !loading && (
            <div style={s.empty}>
              <div style={{fontSize:44,marginBottom:12}}>📚</div>
              <div style={s.emptyTitle}>Ask a medical question</div>
              <div style={s.emptySub}>Powered by RAG over clinical databases</div>
            </div>
          )}
          {loading && (
            <div style={s.empty}>
              <span className="loading-dots"><span/><span/><span/></span>
              <div style={{...s.emptyTitle, marginTop:16}}>Retrieving knowledge...</div>
              <div style={s.emptySub}>Searching indexed medical databases</div>
            </div>
          )}
          {result && !loading && (
            <div className="fade-in">
              <div style={s.questionBubble}>
                <span style={s.qIcon}>Q</span>
                <span style={s.questionText}>{result.question}</span>
              </div>
              <div style={s.sectionLabel}>ANSWER</div>
              <div style={s.answerBox}>
                {result.answer.split('\n\n').map((para, i) => (
                  <p key={i} style={s.answerPara}
                    dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                ))}
              </div>
              <div style={s.sectionLabel}>SOURCES ({result.sources.length})</div>
              {result.sources.map((src, i) => (
                <div key={i} style={s.sourceRow}>
                  <div style={s.sourceLeft}>
                    <span style={{ ...s.sourceType, background: SOURCE_COLORS[src.type]+'22', color: SOURCE_COLORS[src.type] }}>
                      {src.type}
                    </span>
                    <span style={s.sourceTitle}>{src.title}</span>
                  </div>
                  <div style={s.relevanceWrap}>
                    <div style={s.relevanceBar}>
                      <div style={{ ...s.relevanceFill, width:`${src.relevance}%` }} />
                    </div>
                    <span style={s.relevanceNum}>{src.relevance}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:         { padding:'20px', maxWidth:1100, margin:'0 auto' },
  layout:       { display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:16, alignItems:'start' },
  card:         { background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px' },
  cardTitle:    { fontSize:16, fontWeight:600, color:'var(--text-primary)', marginBottom:6 },
  cardSub:      { fontSize:13, color:'var(--text-muted)', marginBottom:16, lineHeight:1.5 },
  sectionLabel: { fontSize:10, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:10, marginTop:14 },
  inputRow:     { display:'flex', gap:8 },
  input:        { flex:1, padding:'10px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)', fontSize:13, outline:'none' },
  sendBtn:      { padding:'10px 16px', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', fontSize:16, fontWeight:700, flexShrink:0 },
  sampleList:   { display:'flex', flexDirection:'column', gap:6 },
  sampleBtn:    { padding:'8px 12px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-secondary)', fontSize:12, textAlign:'left', transition:'border-color .15s' },
  historyItem:  { display:'flex', alignItems:'center', gap:10, padding:'7px 10px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, marginBottom:6, color:'var(--text-secondary)', fontSize:12, textAlign:'left', width:'100%' },
  histIcon:     { color:'var(--accent)', flexShrink:0, fontSize:14 },
  histText:     { overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  empty:        { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:6 },
  emptyTitle:   { fontSize:15, fontWeight:500, color:'var(--text-secondary)' },
  emptySub:     { fontSize:13, color:'var(--text-muted)' },
  questionBubble:{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', background:'rgba(79,142,247,0.1)', border:'1px solid var(--accent-dim)', borderRadius:10, marginBottom:4 },
  qIcon:        { fontSize:11, fontWeight:700, background:'var(--accent)', color:'#fff', borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 },
  questionText: { fontSize:13, color:'var(--text-primary)', lineHeight:1.5, fontWeight:500 },
  answerBox:    { background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', marginBottom:4 },
  answerPara:   { fontSize:13, color:'var(--text-secondary)', lineHeight:1.7, marginBottom:10 },
  sourceRow:    { display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, padding:'8px 12px', background:'var(--bg-elevated)', borderRadius:8, marginBottom:7, border:'1px solid var(--border)' },
  sourceLeft:   { display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 },
  sourceType:   { fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:10, flexShrink:0, letterSpacing:'0.05em' },
  sourceTitle:  { fontSize:12, color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  relevanceWrap:{ display:'flex', alignItems:'center', gap:7, flexShrink:0 },
  relevanceBar: { width:60, height:4, background:'var(--border)', borderRadius:2, overflow:'hidden' },
  relevanceFill:{ height:'100%', background:'var(--accent)', borderRadius:2 },
  relevanceNum: { fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-muted)', width:32, textAlign:'right' },
};