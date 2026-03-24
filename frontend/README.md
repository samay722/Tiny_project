# MedAI — Clinical Intelligence Platform

A full React frontend replicating your MedAI UI with all 5 tabs fully functional.

## Folder Structure

```
medai/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   └── llm.js              ← API calls to FastAPI backend
│   ├── components/
│   │   └── Navbar.jsx          ← Top nav with all 5 tabs + AI Online status
│   ├── hooks/
│   │   └── useAI.js            ← Reusable AI call hook
│   ├── pages/
│   │   ├── SymptomChecker.jsx  ← Exact match to your screenshot
│   │   ├── VisionAI.jsx        ← Medical image upload + analysis
│   │   ├── RAGKnowledge.jsx    ← Medical knowledge Q&A
│   │   ├── AgenticAI.jsx       ← Multi-step AI task agent
│   │   └── Dashboard.jsx       ← Analytics with charts
│   ├── utils/
│   │   └── mockAI.js           ← Mock AI responses (no backend needed)
│   ├── App.jsx
│   ├── index.js
│   └── index.css               ← Dark theme CSS variables
├── package.json
├── .env.example
└── README.md
```

## Quick Start

```bash
# Install dependencies
npm install

# Run (no backend needed — uses mock AI responses)
npm start

# Visit http://localhost:3000
```

## Connect to Real Backend

Edit `src/api/llm.js` and replace mock calls with real API endpoints,
or set `REACT_APP_API_URL` in `.env` to point to your FastAPI backend.

## Features

| Tab              | What it does                                              |
|------------------|-----------------------------------------------------------|
| Symptom Checker  | Select symptoms, age, duration → AI risk analysis         |
| Vision AI        | Upload X-rays/MRI/CT → AI imaging report with findings    |
| RAG Knowledge    | Ask medical questions → answers with sourced citations    |
| Agentic AI       | Complex tasks → step-by-step agent execution + report     |
| Dashboard        | Live analytics, usage charts, module status               |