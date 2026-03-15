import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

export async function analyzeSymptoms(symptoms, age, duration) {
  const res = await api.post('/api/symptom-checker', { symptoms, age, duration });
  return res.data;
}

export async function analyzeImage(formData) {
  const res = await api.post('/api/vision', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function queryRAG(question) {
  const res = await api.post('/api/rag', { question });
  return res.data;
}

export async function runAgenticTask(task) {
  const res = await api.post('/api/agentic', { task });
  return res.data;
}

export async function getDashboardStats() {
  const res = await api.get('/api/dashboard/stats');
  return res.data;
}

export default api;