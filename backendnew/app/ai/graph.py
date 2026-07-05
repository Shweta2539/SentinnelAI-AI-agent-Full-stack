"""
app/ai/graph.py
================
Builds and compiles the LangGraph workflow for a SentinelAI investigation:

    START
      -> SOC Commander
      -> Log Intelligence
      -> Threat Hunter
      -> Threat Intelligence
      -> Incident Reporter
      -> END

An explicit stop condition is checked after every node via
`_route_or_stop`: if a node sets `state["stop"]` truthy or `state["error"]`
non-empty, the graph routes straight to END instead of continuing to the
next agent. This lets any node halt the pipeline early (e.g. missing
file, unrecoverable error) without special-casing each edge.
"""

from typing import Literal

from langgraph.graph import END, START, StateGraph

from app.ai.nodes import (
    incident_reporter_node,
    log_intelligence_node,
    soc_commander_node,
    threat_hunter_node,
    threat_intelligence_node,
)
from app.ai.state import InvestigationState

NODE_SOC_COMMANDER = "soc_commander"
NODE_LOG_INTELLIGENCE = "log_intelligence"
NODE_THREAT_HUNTER = "threat_hunter"
NODE_THREAT_INTELLIGENCE = "threat_intelligence_agent"
NODE_INCIDENT_REPORTER = "incident_reporter"


def _make_router(next_node: str):
    """
    Build a conditional-edge router for a given node.

    Returns `next_node` to continue the pipeline, or `END` if the explicit
    stop condition (`state["stop"]` or `state["error"]`) has been set.
    """

    def _router(state: InvestigationState) -> Literal["__end__"] | str:  # type: ignore[name-defined]
        if state.get("stop") or state.get("error"):
            return END
        return next_node

    return _router


def build_investigation_graph():
    """Construct and compile the SentinelAI investigation StateGraph."""
    workflow = StateGraph(InvestigationState)

    workflow.add_node(NODE_SOC_COMMANDER, soc_commander_node)
    workflow.add_node(NODE_LOG_INTELLIGENCE, log_intelligence_node)
    workflow.add_node(NODE_THREAT_HUNTER, threat_hunter_node)
    workflow.add_node(NODE_THREAT_INTELLIGENCE, threat_intelligence_node)
    workflow.add_node(NODE_INCIDENT_REPORTER, incident_reporter_node)

    workflow.add_edge(START, NODE_SOC_COMMANDER)

    workflow.add_conditional_edges(
        NODE_SOC_COMMANDER,
        _make_router(NODE_LOG_INTELLIGENCE),
        {NODE_LOG_INTELLIGENCE: NODE_LOG_INTELLIGENCE, END: END},
    )
    workflow.add_conditional_edges(
        NODE_LOG_INTELLIGENCE,
        _make_router(NODE_THREAT_HUNTER),
        {NODE_THREAT_HUNTER: NODE_THREAT_HUNTER, END: END},
    )
    workflow.add_conditional_edges(
        NODE_THREAT_HUNTER,
        _make_router(NODE_THREAT_INTELLIGENCE),
        {NODE_THREAT_INTELLIGENCE: NODE_THREAT_INTELLIGENCE, END: END},
    )
    workflow.add_conditional_edges(
        NODE_THREAT_INTELLIGENCE,
        _make_router(NODE_INCIDENT_REPORTER),
        {NODE_INCIDENT_REPORTER: NODE_INCIDENT_REPORTER, END: END},
    )
    # Incident Reporter always terminates the workflow (explicit stop
    # condition set in nodes.incident_reporter_node), so a plain edge to
    # END is sufficient here.
    workflow.add_edge(NODE_INCIDENT_REPORTER, END)

    return workflow.compile()


# Compiled once at import time and reused across requests.
investigation_graph = build_investigation_graph()


def run_investigation(initial_state: InvestigationState) -> InvestigationState:
    """
    Execute the compiled graph synchronously and return the final state.

    Kept as a thin wrapper so callers (the FastAPI route) don't need to
    know anything about LangGraph's `.invoke()` API directly.
    """
    final_state = investigation_graph.invoke(initial_state)
    return final_state
