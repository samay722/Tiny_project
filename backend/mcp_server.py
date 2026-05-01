import sqlite3
import os
from mcp.server.fastmcp import FastMCP

# Initialize the MCP Server
mcp = FastMCP("NeuroSense_Cybernetic_Server")

# Database Path
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(_PROJECT_ROOT, 'stress_history.db')

def get_db_connection():
    # Use timeout and check_same_thread=False for sqlite thread safety
    conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

@mcp.tool()
def get_latest_biometrics() -> str:
    """Gets the user's most recent cognitive stress score and biometric data."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT type, score, timestamp FROM stress_logs ORDER BY id DESC LIMIT 5")
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return "No recent biometric data available."
            
        summary = "Recent Biometric Readings:\n"
        for r in rows:
            summary += f"- [{r['timestamp']}] {r['type']} Sensor: {r['score']}/100 Stress Score\n"
        return summary
    except Exception as e:
        return f"Error retrieving biometrics: {e}"

@mcp.tool()
def analyze_burnout_velocity() -> str:
    """Analyzes the last 20 biometric readings to determine if the user is approaching burnout."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT score FROM stress_logs ORDER BY id DESC LIMIT 20")
        rows = cursor.fetchall()
        conn.close()
        
        if len(rows) < 10:
            return "Not enough data to calculate burnout velocity. Need at least 10 readings."
            
        scores = [r['score'] for r in rows]
        recent_avg = sum(scores[:10]) / 10
        older_avg = sum(scores[10:]) / 10 if len(scores) > 10 else recent_avg
        
        trend = recent_avg - older_avg
        
        status = "Stable"
        if recent_avg > 75:
            status = "CRITICAL: Immediate break recommended."
        elif recent_avg > 60 and trend > 5:
            status = "HIGH RISK: Stress levels are climbing rapidly."
        elif recent_avg < 40:
            status = "LOW RISK: Currently in a relaxed or flow state."
            
        return f"Burnout Velocity Report:\n- Recent Average Stress: {recent_avg:.1f}/100\n- Trend: {'+' if trend > 0 else ''}{trend:.1f} points\n- Status: {status}"
    except Exception as e:
        return f"Error calculating burnout velocity: {e}"

@mcp.tool()
def trigger_intervention(intervention_type: str) -> str:
    """
    Triggers an autonomous system intervention.
    Available types: 'zen_theme', 'ergonomic_lockout', 'hydrate_reminder'
    """
    valid_interventions = ['zen_theme', 'ergonomic_lockout', 'hydrate_reminder']
    if intervention_type not in valid_interventions:
        return f"Invalid intervention type. Must be one of: {', '.join(valid_interventions)}"
        
    # In a fully integrated system, this could write to a command queue or send a WebSocket message
    # For now, we simulate the triggering of the intervention.
    return f"SUCCESS: Intervention '{intervention_type}' has been queued for execution on the NeuroSense frontend."

if __name__ == "__main__":
    print("\n" + "="*50)
    print("NeuroSense AI MCP Server — Initialization")
    print("="*50)
    print("Transport: SSE")
    print("Port: 5002")
    
    # Configure FastMCP server settings for SSE
    mcp.settings.host = "0.0.0.0"
    mcp.settings.port = 5002
    
    # Run the MCP server over SSE
    mcp.run(transport='sse')
