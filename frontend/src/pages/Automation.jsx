import { useState, useEffect, useRef } from 'react';
import { sendEmailAlert, triggerPhoneCall, broadcastAlert, getCommunicationStatus } from '../api/communication';

// ─── Priority Config ──────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: '🔴 CRITICAL', icon: '🚨' },
  high:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '🟠 HIGH',     icon: '⚠️' },
  normal:   { color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)', label: '🔵 NORMAL',   icon: '📋' },
  low:      { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  label: '🟢 LOW',      icon: 'ℹ️' },
};

// ─── Quick Template Presets ───────────────────────────────────────────────────
const EMAIL_PRESETS = [
  { label: 'Critical Lab Alert',   priority: 'critical', subject: 'CRITICAL: Abnormal Lab Results',       body: 'Patient lab results require immediate physician review.\n\nHbA1c: 10.8% (Critical High)\nBlood Glucose: 24.1 mmol/L\neGFR: 28 (Stage 4 CKD)\n\nImmediate consultation required.' },
  { label: 'Appointment Reminder', priority: 'normal',   subject: 'Appointment Reminder — MedAI Clinic', body: 'This is a friendly reminder of your upcoming appointment tomorrow at 10:00 AM.\n\nPlease bring your current medications list.\nFasting required for blood work.\n\nContact us if you need to reschedule.' },
  { label: 'Med Refill Alert',     priority: 'high',     subject: 'Medication Refill Required',           body: 'Patient\'s prescription is due for renewal within 3 days.\n\nMedication: Metformin 500mg\nRemaining: 6 tablets\nPrescribing Doctor: Action required.\n\nPlease process the refill to avoid treatment interruption.' },
  { label: 'Discharge Summary',    priority: 'normal',   subject: 'Patient Discharge Summary',            body: 'Patient has been discharged following inpatient treatment.\n\nDiagnosis: Community-acquired pneumonia\nTreatment: IV Amoxicillin 5 days, oral step-down\nFollow-up: Required in 7 days\n\nPlease review attached discharge instructions.' },
];

const CALL_PRESETS = [
  { label: 'Emergency Alert',   callType: 'emergency', message: 'This is an urgent MedAI emergency alert. Your patient requires immediate attention. Please contact the hospital immediately.' },
  { label: 'Appointment Remind', callType: 'reminder', message: 'Hello, this is a reminder from MedAI Clinic. You have an appointment tomorrow at 10 AM. Please call us if you need to reschedule.' },
  { label: 'Critical Lab',      callType: 'alert',     message: 'This is MedAI with a critical lab result notification. Please contact your physician immediately regarding your recent blood test results.' },
  { label: 'Med Refill',        callType: 'reminder',  message: 'Hello, this is MedAI pharmacy. Your prescription is due for renewal. Please visit the clinic or call us to arrange a refill.' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ live, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: live ? 'rgba(34,197,94,0.12)' : 'rgba(79,142,247,0.1)',
      border: `1px solid ${live ? 'rgba(34,197,94,0.35)' : 'rgba(79,142,247,0.3)'}`,
      color: live ? '#22c55e' : '#4f8ef7',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: live ? '#22c55e' : '#4f8ef7', display: 'inline-block' }} />
      {live ? '● LIVE' : '◎ SIM'} — {label}
    </span>
  );
}

function ResultLog({ steps, status }) {
  const statusColor = { sent: '#22c55e', simulated: '#4f8ef7', initiated: '#22c55e', error: '#ef4444', completed: '#22c55e' };
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
        RESULT LOG
      </div>
      <div style={{ background: 'var(--bg-base)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: statusColor[status] ? `${statusColor[status]}22` : 'var(--bg-elevated)',
            color: statusColor[status] || 'var(--text-primary)',
            border: `1px solid ${statusColor[status] || 'var(--border)'}`,
          }}>
            {status?.toUpperCase()}
          </span>
        </div>
        {steps?.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12, color: 'var(--text-secondary)', borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Email Tab ────────────────────────────────────────────────────────────────
function EmailTab() {
  const [form, setForm] = useState({ toEmail: '', subject: '', body: '', priority: 'normal', patientName: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePreset = (p) => setForm(f => ({ ...f, subject: p.subject, body: p.body, priority: p.priority }));

  const handleSend = async () => {
    if (!form.toEmail || !form.subject || !form.body) return;
    setLoading(true); setResult(null);
    try {
      const res = await sendEmailAlert(form);
      setResult(res);
    } catch (e) {
      setResult({ status: 'error', steps: [`❌ ${e.message}`], message: e.message });
    }
    setLoading(false);
  };

  const pc = PRIORITY_CONFIG[form.priority];

  return (
    <div style={s.tabContent}>
      {/* Left — Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>📧 Email Alert</h3>
          <p style={s.cardSub}>Send a formatted medical alert email to a doctor, nurse, or patient.</p>

          {/* Presets */}
          <div style={s.sectionLabel}>QUICK TEMPLATES</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 14 }}>
            {EMAIL_PRESETS.map((p, i) => (
              <button key={i} style={s.presetChip} onClick={() => handlePreset(p)}>
                <span style={{ color: PRIORITY_CONFIG[p.priority]?.color, fontSize: 10, fontWeight: 700 }}>
                  {p.priority.toUpperCase()}
                </span>
                {p.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={s.formGroup}>
            <label style={s.label}>Patient Name</label>
            <input style={s.input} value={form.patientName} onChange={e => set('patientName', e.target.value)} placeholder="e.g., John Doe" />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Recipient Email</label>
            <input style={s.input} value={form.toEmail} onChange={e => set('toEmail', e.target.value)} placeholder="doctor@hospital.com" type="email" />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Priority</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => set('priority', key)}
                  style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${form.priority === key ? cfg.color : 'var(--border)'}`, background: form.priority === key ? cfg.bg : 'transparent', color: form.priority === key ? cfg.color : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Subject</label>
            <input style={s.input} value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g., Critical: Abnormal Lab Results" />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Message Body</label>
            <textarea style={{ ...s.input, resize: 'vertical', minHeight: 120, lineHeight: 1.6 }}
              value={form.body} onChange={e => set('body', e.target.value)}
              placeholder="Enter the alert details here..." />
          </div>

          <button style={{ ...s.btn, background: pc.color }} onClick={handleSend} disabled={loading || !form.toEmail || !form.subject}>
            {loading ? <span className="loading-dots"><span/><span/><span/></span> : '📨 Send Email Alert'}
          </button>
        </div>

        {result && <ResultLog steps={result.steps} status={result.status} />}
      </div>

      {/* Right — Preview */}
      <div style={s.card}>
        <div style={s.sectionLabel}>EMAIL PREVIEW</div>
        <div style={{ background: '#0f1117', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#4f8ef7,#a78bfa)', padding: '20px 24px' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>🏥 MedAI Alert</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>Clinical Intelligence Platform</div>
          </div>
          {/* Body */}
          <div style={{ padding: '20px 24px' }}>
            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: pc.bg, border: `1px solid ${pc.color}`, color: pc.color, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 14 }}>
              {form.priority.toUpperCase()} PRIORITY
            </span>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e8ecf4', marginBottom: 6 }}>
              {form.subject || 'Email Subject Preview'}
            </div>
            <div style={{ fontSize: 12, color: '#8892b0', marginBottom: 14 }}>
              Patient: <strong style={{ color: '#e8ecf4' }}>{form.patientName || 'Unknown'}</strong>
            </div>
            <div style={{ background: '#22263a', borderRadius: 8, padding: 14, borderLeft: `3px solid ${pc.color}`, color: '#c8d0e7', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line', minHeight: 80 }}>
              {form.body || 'Message body will appear here...'}
            </div>
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #2e3348', color: '#4a5168', fontSize: 11 }}>
              Sent by MedAI Automation System · Do not reply to this email.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phone Call Tab ──────────────────────────────────────────────────────────
function PhoneCallTab() {
  const [form, setForm] = useState({ toNumber: '', message: '', patientName: '', callType: 'alert' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePreset = (p) => setForm(f => ({ ...f, message: p.message, callType: p.callType }));

  const handleCall = async () => {
    if (!form.toNumber || !form.message) return;
    setLoading(true); setResult(null);
    try {
      const res = await triggerPhoneCall(form);
      setResult(res);
    } catch (e) {
      setResult({ status: 'error', steps: [`❌ ${e.message}`], message: e.message });
    }
    setLoading(false);
  };

  const callTypeColors = { alert: '#f59e0b', emergency: '#ef4444', reminder: '#22c55e' };
  const ctColor = callTypeColors[form.callType] || '#4f8ef7';

  return (
    <div style={s.tabContent}>
      {/* Left — Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>📞 Phone Call Alert</h3>
          <p style={s.cardSub}>Trigger an automated voice call with a custom medical message via Twilio.</p>

          {/* Presets */}
          <div style={s.sectionLabel}>QUICK SCRIPTS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 14 }}>
            {CALL_PRESETS.map((p, i) => (
              <button key={i} style={{ ...s.presetChip, borderColor: callTypeColors[p.callType] + '66' }} onClick={() => handlePreset(p)}>
                <span style={{ color: callTypeColors[p.callType], fontSize: 10, fontWeight: 700 }}>{p.callType.toUpperCase()}</span>
                {p.label}
              </button>
            ))}
          </div>

          <div style={s.formGroup}>
            <label style={s.label}>Patient Name</label>
            <input style={s.input} value={form.patientName} onChange={e => set('patientName', e.target.value)} placeholder="e.g., John Doe" />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Phone Number <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(E.164 format: +919876543210)</span></label>
            <input style={s.input} value={form.toNumber} onChange={e => set('toNumber', e.target.value)} placeholder="+919876543210" type="tel" />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Call Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['alert', 'reminder', 'emergency'].map(ct => (
                <button key={ct} onClick={() => set('callType', ct)}
                  style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${form.callType === ct ? callTypeColors[ct] : 'var(--border)'}`, background: form.callType === ct ? `${callTypeColors[ct]}22` : 'transparent', color: form.callType === ct ? callTypeColors[ct] : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {ct.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Voice Message Script</label>
            <textarea style={{ ...s.input, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }}
              value={form.message} onChange={e => set('message', e.target.value)}
              placeholder="Enter the message that will be spoken during the call..." />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              💡 Keep it under 300 characters for best clarity. {form.message.length}/300
            </div>
          </div>

          <button style={{ ...s.btn, background: ctColor }} onClick={handleCall} disabled={loading || !form.toNumber || !form.message}>
            {loading ? <span className="loading-dots"><span/><span/><span/></span> : '📞 Trigger Phone Call'}
          </button>
        </div>

        {result && <ResultLog steps={result.steps} status={result.status} />}
      </div>

      {/* Right — Phone Visualizer */}
      <div style={s.card}>
        <div style={s.sectionLabel}>CALL VISUALIZER</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '20px 0' }}>
          {/* Phone illustration */}
          <div style={{ position: 'relative' }}>
            <div style={{ width: 140, height: 240, borderRadius: 24, background: '#22263a', border: `2px solid ${ctColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '16px 10px', boxShadow: `0 0 40px ${ctColor}44` }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 6 }}>📞</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Calling</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{form.toNumber || '+X XXX XXX XXXX'}</div>
                <div style={{ marginTop: 8, padding: '3px 8px', borderRadius: 10, background: `${ctColor}22`, border: `1px solid ${ctColor}`, color: ctColor, fontSize: 10, fontWeight: 700 }}>{form.callType.toUpperCase()}</div>
              </div>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#ef444422', border: '1px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✕</div>
            </div>
            {/* Pulse rings */}
            {[0, 1, 2].map(i => (
              <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 140 + i * 36, height: 240 + i * 36, borderRadius: 30 + i * 6, border: `1px solid ${ctColor}`, opacity: 0.3 - i * 0.1, animation: `pulse ${1.5 + i * 0.3}s ease-in-out infinite`, pointerEvents: 'none' }} />
            ))}
          </div>

          {/* Script preview */}
          <div style={{ width: '100%', background: 'var(--bg-base)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.08em' }}>🔊 VOICE SCRIPT</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>
              "{form.message || 'Your voice message will appear here...'}"
            </div>
          </div>

          {/* Patient */}
          {form.patientName && (
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--border)' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg,${ctColor},#a78bfa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {form.patientName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{form.patientName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Patient on record</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Broadcast Tab ────────────────────────────────────────────────────────────
function BroadcastTab() {
  const [contacts, setContacts] = useState([
    { name: '', email: '', phone: '', role: 'doctor' },
  ]);
  const [form, setForm] = useState({ subject: '', body: '', priority: 'high', patientName: '', includeEmail: true, includeCall: true });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setContact = (i, k, v) => setContacts(c => c.map((ct, idx) => idx === i ? { ...ct, [k]: v } : ct));
  const addContact = () => setContacts(c => [...c, { name: '', email: '', phone: '', role: 'staff' }]);
  const removeContact = (i) => setContacts(c => c.filter((_, idx) => idx !== i));

  const handleBroadcast = async () => {
    setLoading(true); setResult(null);
    try {
      const res = await broadcastAlert({ contacts, ...form });
      setResult(res);
    } catch (e) {
      setResult({ status: 'error', summary: e.message, results: [] });
    }
    setLoading(false);
  };

  const pc = PRIORITY_CONFIG[form.priority];
  const validContacts = contacts.filter(c => c.name && (c.email || c.phone));

  return (
    <div style={s.tabContent}>
      {/* Left — Contacts + Message */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={s.card}>
          <h3 style={s.cardTitle}>📡 Broadcast Alert</h3>
          <p style={s.cardSub}>Send an email AND/OR phone call to multiple contacts simultaneously.</p>

          {/* Channels toggle */}
          <div style={s.sectionLabel}>CHANNELS</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {[['includeEmail', '📧 Email'], ['includeCall', '📞 Phone Call']].map(([key, lbl]) => (
              <button key={key} onClick={() => set(key, !form[key])}
                style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${form[key] ? 'var(--accent)' : 'var(--border)'}`, background: form[key] ? 'var(--accent-dim)' : 'transparent', color: form[key] ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                {form[key] ? '✓ ' : ''}{lbl}
              </button>
            ))}
          </div>

          {/* Contacts list */}
          <div style={s.sectionLabel}>CONTACTS ({contacts.length})</div>
          {contacts.map((ct, i) => (
            <div key={i} style={{ background: 'var(--bg-base)', borderRadius: 10, padding: 12, marginBottom: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>CONTACT {i + 1}</span>
                {contacts.length > 1 && (
                  <button onClick={() => removeContact(i)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer' }}>✕</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input style={s.inputSm} placeholder="Name *" value={ct.name} onChange={e => setContact(i, 'name', e.target.value)} />
                <select style={s.inputSm} value={ct.role} onChange={e => setContact(i, 'role', e.target.value)}>
                  {['doctor', 'nurse', 'staff', 'patient', 'admin'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
                <input style={s.inputSm} placeholder="Email" value={ct.email} onChange={e => setContact(i, 'email', e.target.value)} type="email" />
                <input style={s.inputSm} placeholder="Phone (+E.164)" value={ct.phone} onChange={e => setContact(i, 'phone', e.target.value)} />
              </div>
            </div>
          ))}
          <button onClick={addContact} style={{ width: '100%', padding: '7px', border: '1px dashed var(--border)', borderRadius: 8, background: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', marginBottom: 14 }}>
            + Add Contact
          </button>

          {/* Message */}
          <div style={s.sectionLabel}>MESSAGE</div>
          <div style={s.formGroup}>
            <label style={s.label}>Patient Name</label>
            <input style={s.input} value={form.patientName} onChange={e => set('patientName', e.target.value)} placeholder="e.g., John Doe" />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Priority</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => set('priority', key)}
                  style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${form.priority === key ? cfg.color : 'var(--border)'}`, background: form.priority === key ? cfg.bg : 'transparent', color: form.priority === key ? cfg.color : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Subject</label>
            <input style={s.input} value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Broadcast subject line" />
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>Body</label>
            <textarea style={{ ...s.input, minHeight: 90, resize: 'vertical', lineHeight: 1.6 }}
              value={form.body} onChange={e => set('body', e.target.value)}
              placeholder="Broadcast message body..." />
          </div>

          <button style={{ ...s.btn, background: pc.color }} onClick={handleBroadcast}
            disabled={loading || !form.subject || validContacts.length === 0}>
            {loading ? <span className="loading-dots"><span/><span/><span/></span> : `📡 Broadcast to ${validContacts.length} Contact${validContacts.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      {/* Right — Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {result ? (
          <div style={s.card} className="fade-in">
            <div style={s.sectionLabel}>BROADCAST RESULTS</div>
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>{result.summary}</div>
            </div>
            {result.results?.map((r, i) => (
              <div key={i} style={{ background: 'var(--bg-base)', borderRadius: 10, padding: 14, marginBottom: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>👤 {r.contact}</div>
                {r.actions?.map((act, j) => (
                  <div key={j} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: act.type === 'email' ? '#4f8ef7' : '#22c55e', marginBottom: 5 }}>
                      {act.type === 'email' ? '📧' : '📞'} {act.type.toUpperCase()} — <span style={{ color: act.status === 'error' ? '#ef4444' : undefined }}>{act.status?.toUpperCase()}</span>
                    </div>
                    {act.steps?.map((step, k) => (
                      <div key={k} style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 0 2px 14px' }}>→ {step}</div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ ...s.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 10 }}>
            <div style={{ fontSize: 48 }}>📡</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>Ready to broadcast</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 240 }}>
              Add contacts and fill in the message to send a simultaneous email + call to your team.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const COMM_TABS = [
  { id: 'email', label: '📧 Email Alerts' },
  { id: 'call',  label: '📞 Phone Calls' },
  { id: 'broadcast', label: '📡 Broadcast' },
];

export default function Automation() {
  const [activeTab, setActive] = useState('email');
  const [channelStatus, setChannelStatus] = useState(null);

  useEffect(() => {
    getCommunicationStatus()
      .then(setChannelStatus)
      .catch(() => setChannelStatus(null));
  }, []);

  return (
    <div style={s.page}>
      {/* Page Header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>🔔 Communication Automation</h1>
          <p style={s.pageSub}>Send email alerts and trigger phone calls automatically from MedAI workflows.</p>
        </div>
        {channelStatus && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge live={channelStatus.email_channel?.status === 'live'} label={channelStatus.email_channel?.provider} />
            <StatusBadge live={channelStatus.call_channel?.status === 'live'}  label={channelStatus.call_channel?.provider} />
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div style={s.tabBar}>
        {COMM_TABS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            style={{ ...s.tabBtn, ...(activeTab === t.id ? s.tabBtnActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="fade-in" key={activeTab}>
        {activeTab === 'email'     && <EmailTab />}
        {activeTab === 'call'      && <PhoneCallTab />}
        {activeTab === 'broadcast' && <BroadcastTab />}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page:        { padding: '20px', maxWidth: 1100, margin: '0 auto' },
  pageHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  pageTitle:   { fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 },
  pageSub:     { fontSize: 13, color: 'var(--text-muted)', marginTop: 4 },
  tabBar:      { display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 },
  tabBtn:      { padding: '9px 18px', border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -1 },
  tabBtnActive:{ color: 'var(--accent)', borderBottom: '2px solid var(--accent)' },
  tabContent:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' },
  card:        { background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' },
  cardTitle:   { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 },
  cardSub:     { fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 },
  sectionLabel:{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 },
  formGroup:   { marginBottom: 12 },
  label:       { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 },
  input:       { width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  inputSm:     { width: '100%', padding: '7px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box' },
  btn:         { width: '100%', marginTop: 14, padding: '11px', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 42, cursor: 'pointer' },
  presetChip:  { display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'left' },
};
