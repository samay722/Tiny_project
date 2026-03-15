from fastapi import APIRouter
from models.schemas import RagRequest
from services.llm_service import query_rag_llm

router = APIRouter()

@router.post("/query")
async def query_knowledge_base(request: RagRequest):
    """
    Query the RAG medical knowledge base.
    """
    # Mocking retrieved context for now
    context = ["Patient guidelines for chronic pain management", "Clinical study on ibuprofen vs paracetamol"]
    
    answer = query_rag_llm(request.query, context)
    
    return {
        "status": "success",
        "answer": answer,
        "sources": ["Local Medical Database", "Trusted Guidelines 2024"]
    }