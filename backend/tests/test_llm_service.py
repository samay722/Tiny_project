import pytest
from unittest.mock import MagicMock, patch
from services.llm_service import analyze_symptoms_llm, query_rag_llm

@patch('groq.Groq')
def test_analyze_symptoms_llm(mock_groq):
    # Mock the Groq client and its response
    mock_client = MagicMock()
    mock_groq.return_value = mock_client
    
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(message=MagicMock(content='{"summary": "Test Summary", "conditions": ["Condition A", "Condition B"], "recommendations": ["Do X"]}'))
    ]
    mock_client.chat.completions.create.return_value = mock_response
    
    result = analyze_symptoms_llm(["cough"], 25, "2 days", "")
    
    assert result['summary'] == "Test Summary"
    assert "Condition A" in result['conditions']
    assert len(result['recommendations']) == 1

@patch('groq.Groq')
def test_query_rag_llm(mock_groq):
    mock_client = MagicMock()
    mock_groq.return_value = mock_client
    
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(message=MagicMock(content='This is a medical answer.'))
    ]
    mock_client.chat.completions.create.return_value = mock_response
    
    answer = query_rag_llm("What is flu?", ["Context about flu"])
    assert answer == "This is a medical answer."
