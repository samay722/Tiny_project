import os
import json
from groq import Groq
from dotenv import load_dotenv

# Load API Key from .env file
load_dotenv()

# We are using Groq for ultra-fast Llama 3 inference. 
# Get your free key at https://console.groq.com/
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def get_groq_client():
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is missing! Please add your Groq/Llama API key to the .env file.")
    return Groq(api_key=GROQ_API_KEY)


def analyze_symptoms_llm(symptoms: list[str], age: int, duration: str, context: str) -> dict:
    """
    Uses Llama 3 API (via Groq) to analyze patient symptoms and return a differential diagnosis.
    Expects JSON output formatting so the frontend can parse it.
    """
    client = get_groq_client()
    
    prompt = (
        f"You are a medical AI assistant. Analyze the following patient case:\n"
        f"Age: {age}\n"
        f"Symptoms: {', '.join(symptoms)}\n"
        f"Duration: {duration}\n"
        f"Additional Context: {context}\n\n"
        f"Provide a JSON response with exactly three keys:\n"
        f"1. 'summary': A short paragraph summarizing the patient's presentation.\n"
        f"2. 'conditions': A list of top 3 possible conditions (differential diagnosis) ranked by likelihood.\n"
        f"3. 'recommendations': A list of 3 actionable next steps or red flags to look out for.\n"
        f"Make sure to strictly return valid JSON."
    )

    response = client.chat.completions.create(
        model="llama3-8b-8192",  # Or llama3-70b-8192
        messages=[
            {"role": "system", "content": "You are a professional medical reasoning AI. Always output strict JSON format matching the instructions exactly."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=1000,
        response_format={"type": "json_object"}
    )
    
    # Parse the JSON string returned by Llama 3 into a Python dictionary
    content = response.choices[0].message.content
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        print("Failed to decode JSON from model:", content)
        return {
            "summary": "Error parsing model response.",
            "conditions": [],
            "recommendations": []
        }

def query_rag_llm(query: str, context_docs: list[str]) -> str:
    """
    Uses Llama 3 to answer a user's question based on pulled context documents (RAG).
    """
    client = get_groq_client()
    
    docs_text = "\n\n".join(context_docs)
    prompt = (
        f"You are a medical knowledge assistant. Using ONLY the provided context documents, answer the user's question.\n"
        f"Context Documents:\n{docs_text}\n\n"
        f"Question: {query}"
    )

    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "Answer precisely using only the provided medical context."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1
    )
    
    return response.choices[0].message.content


def execute_agentic_task_llm(task: str) -> dict:
    """
    Simulates a multi-step agentic reasoning task using Llama 3.
    """
    client = get_groq_client()
    
    prompt = (
        f"You are an autonomous medical AI agent. Your task is: '{task}'.\n"
        f"Break this task down into logical steps.\n"
        f"Provide a JSON response with two keys:\n"
        f"1. 'steps_taken': A list of strings describing the logical steps you took to accomplish the task.\n"
        f"2. 'result': A string explaining the final outcome of the task."
    )

    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "You are a multi-step planning AI agent. Output strict JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        response_format={"type": "json_object"}
    )
    
    content = response.choices[0].message.content
    return json.loads(content)


def analyze_image_vision_llm(image_bytes: bytes, media_type: str, file_name: str) -> dict:
    """
    Placeholder for Vision-LLM integration.
    Since current Groq/Llama3 models are text-only, we would normally use 
    base64 encoding for GPT-4o or similar here.
    """
    # For now, we will raise an exception to trigger the text-only fallback in the router
    raise NotImplementedError("Vision-capable model not yet configured.")


def analyze_image_llm(image_description: str, file_name: str) -> dict:
    """
    Analyzes a medical image based on a text description/metadata.
    """
    client = get_groq_client()
    
    prompt = (
        f"You are a medical imaging AI. Analyze the following image metadata and provide a structured radiology report:\n"
        f"Context: {image_description}\n"
        f"File Name: {file_name}\n\n"
        f"Provide a JSON response with:\n"
        f"1. 'scan_type': The type of scan detected.\n"
        f"2. 'findings': A list of key observations.\n"
        f"3. 'impression': A synthesis of the findings.\n"
        f"4. 'confidence': A number between 0 and 100.\n"
        f"5. 'recommendation': Next steps.\n"
        f"Output strict JSON."
    )

    response = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[
            {"role": "system", "content": "You are a professional radiologist AI. Output strict JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    
    content = response.choices[0].message.content
    return json.loads(content)