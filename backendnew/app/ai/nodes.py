"""
app/ai/nodes.py
================
LangGraph node functions. Each node wraps exactly one agent from
agents.py, calls its `run(state)`, and returns the partial-state update.

Every node is defensive: if an agent raises an unexpected exception, the
node catches it, records it on `state["error"]`, and sets `state["stop"]`
so the graph's conditional routing (see graph.py) halts the workflow
instead of crashing the request.
"""

from typing import Any, Dict

from app.ai.agents import (
    IncidentReporterAgent,
    LogIntelligenceAgent,
    SOCCommanderAgent,
    ThreatHunterAgent,
    ThreatIntelligenceAgent,
)

_soc_commander = SOCCommanderAgent()
_log_intelligence = LogIntelligenceAgent()
_threat_hunter = ThreatHunterAgent()
_threat_intelligence = ThreatIntelligenceAgent()
_incident_reporter = IncidentReporterAgent()


def _safe_run(agent, node_name: str, state: Dict[str, Any]) -> Dict[str, Any]:
    """Run an agent and normalize any exception into a stop-worthy error."""
    try:
        return agent.run(state)
    except Exception as exc:  # noqa: BLE001 - deliberately broad, see docstring
        return {
            "error": f"{node_name} failed: {exc}",
            "status": "failed",
            "stop": True,
        }


def soc_commander_node(state: Dict[str, Any]) -> Dict[str, Any]:
    return _safe_run(_soc_commander, "SOC Commander", state)


def log_intelligence_node(state: Dict[str, Any]) -> Dict[str, Any]:
    return _safe_run(_log_intelligence, "Log Intelligence Agent", state)


def threat_hunter_node(state: Dict[str, Any]) -> Dict[str, Any]:
    return _safe_run(_threat_hunter, "Threat Hunter Agent", state)


def threat_intelligence_node(state: Dict[str, Any]) -> Dict[str, Any]:
    return _safe_run(_threat_intelligence, "Threat Intelligence Agent", state)


def incident_reporter_node(state: Dict[str, Any]) -> Dict[str, Any]:
    result = _safe_run(_incident_reporter, "Incident Reporter", state)
    # Explicit stop condition: whether the reporter succeeded or failed,
    # the workflow always terminates after this node.
    result.setdefault("stop", True)
    return result
