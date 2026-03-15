import api from './llm';

/** Send a single medical alert email */
export async function sendEmailAlert({ toEmail, subject, body, priority, patientName }) {
  const res = await api.post('/api/communication/send-email', {
    to_email:     toEmail,
    subject,
    body,
    priority,
    patient_name: patientName,
  });
  return res.data;
}

/** Trigger a phone call alert */
export async function triggerPhoneCall({ toNumber, message, patientName, callType }) {
  const res = await api.post('/api/communication/trigger-call', {
    to_number:    toNumber,
    message,
    patient_name: patientName,
    call_type:    callType,
  });
  return res.data;
}

/** Broadcast to multiple contacts (email + call) */
export async function broadcastAlert({ contacts, subject, body, priority, includeEmail, includeCall, patientName }) {
  const res = await api.post('/api/communication/broadcast', {
    contacts,
    subject,
    body,
    priority,
    include_email: includeEmail,
    include_call:  includeCall,
    patient_name:  patientName,
  });
  return res.data;
}

/** Get live/simulation status of communication channels */
export async function getCommunicationStatus() {
  const res = await api.get('/api/communication/status');
  return res.data;
}
