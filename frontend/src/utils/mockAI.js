/**
 * mockAI.js — Simulated AI responses for demo / frontend-only mode.
 * Replace calls here with real API calls once backend is ready.
 */

export function delay(ms = 1800) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function mockSymptomAnalysis(symptoms, age, duration) {
  await delay(2000);
  const hasChest  = symptoms.some(s => s.toLowerCase().includes('chest'));
  const hasFever  = symptoms.some(s => s.toLowerCase().includes('fever'));
  const hasCough  = symptoms.some(s => s.toLowerCase().includes('cough'));

  return {
    summary: `Based on the reported symptoms (${symptoms.join(', ')}) in a ${age}-year-old patient over ${duration}, the AI has identified several potential conditions.`,
    conditions: [
      {
        name: hasChest ? 'Acute Coronary Syndrome' : hasFever ? 'Viral Infection' : 'Anxiety Disorder',
        probability: hasChest ? 72 : hasFever ? 68 : 55,
        severity: hasChest ? 'High' : hasFever ? 'Moderate' : 'Low',
        description: hasChest
          ? 'Chest pain with associated symptoms may indicate cardiac involvement. Immediate evaluation recommended.'
          : hasFever
          ? 'Combination of fever and systemic symptoms suggests a viral etiology.'
          : 'Symptoms are consistent with anxiety or stress-related presentation.',
      },
      {
        name: hasCough ? 'Respiratory Tract Infection' : 'Musculoskeletal Pain',
        probability: hasCough ? 61 : 42,
        severity: hasCough ? 'Moderate' : 'Low',
        description: hasCough
          ? 'Productive cough with systemic symptoms may indicate upper or lower respiratory infection.'
          : 'Symptoms may be musculoskeletal in origin, possibly related to posture or overuse.',
      },
      {
        name: 'Dehydration',
        probability: 28,
        severity: 'Low',
        description: 'Nonspecific symptoms can be associated with inadequate fluid intake.',
      },
    ],
    recommendations: [
      'Schedule an appointment with your primary care physician within 24–48 hours.',
      hasChest ? '⚠️ If chest pain worsens or radiates to arm/jaw, seek emergency care immediately.' : null,
      'Monitor symptoms and keep a log of severity changes.',
      'Maintain adequate hydration and rest.',
      'Avoid self-medicating until a formal diagnosis is established.',
    ].filter(Boolean),
    disclaimer: 'This analysis is for informational purposes only and does not constitute medical advice.',
  };
}

export async function mockVisionAnalysis(fileName) {
  await delay(2200);
  return {
    type: 'Chest X-Ray',
    findings: [
      { region: 'Lung fields', observation: 'Bilateral lung fields appear clear with no consolidation or effusion detected.', severity: 'Normal' },
      { region: 'Cardiac silhouette', observation: 'Cardiac silhouette is within normal limits. Cardiothoracic ratio ~0.48.', severity: 'Normal' },
      { region: 'Bony structures', observation: 'No fractures or lytic lesions identified in visible osseous structures.', severity: 'Normal' },
      { region: 'Diaphragm', observation: 'Both hemidiaphragms are well-defined. No free air under the diaphragm.', severity: 'Normal' },
    ],
    impression: 'No acute cardiopulmonary abnormality identified. Normal chest radiograph.',
    confidence: 91.4,
    recommendation: 'Clinical correlation recommended. Follow up as clinically indicated.',
  };
}

export async function mockRAGQuery(question) {
  await delay(1600);
  const responses = {
    default: `Based on current medical literature and clinical guidelines, here is what we know about your query regarding "${question}":\n\n**Key findings from indexed medical databases:**\n\nThe evidence suggests a multifactorial etiology with significant variation across patient populations. Several landmark studies including systematic reviews and meta-analyses have contributed to our current understanding.\n\n**Clinical relevance:** This information should be interpreted in the context of individual patient presentation and risk factors.\n\n**Sources:** UpToDate, PubMed Central, WHO Clinical Guidelines 2024, BMJ Best Practice`,
  };
  return {
    answer: responses.default,
    sources: [
      { title: 'WHO Clinical Guidelines 2024', type: 'Guideline', relevance: 96 },
      { title: 'BMJ Best Practice — Differential Diagnosis', type: 'Reference', relevance: 89 },
      { title: 'PubMed: Systematic Review (n=12,400)', type: 'Research', relevance: 84 },
      { title: 'UpToDate Clinical Decision Support', type: 'Database', relevance: 79 },
    ],
  };
}

export async function mockAgenticTask(task) {
  await delay(500);
  const steps = [
    { id: 1, label: 'Parsing task request',          status: 'done',    detail: `Task received: "${task}"` },
    { id: 2, label: 'Querying medical databases',    status: 'running', detail: 'Searching PubMed, WHO, UpToDate...' },
    { id: 3, label: 'Cross-referencing guidelines',  status: 'pending', detail: '' },
    { id: 4, label: 'Synthesising findings',          status: 'pending', detail: '' },
    { id: 5, label: 'Generating structured report',  status: 'pending', detail: '' },
  ];
  return steps;
}

export const MOCK_DASHBOARD = {
  stats: [
    { label: 'Analyses Today',   value: 47,   delta: '+12%', color: '#4f8ef7' },
    { label: 'Avg Confidence',   value: '89%', delta: '+3%',  color: '#22c55e' },
    { label: 'Active Sessions',  value: 8,    delta: '',     color: '#a78bfa' },
    { label: 'Flagged Cases',    value: 3,    delta: '-1',   color: '#f59e0b' },
  ],
  recentActivity: [
    { time: '2 min ago',  type: 'Symptom', summary: 'Fever + Cough — Viral infection (68%)', severity: 'Moderate' },
    { time: '8 min ago',  type: 'Vision',  summary: 'Chest X-Ray — No acute findings', severity: 'Normal' },
    { time: '15 min ago', type: 'RAG',     summary: 'Query: Hypertension management protocols', severity: 'Info' },
    { time: '22 min ago', type: 'Agentic', summary: 'Drug interaction check — 3 interactions found', severity: 'High' },
    { time: '31 min ago', type: 'Symptom', summary: 'Chest pain + Dizziness — Cardiac eval', severity: 'High' },
  ],
  weeklyData: [
    { day: 'Mon', symptom: 32, vision: 18, rag: 24 },
    { day: 'Tue', symptom: 41, vision: 22, rag: 31 },
    { day: 'Wed', symptom: 38, vision: 15, rag: 28 },
    { day: 'Thu', symptom: 55, vision: 30, rag: 42 },
    { day: 'Fri', symptom: 47, vision: 25, rag: 36 },
    { day: 'Sat', symptom: 29, vision: 12, rag: 18 },
    { day: 'Sun', symptom: 23, vision: 8,  rag: 14 },
  ],
};