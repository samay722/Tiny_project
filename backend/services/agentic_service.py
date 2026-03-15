import uuid
from services.llm_service import execute_agentic_task_llm

def execute_agentic_task(task_description: str) -> dict:
    """
    Simulates executing a complex medical task using the LLM.
    Returns the expected structure for routers/agentic.py.
    """
    # Ask the real Llama model to plan and execute the task
    llm_output = execute_agentic_task_llm(task_description)
    
    # Construct the final response matching the AgenticResponse schema
    return {
        "task_id": str(uuid.uuid4()),
        "steps": llm_output.get("steps_taken", []),
        "summary": llm_output.get("result", "Task completed."),
        "sections": ["Planning phase", "Execution phase", "Formatting output"]
    }