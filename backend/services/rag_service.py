"""
services/rag_service.py — RAG (Retrieval-Augmented Generation) service.

Architecture:
  1. Query comes in
  2. retrieve_context() finds relevant documents (mocked here; swap with real vector DB)
  3. Claude synthesises answer using retrieved context
  4. Returns answer + source citations

To connect a real vector DB (e.g. Pinecone, Chroma, FAISS):
  - Replace _mock_retrieve() with your vector store query
  - Keep the rest of the pipeline unchanged
"""

import re
from services.llm_service import call_claude_json


# ── Mock knowledge base ───────────────────────────────────────────────────────
# In production replace with embeddings + vector DB retrieval
MOCK_KNOWLEDGE_BASE = [
    {
        "id": "who-diabetes-2023",
        "title": "WHO Diabetes Management Guidelines 2023",
        "type": "Guideline",
        "content": "Type 2 diabetes management focuses on lifestyle modification, glycaemic control (HbA1c < 7%), blood pressure management, and cardiovascular risk reduction. First-line pharmacotherapy is metformin unless contraindicated.",
    },
    {
        "id": "nice-hypertension",
        "title": "NICE Hypertension Guidelines (NG136)",
        "type": "Guideline",
        "content": "For hypertension: stage 1 (clinic BP ≥140/90), stage 2 (≥160/100). First-line: ACE inhibitor or ARB for people under 55; calcium channel blocker for those 55+ or Black African/Caribbean origin.",
    },
    {
        "id": "bmj-chest-pain",
        "title": "BMJ Best Practice — Acute Chest Pain",
        "type": "Reference",
        "content": "Acute chest pain differential includes ACS, PE, aortic dissection, pneumothorax, oesophageal spasm, pericarditis. ECG and troponin are first-line investigations. High-risk features require immediate ED assessment.",
    },
    {
        "id": "pubmed-sepsis-2024",
        "title": "Surviving Sepsis Campaign Guidelines 2024",
        "type": "Research",
        "content": "Sepsis-3 definition requires life-threatening organ dysfunction caused by dysregulated host response to infection (SOFA ≥2). Hour-1 bundle: blood cultures, broad-spectrum antibiotics, 30mL/kg IV crystalloid for hypotension, vasopressors for MAP<65.",
    },
    {
        "id": "uptodate-fever-paed",
        "title": "UpToDate — Paediatric Fever Management",
        "type": "Database",
        "content": "In children <3 months: fever ≥38°C requires immediate evaluation. Antipyretics (paracetamol/ibuprofen) for comfort not to prevent febrile seizures. Ibuprofen avoid under 3 months and in dehydration.",
    },
    {
        "id": "who-drug-interactions",
        "title": "WHO Essential Medicines — Drug Interaction Database",
        "type": "Database",
        "content": "Warfarin interactions: significantly increased INR with antibiotics, NSAIDs, amiodarone, fluconazole. Decreased INR with rifampicin, carbamazepine, St John's Wort. Regular INR monitoring essential.",
    },
    {
        "id": "jama-cardiovascular",
        "title": "JAMA — Cardiovascular Risk Assessment 2024",
        "type": "Research",
        "content": "Framingham Risk Score and SCORE2 are validated tools for 10-year cardiovascular risk. Statins recommended for primary prevention when 10-year risk >10%. Aspirin no longer routinely recommended for primary prevention.",
    },
    {
        "id": "lancet-antibiotics",
        "title": "The Lancet — Antibiotic Stewardship Review",
        "type": "Research",
        "content": "Antibiotic stewardship reduces resistance, costs, and adverse effects. For community-acquired pneumonia: amoxicillin first-line; doxycycline or clarithromycin if atypical. 5-day course for mild-moderate CAP.",
    },
]


def _score_document(doc: dict, query: str) -> int:
    """
    Simple keyword-based relevance scoring.
    In production replace with cosine similarity on embeddings.
    """
    query_words = set(re.findall(r'\w+', query.lower()))
    doc_words   = set(re.findall(r'\w+', (doc["title"] + " " + doc["content"]).lower()))
    overlap     = query_words & doc_words
    base_score  = int(len(overlap) / max(len(query_words), 1) * 100)
    # Boost guidelines slightly
    if doc["type"] == "Guideline":
        base_score = min(100, base_score + 8)
    return max(20, min(99, base_score))


def retrieve_context(question: str, top_k: int = 4) -> list[dict]:
    """
    Retrieve most relevant documents for a given question.
    Returns list of {title, type, relevance, content}.
    """
    scored = [
        {**doc, "relevance": _score_document(doc, question)}
        for doc in MOCK_KNOWLEDGE_BASE
    ]
    scored.sort(key=lambda x: x["relevance"], reverse=True)
    return scored[:top_k]


def build_rag_prompt(question: str, documents: list[dict]) -> str:
    """
    Build the RAG prompt by injecting retrieved context.
    """
    context_blocks = "\n\n".join(
        f"[Source {i+1}: {doc['title']} ({doc['type']}, relevance={doc['relevance']}%)]\n{doc['content']}"
        for i, doc in enumerate(documents)
    )
    return f"""
Answer the following medical question using the provided context documents.

QUESTION: {question}

CONTEXT DOCUMENTS:
{context_blocks}

Return this exact JSON:
{{
  "answer": "<comprehensive answer using **bold** for key clinical terms. Reference sources by number e.g. [1]. 3-4 paragraphs.>",
  "sources": [
    {{
      "title": "<exact title from context>",
      "type": "<type from context>",
      "relevance": <relevance score from context>
    }}
  ]
}}

Base your answer primarily on the context documents. Add clinical expertise where needed.
"""


def query_knowledge_base(question: str) -> dict:
    """
    Full RAG pipeline:
    1. Retrieve relevant documents
    2. Build prompt with context
    3. Call Claude to synthesise answer
    4. Return answer + formatted sources
    """
    documents = retrieve_context(question, top_k=4)
    prompt    = build_rag_prompt(question, documents)
    result    = call_claude_json(prompt)

    # Ensure sources are properly formatted
    formatted_sources = [
        {
            "title":     src.get("title", "Unknown"),
            "type":      src.get("type", "Reference"),
            "relevance": int(src.get("relevance", 75)),
        }
        for src in result.get("sources", [])
    ]

    return {
        "answer":  result.get("answer", "Unable to retrieve answer."),
        "sources": formatted_sources,
    }