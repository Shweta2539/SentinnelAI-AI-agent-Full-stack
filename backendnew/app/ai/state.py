"""
app/ai/state.py
================
The shared state object that flows through every node of the LangGraph
investigation workflow:

    START -> soc_commander -> log_intelligence -> threat_hunter
          -> threat_intelligence -> incident_reporter -> END

Every node reads what it needs from this TypedDict and returns a partial
dict of updates, which LangGraph merges back into the running state.
"""

from typing import Any, Dict, List, Optional, TypedDict


class InvestigationState(TypedDict, total=False):
    # --- Inputs (set before the graph starts) ---
    investigation_id: str
    filename: str
    file_path: str

    # --- SOC Commander ---
    commander_plan: str
    commander_notes: List[str]

    # --- Log Intelligence Agent ---
    raw_log_content: str
    log_entries: List[Dict[str, Any]]
    extracted_iocs: Dict[str, Any]

    # --- Threat Hunter Agent ---
    threats_detected: List[Dict[str, Any]]
    attack_type: str
    severity: str

    # --- Threat Intelligence Agent (RAG placeholder) ---
    threat_intelligence: List[Dict[str, Any]]

    # --- Incident Reporter ---
    report_markdown: str
    report_path: str
    summary: str
    recommendations: str

    # --- Workflow control ---
    status: str  # investigating | completed | failed
    error: Optional[str]
    stop: bool  # explicit stop condition flag, checked after every node
