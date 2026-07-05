"""
app/ai/tools.py
================
Non-LLM "tools" used by the AI agents:

1. Log parsing (regex-based)      -> used by the Log Intelligence Agent
2. Threat rule engine (regex/heuristics) -> used by the Threat Hunter Agent
3. Threat intelligence retriever placeholder -> used by the Threat
   Intelligence Agent, pending a future LangChain RAG implementation.

Nothing here calls an LLM. Keeping these as plain, deterministic Python
functions makes them fast, testable, and independent of Ollama being up.
"""

import re
from collections import defaultdict
from typing import Any, Dict, List

from app.ai.config import (
    BRUTE_FORCE_FAILED_LOGIN_THRESHOLD,
    PORT_SCAN_DISTINCT_ENDPOINT_THRESHOLD,
)

# ===========================================================================
# 1. Log Intelligence Agent tools
# ===========================================================================

IP_REGEX = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")

# Matches common access-log / syslog style timestamps, e.g.:
#   [10/Oct/2023:13:55:36 -0700]   or   2023-10-10 13:55:36
TIMESTAMP_REGEX = re.compile(
    r"\[?(\d{1,2}/[A-Za-z]{3}/\d{4}:\d{2}:\d{2}:\d{2}\s?[+-]?\d{0,4})\]?"
    r"|(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})"
)

URL_REGEX = re.compile(r"(?:GET|POST|PUT|DELETE|PATCH|HEAD)\s+(\S+)\s+HTTP")
GENERIC_URL_REGEX = re.compile(r"https?://[^\s\"']+")

STATUS_CODE_REGEX = re.compile(r'"\s+(\d{3})\s+')
STANDALONE_STATUS_REGEX = re.compile(r"\b([1-5]\d{2})\b")

FAILED_LOGIN_REGEX = re.compile(
    r"(failed password|authentication failure|invalid user|login failed|"
    r"failed login|401 unauthorized|access denied)",
    re.IGNORECASE,
)


def parse_log_line(line: str) -> Dict[str, Any]:
    """Extract structured fields from a single raw log line via regex."""
    ip_match = IP_REGEX.search(line)
    ts_match = TIMESTAMP_REGEX.search(line)
    url_match = URL_REGEX.search(line) or GENERIC_URL_REGEX.search(line)
    status_match = STATUS_CODE_REGEX.search(line) or STANDALONE_STATUS_REGEX.search(line)
    is_failed_login = bool(FAILED_LOGIN_REGEX.search(line))

    return {
        "raw": line.strip(),
        "ip": ip_match.group(0) if ip_match else None,
        "timestamp": (ts_match.group(0).strip("[]") if ts_match else None),
        "url": url_match.group(1) if (url_match and url_match.lastindex) else (
            url_match.group(0) if url_match else None
        ),
        "status_code": status_match.group(1) if status_match else None,
        "failed_login": is_failed_login,
    }


def extract_log_features(raw_content: str) -> Dict[str, Any]:
    """
    Parse an entire uploaded log file into structured entries plus an
    aggregated indicator-of-compromise (IOC) summary.

    Returns:
        {
            "entries": [ {ip, timestamp, url, status_code, failed_login}, ... ],
            "iocs": {
                "unique_ips": [...],
                "urls": [...],
                "status_codes": {"200": n, "404": n, ...},
                "failed_login_attempts": {"1.2.3.4": n, ...},
                "total_lines": n,
            },
        }
    """
    lines = [l for l in raw_content.splitlines() if l.strip()]

    entries: List[Dict[str, Any]] = []
    ips = set()
    urls = set()
    status_counts: Dict[str, int] = defaultdict(int)
    failed_logins_by_ip: Dict[str, int] = defaultdict(int)

    for line in lines:
        entry = parse_log_line(line)
        entries.append(entry)

        if entry["ip"]:
            ips.add(entry["ip"])
        if entry["url"]:
            urls.add(entry["url"])
        if entry["status_code"]:
            status_counts[entry["status_code"]] += 1
        if entry["failed_login"]:
            failed_logins_by_ip[entry["ip"] or "unknown"] += 1

    iocs = {
        "unique_ips": sorted(ips),
        "urls": sorted(urls),
        "status_codes": dict(status_counts),
        "failed_login_attempts": dict(failed_logins_by_ip),
        "total_lines": len(lines),
    }

    return {"entries": entries, "iocs": iocs}


# ===========================================================================
# 2. Threat Hunter Agent tools (rule engine)
# ===========================================================================

SQLI_PATTERN = re.compile(
    r"(\%27)|(\')|(--)|(\%23)|(#)|(\bor\b\s+1\s*=\s*1)|(\bunion\b\s+\bselect\b)|"
    r"(\bselect\b.+\bfrom\b)|(\bdrop\b\s+\btable\b)|(\bsleep\()",
    re.IGNORECASE,
)

XSS_PATTERN = re.compile(
    r"(<script)|(%3cscript)|(onerror\s*=)|(onload\s*=)|(javascript:)|(<img[^>]+src)",
    re.IGNORECASE,
)

DIR_TRAVERSAL_PATTERN = re.compile(
    r"(\.\./)|(\.\.\\)|(%2e%2e%2f)|(%2e%2e/)|(/etc/passwd)|(boot\.ini)|(win\.ini)",
    re.IGNORECASE,
)


def detect_sql_injection(entries: List[Dict[str, Any]]) -> Dict[str, Any] | None:
    hits = [e for e in entries if e.get("url") and SQLI_PATTERN.search(e["url"])] or \
        [e for e in entries if SQLI_PATTERN.search(e.get("raw", ""))]
    if not hits:
        return None
    return {
        "type": "SQL Injection",
        "severity": "critical",
        "evidence_count": len(hits),
        "sample_ips": sorted({e["ip"] for e in hits if e.get("ip")})[:10],
        "sample_evidence": [e["raw"] for e in hits[:5]],
    }


def detect_xss(entries: List[Dict[str, Any]]) -> Dict[str, Any] | None:
    hits = [e for e in entries if XSS_PATTERN.search(e.get("raw", ""))]
    if not hits:
        return None
    return {
        "type": "Cross-Site Scripting (XSS)",
        "severity": "high",
        "evidence_count": len(hits),
        "sample_ips": sorted({e["ip"] for e in hits if e.get("ip")})[:10],
        "sample_evidence": [e["raw"] for e in hits[:5]],
    }


def detect_directory_traversal(entries: List[Dict[str, Any]]) -> Dict[str, Any] | None:
    hits = [e for e in entries if DIR_TRAVERSAL_PATTERN.search(e.get("raw", ""))]
    if not hits:
        return None
    return {
        "type": "Directory Traversal",
        "severity": "high",
        "evidence_count": len(hits),
        "sample_ips": sorted({e["ip"] for e in hits if e.get("ip")})[:10],
        "sample_evidence": [e["raw"] for e in hits[:5]],
    }


def detect_brute_force(iocs: Dict[str, Any]) -> Dict[str, Any] | None:
    offenders = {
        ip: count
        for ip, count in iocs.get("failed_login_attempts", {}).items()
        if count >= BRUTE_FORCE_FAILED_LOGIN_THRESHOLD
    }
    if not offenders:
        return None
    return {
        "type": "Brute Force Login Attempt",
        "severity": "high",
        "evidence_count": sum(offenders.values()),
        "sample_ips": sorted(offenders.keys())[:10],
        "sample_evidence": [f"{ip}: {c} failed login attempts" for ip, c in offenders.items()],
    }


def detect_port_scan(entries: List[Dict[str, Any]]) -> Dict[str, Any] | None:
    """
    Heuristic: a single source IP hitting an unusually high number of
    distinct URLs/endpoints in the log is treated as scan-like behavior.
    """
    endpoints_by_ip: Dict[str, set] = defaultdict(set)
    for e in entries:
        if e.get("ip") and e.get("url"):
            endpoints_by_ip[e["ip"]].add(e["url"])

    offenders = {
        ip: len(urls)
        for ip, urls in endpoints_by_ip.items()
        if len(urls) >= PORT_SCAN_DISTINCT_ENDPOINT_THRESHOLD
    }
    if not offenders:
        return None
    return {
        "type": "Port/Endpoint Scan",
        "severity": "medium",
        "evidence_count": sum(offenders.values()),
        "sample_ips": sorted(offenders.keys())[:10],
        "sample_evidence": [f"{ip}: {n} distinct endpoints probed" for ip, n in offenders.items()],
    }


_SEVERITY_ORDER = {"critical": 4, "high": 3, "medium": 2, "low": 1}


def run_threat_rule_engine(
    entries: List[Dict[str, Any]], iocs: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Run every detection rule and return the list of triggered threats."""
    detectors = (
        detect_sql_injection(entries),
        detect_xss(entries),
        detect_brute_force(iocs),
        detect_directory_traversal(entries),
        detect_port_scan(entries),
    )
    threats = [d for d in detectors if d is not None]
    threats.sort(key=lambda t: _SEVERITY_ORDER.get(t["severity"], 0), reverse=True)
    return threats


def highest_severity(threats: List[Dict[str, Any]]) -> str:
    if not threats:
        return "low"
    return max(threats, key=lambda t: _SEVERITY_ORDER.get(t["severity"], 0))["severity"]


# ===========================================================================
# 3. Threat Intelligence Agent tool (RAG placeholder)
# ===========================================================================

class ThreatIntelRetriever:
    """
    Placeholder retriever interface for the Threat Intelligence Agent.

    This defines the interface a future LangChain RAG retriever (backed by
    a vector store of CVEs / threat-intel feeds / MITRE ATT&CK data) will
    implement. It does NOT perform retrieval yet — it returns an empty,
    clearly-labeled result so downstream code and the report format are
    already RAG-shaped when the real implementation is dropped in.

    Future implementation sketch:
        - Embed a corpus of threat-intel documents (e.g. MITRE ATT&CK,
          CVE feeds, internal incident history) with a LangChain
          embeddings model.
        - Store vectors in a vector store (Chroma/FAISS/pgvector).
        - Implement `retrieve()` as `vectorstore.similarity_search(query)`.
        - Wire this class into a LangChain `Retriever`/RAG chain.
    """

    def __init__(self, top_k: int = 5):
        self.top_k = top_k

    def retrieve(self, query: str) -> List[Dict[str, Any]]:
        """
        Placeholder retrieval call.

        Returns an empty list today. Kept as a real method (not raising
        NotImplementedError) so the graph can run end-to-end before RAG
        is implemented.
        """
        return []
