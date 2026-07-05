"""
app/ai/agents.py
=================
The five agents that make up the SentinelAI investigation crew.

Each agent is a small class with a `run(state) -> dict` method. `run`
takes the current LangGraph state and returns a partial-state dict of
updates (never mutates the input in place), consistent with how the
nodes in nodes.py apply them.

LLM calls are wrapped in try/except: if Ollama is unreachable or errors
out, each agent degrades gracefully to a deterministic, rule-based
fallback instead of failing the whole investigation.
"""

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.ai import prompts
from app.ai.config import REPORTS_DIR, get_llm
from app.ai.tools import (
    ThreatIntelRetriever,
    extract_log_features,
    highest_severity,
    run_threat_rule_engine,
)


def _invoke_llm(system_prompt: str, user_prompt: str) -> str | None:
    """Call the shared Ollama LLM; return None on any failure."""
    try:
        llm = get_llm()
        response = llm.invoke(
            [
                ("system", system_prompt),
                ("human", user_prompt),
            ]
        )
        content = getattr(response, "content", None)
        return content.strip() if isinstance(content, str) else None
    except Exception:
        # Ollama not running / model not pulled / network issue, etc.
        # Agents must degrade gracefully rather than crash the pipeline.
        return None


# ===========================================================================
# 1. SOC Commander
# ===========================================================================

class SOCCommanderAgent:
    """Coordinates the investigation and opens the incident."""

    name = "SOC Commander"

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        filename = state.get("filename", "unknown file")

        briefing = _invoke_llm(
            prompts.SOC_COMMANDER_SYSTEM_PROMPT,
            prompts.SOC_COMMANDER_USER_PROMPT.format(filename=filename),
        )
        if not briefing:
            briefing = (
                f"Investigation opened for '{filename}'. Dispatching Log "
                f"Intelligence, Threat Hunter, Threat Intelligence, and "
                f"Incident Reporter agents in sequence."
            )

        return {
            "commander_plan": briefing,
            "commander_notes": [briefing],
            "status": "investigating",
        }


# ===========================================================================
# 2. Log Intelligence Agent
# ===========================================================================

class LogIntelligenceAgent:
    """Reads the uploaded log file and extracts structured indicators."""

    name = "Log Intelligence Agent"

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        file_path = state["file_path"]

        if not os.path.isfile(file_path):
            return {
                "error": f"Log file not found on disk: {file_path}",
                "stop": True,
            }

        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                raw_content = f.read()
        except OSError as exc:
            return {"error": f"Failed to read log file: {exc}", "stop": True}

        parsed = extract_log_features(raw_content)

        notes = state.get("commander_notes", []) + [
            f"Log Intelligence Agent parsed {parsed['iocs']['total_lines']} lines, "
            f"found {len(parsed['iocs']['unique_ips'])} unique IP(s)."
        ]

        return {
            "raw_log_content": raw_content,
            "log_entries": parsed["entries"],
            "extracted_iocs": parsed["iocs"],
            "commander_notes": notes,
        }


# ===========================================================================
# 3. Threat Hunter Agent
# ===========================================================================

class ThreatHunterAgent:
    """Runs the rule engine to detect known attack patterns."""

    name = "Threat Hunter Agent"

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        entries = state.get("log_entries", [])
        iocs = state.get("extracted_iocs", {})

        threats = run_threat_rule_engine(entries, iocs)
        severity = highest_severity(threats)
        attack_type = threats[0]["type"] if threats else "None Detected"

        explanation = _invoke_llm(
            prompts.THREAT_HUNTER_SYSTEM_PROMPT,
            prompts.THREAT_HUNTER_USER_PROMPT.format(
                threats_json=json.dumps(threats, indent=2)
            ),
        )
        if not explanation:
            explanation = (
                f"{len(threats)} threat pattern(s) detected by the rule engine; "
                f"highest severity: {severity}."
                if threats
                else "No known attack patterns were detected in this log file."
            )

        notes = state.get("commander_notes", []) + [explanation]

        return {
            "threats_detected": threats,
            "attack_type": attack_type,
            "severity": severity,
            "commander_notes": notes,
        }


# ===========================================================================
# 4. Threat Intelligence Agent (RAG interface placeholder)
# ===========================================================================

class ThreatIntelligenceAgent:
    """
    Enriches detected threats with contextual intelligence.

    Uses `ThreatIntelRetriever` as the interface for a future LangChain
    RAG pipeline. Retrieval is not implemented yet (see tools.py) — this
    agent only wires the interface in so the rest of the workflow and the
    report format are already RAG-shaped.
    """

    name = "Threat Intelligence Agent"

    def __init__(self, retriever: ThreatIntelRetriever | None = None):
        # Future: inject a real LangChain retriever/vector store here.
        self.retriever = retriever or ThreatIntelRetriever()

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        threats = state.get("threats_detected", [])
        threat_types = [t["type"] for t in threats]

        # Placeholder retrieval call per threat type (returns [] today).
        intel_records: List[Dict[str, Any]] = []
        for t in threat_types:
            retrieved = self.retriever.retrieve(query=t)
            intel_records.append(
                {
                    "threat_type": t,
                    "retrieved_documents": retrieved,  # always [] until RAG lands
                    "rag_status": "not_implemented",
                }
            )

        context_note = None
        if threat_types:
            context_note = _invoke_llm(
                prompts.THREAT_INTELLIGENCE_SYSTEM_PROMPT,
                prompts.THREAT_INTELLIGENCE_USER_PROMPT.format(
                    threat_types=", ".join(threat_types)
                ),
            )

        for record in intel_records:
            record["general_context"] = context_note or (
                "General threat-intelligence context unavailable "
                "(LLM offline and RAG not yet implemented)."
            )

        notes = state.get("commander_notes", []) + [
            "Threat Intelligence Agent attached contextual notes "
            "(live RAG retrieval pending future implementation)."
        ]

        return {"threat_intelligence": intel_records, "commander_notes": notes}


# ===========================================================================
# 5. Incident Reporter
# ===========================================================================

class IncidentReporterAgent:
    """Generates the final structured Markdown incident report."""

    name = "Incident Reporter"

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        investigation_id = state.get("investigation_id", "unknown")
        filename = state.get("filename", "unknown file")
        iocs = state.get("extracted_iocs", {})
        threats = state.get("threats_detected", [])
        threat_intel = state.get("threat_intelligence", [])
        severity = state.get("severity", "low")
        attack_type = state.get("attack_type", "None Detected")

        findings_for_llm = {
            "filename": filename,
            "attack_type": attack_type,
            "severity": severity,
            "threats_detected": threats,
            "unique_ips": iocs.get("unique_ips", []),
            "total_log_lines": iocs.get("total_lines", 0),
        }

        summary, recommendations = self._generate_summary_and_recommendations(
            findings_for_llm, threats
        )

        report_markdown = self._build_markdown(
            investigation_id=investigation_id,
            filename=filename,
            severity=severity,
            attack_type=attack_type,
            iocs=iocs,
            threats=threats,
            threat_intel=threat_intel,
            summary=summary,
            recommendations=recommendations,
            commander_notes=state.get("commander_notes", []),
        )

        report_path = self._save_report(investigation_id, report_markdown)

        return {
            "summary": summary,
            "recommendations": recommendations,
            "report_markdown": report_markdown,
            "report_path": report_path,
            "status": "completed",
            "stop": True,  # explicit stop condition: workflow ends here
        }

    # -- helpers ------------------------------------------------------------

    def _generate_summary_and_recommendations(
        self, findings: Dict[str, Any], threats: List[Dict[str, Any]]
    ) -> tuple[str, str]:
        llm_output = _invoke_llm(
            prompts.INCIDENT_REPORTER_SYSTEM_PROMPT,
            prompts.INCIDENT_REPORTER_USER_PROMPT.format(
                findings_json=json.dumps(findings, indent=2)
            ),
        )

        if llm_output:
            return llm_output, ""  # keep LLM's combined output as summary block

        # Deterministic fallback if the LLM is unavailable.
        if threats:
            summary = (
                f"Analysis of '{findings['filename']}' identified "
                f"{len(threats)} threat pattern(s), the most severe being "
                f"'{findings['attack_type']}' (severity: {findings['severity']})."
            )
            recommendations = "\n".join(
                f"- Investigate and block source IP(s) associated with "
                f"{t['type']}: {', '.join(t.get('sample_ips', [])) or 'unknown'}"
                for t in threats
            )
        else:
            summary = (
                f"Analysis of '{findings['filename']}' found no evidence of "
                f"the monitored attack patterns (SQL injection, XSS, brute "
                f"force, directory traversal, or port scanning)."
            )
            recommendations = "- Continue routine monitoring; no immediate action required."

        return summary, recommendations

    def _build_markdown(
        self,
        investigation_id: str,
        filename: str,
        severity: str,
        attack_type: str,
        iocs: Dict[str, Any],
        threats: List[Dict[str, Any]],
        threat_intel: List[Dict[str, Any]],
        summary: str,
        recommendations: str,
        commander_notes: List[str],
    ) -> str:
        generated_at = datetime.now(timezone.utc).isoformat()

        lines = [
            f"# Incident Report — Investigation `{investigation_id}`",
            "",
            f"**File analyzed:** `{filename}`  ",
            f"**Generated at:** {generated_at}  ",
            f"**Overall severity:** {severity.upper()}  ",
            f"**Primary attack type:** {attack_type}",
            "",
            "## Executive Summary",
            "",
            summary,
            "",
            "## Recommendations",
            "",
            recommendations or "- No specific recommendations generated.",
            "",
            "## Indicators of Compromise (IOCs)",
            "",
            f"- Total log lines analyzed: {iocs.get('total_lines', 0)}",
            f"- Unique IP addresses: {len(iocs.get('unique_ips', []))}",
            f"- Failed login attempts by IP: {iocs.get('failed_login_attempts', {}) or 'None'}",
            f"- HTTP status code distribution: {iocs.get('status_codes', {}) or 'None'}",
            "",
            "## Detected Threats",
            "",
        ]

        if threats:
            for t in threats:
                lines += [
                    f"### {t['type']} (severity: {t['severity']})",
                    f"- Evidence count: {t.get('evidence_count', 0)}",
                    f"- Source IP(s): {', '.join(t.get('sample_ips', [])) or 'unknown'}",
                    "- Sample evidence:",
                ]
                lines += [f"  - `{ev}`" for ev in t.get("sample_evidence", [])]
                lines.append("")
        else:
            lines.append("No known attack patterns were detected.\n")

        lines += ["## Threat Intelligence Context", ""]
        if threat_intel:
            for record in threat_intel:
                lines += [
                    f"### {record['threat_type']}",
                    f"- RAG status: `{record['rag_status']}` "
                    f"(placeholder — full retrieval not yet implemented)",
                    f"- {record.get('general_context', '')}",
                    "",
                ]
        else:
            lines.append(
                "No threats were detected, so no threat-intelligence lookups "
                "were required.\n"
            )

        lines += ["## SOC Commander Notes", ""]
        lines += [f"- {note}" for note in commander_notes]

        return "\n".join(lines)

    def _save_report(self, investigation_id: str, markdown: str) -> str:
        os.makedirs(REPORTS_DIR, exist_ok=True)
        report_filename = f"{investigation_id}.md"
        report_path = os.path.join(REPORTS_DIR, report_filename)
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(markdown)
        return report_path
