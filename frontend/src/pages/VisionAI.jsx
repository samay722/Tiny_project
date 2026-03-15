import { useState, useRef } from 'react';
import { mockVisionAnalysis } from '../utils/mockAI';

const SEVERITY_COLOR = { Normal:'#22c55e', Mild:'#f59e0b', Moderate:'#f59e0b', Severe:'#ef4444', Critical:'#ef4444' };

export default function VisionAI() {
  const [file, setFile]         = useState(null);
  const [preview, setPreview]   = useState(null);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError]       = useState('');
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') {
      setError('Only image files (JPEG, PNG) and PDFs accepted.'); return;
    }
    setFile(f); setError(''); setResult(null);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const analyze = async () => {
    if (!file) { setError('Please upload a medical image first.'); return; }
    setLoading(true); setError('');
    try {
      const res = await mockVisionAnalysis(file.name);
      setResult(res);
    } catch {
      setError('Vision analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.layout}>
        <div style={s.card}>
          <h2 style={s.cardTitle}>Vision AI — Medical Imaging</h2>
          <p style={s.cardSub}>Upload chest X-rays, MRI scans, CT scans, or medical reports for AI-powered analysis.</p>
          <div
            style={{ ...s.dropzone, ...(dragOver ? s.dropzoneActive : {}) }}
            onClick={() => inputRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          >
            {preview
              ? <img src={preview} alt="preview" style={s.previewImg} />
              : <div style={s.dropPlaceholder}>
                  <div style={s.dropIcon}>⬆</div>
                  <div style={s.dropTitle}>Drop medical image here</div>
                  <div style={s.dropSub}>JPEG, PNG, DICOM, PDF • Max 20MB</div>
                </div>
            }
          </div>
          <input ref={inputRef} type="file" style={{display:'none'}}
            accept="image/*,.pdf" onChange={e => handleFile(e.target.files[0])} />
          {file && (
            <div style={s.fileRow}>
              <span style={s.fileName}>{file.name}</span>
              <span style={s.fileSize}>{(file.size/1024).toFixed(0)} KB</span>
            </div>
          )}
          <div style={s.hints}>
            {['Chest X-Ray','CT Scan','MRI','Dermatology','Ophthalmology'].map(t => (
              <span key={t} style={s.hintPill}>{t}</span>
            ))}
          </div>
          {error && <div style={s.errorBox}>{error}</div>}
          <button style={s.btn} onClick={analyze} disabled={loading || !file}>
            {loading ? <span className="loading-dots"><span/><span/><span/></span> : 'Analyze Image'}
          </button>
          <button style={s.clearBtn} onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
            Clear
          </button>
        </div>

        <div style={s.card}>
          {!result && !loading && (
            <div style={s.empty}>
              <div style={{fontSize:44,marginBottom:12}}>🫁</div>
              <div style={s.emptyTitle}>Upload a medical image</div>
              <div style={s.emptySub}>Supports X-rays, MRI, CT, dermatology images</div>
            </div>
          )}
          {loading && (
            <div style={s.empty}>
              <span className="loading-dots"><span/><span/><span/></span>
              <div style={{...s.emptyTitle, marginTop:16}}>Analysing image...</div>
              <div style={s.emptySub}>Running computer vision model</div>
            </div>
          )}
          {result && !loading && (
            <div className="fade-in">
              <div style={s.resultHeader}>
                <h3 style={s.resultTitle}>{result.type} — Analysis</h3>
                <span style={s.confidenceBadge}>{result.confidence}% confidence</span>
              </div>
              <div style={s.sectionLabel}>FINDINGS</div>
              {result.findings.map((f, i) => (
                <div key={i} style={s.findingRow}>
                  <div style={s.findingLeft}>
                    <div style={s.findingRegion}>{f.region}</div>
                    <p style={s.findingObs}>{f.observation}</p>
                  </div>
                  <span style={{ ...s.severityBadge, background: SEVERITY_COLOR[f.severity]+'22', color: SEVERITY_COLOR[f.severity] }}>
                    {f.severity}
                  </span>
                </div>
              ))}
              <div style={s.sectionLabel}>IMPRESSION</div>
              <div style={s.impressionBox}>
                <p style={s.impressionText}>{result.impression}</p>
              </div>
              <div style={s.sectionLabel}>RECOMMENDATION</div>
              <p style={s.recText}>{result.recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:           { padding:'20px', maxWidth:1100, margin:'0 auto' },
  layout:         { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' },
  card:           { background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'20px', minHeight:480 },
  cardTitle:      { fontSize:16, fontWeight:600, color:'var(--text-primary)', marginBottom:6 },
  cardSub:        { fontSize:13, color:'var(--text-muted)', marginBottom:16, lineHeight:1.5 },
  sectionLabel:   { fontSize:10, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:10, marginTop:16 },
  dropzone:       { border:'2px dashed var(--border)', borderRadius:12, padding:'2rem', textAlign:'center', cursor:'pointer', transition:'border-color .15s', minHeight:200, display:'flex', alignItems:'center', justifyContent:'center' },
  dropzoneActive: { borderColor:'var(--accent)', background:'var(--accent-glow)' },
  previewImg:     { maxWidth:'100%', maxHeight:200, borderRadius:8, objectFit:'contain' },
  dropPlaceholder:{ pointerEvents:'none' },
  dropIcon:       { fontSize:32, color:'var(--text-muted)', marginBottom:10 },
  dropTitle:      { fontSize:14, color:'var(--text-secondary)', marginBottom:4, fontWeight:500 },
  dropSub:        { fontSize:12, color:'var(--text-muted)' },
  fileRow:        { display:'flex', justifyContent:'space-between', padding:'8px 0', fontSize:13 },
  fileName:       { color:'var(--text-secondary)', fontWeight:500 },
  fileSize:       { color:'var(--text-muted)' },
  hints:          { display:'flex', flexWrap:'wrap', gap:6, marginTop:4 },
  hintPill:       { fontSize:11, padding:'3px 9px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:20, color:'var(--text-muted)' },
  errorBox:       { background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'8px 12px', color:'#ef4444', fontSize:13, marginTop:10 },
  btn:            { width:'100%', marginTop:14, padding:'11px', background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', fontSize:14, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', minHeight:42 },
  clearBtn:       { width:'100%', marginTop:8, padding:'9px', background:'none', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-muted)', fontSize:13 },
  empty:          { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:6 },
  emptyTitle:     { fontSize:15, fontWeight:500, color:'var(--text-secondary)' },
  emptySub:       { fontSize:13, color:'var(--text-muted)' },
  resultHeader:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  resultTitle:    { fontSize:15, fontWeight:600, color:'var(--text-primary)' },
  confidenceBadge:{ fontSize:12, padding:'3px 10px', background:'rgba(34,197,94,0.15)', color:'#22c55e', borderRadius:20, fontWeight:600, fontFamily:'var(--font-mono)' },
  findingRow:     { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, padding:'10px 12px', background:'var(--bg-elevated)', borderRadius:8, marginBottom:8, border:'1px solid var(--border)' },
  findingLeft:    { flex:1 },
  findingRegion:  { fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:4 },
  findingObs:     { fontSize:12, color:'var(--text-secondary)', lineHeight:1.5, margin:0 },
  severityBadge:  { fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:10, flexShrink:0, marginTop:2 },
  impressionBox:  { background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px', marginBottom:4 },
  impressionText: { fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, margin:0 },
  recText:        { fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 },
};