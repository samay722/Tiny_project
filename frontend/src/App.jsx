import { useState } from 'react';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import SymptomChecker from './pages/SymptomChecker';
import VisionAI from './pages/VisionAI';
import RAGKnowledge from './pages/RAGKnowledge';
import AgenticAI from './pages/AgenticAI';
import Dashboard from './pages/Dashboard';
import Automation from './pages/Automation';

const TABS = ['Symptom Checker', 'Vision AI', 'RAG Knowledge', 'Agentic AI', 'Dashboard', 'Automation'];

export default function App() {
  // Check if already logged in from a previous session
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('medai_user')); }
    catch { return null; }
  });
  const [activeTab, setActiveTab] = useState('Symptom Checker');

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('medai_user');
    setUser(null);
  };

  // Show login screen if not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'Symptom Checker': return <SymptomChecker />;
      case 'Vision AI':       return <VisionAI />;
      case 'RAG Knowledge':   return <RAGKnowledge />;
      case 'Agentic AI':      return <AgenticAI />;
      case 'Dashboard':       return <Dashboard />;
      case 'Automation':      return <Automation />;
      default:                return <SymptomChecker />;
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <Navbar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />
      <main style={{ flex:1, overflowY:'auto' }}>
        {renderPage()}
      </main>
    </div>
  );
}