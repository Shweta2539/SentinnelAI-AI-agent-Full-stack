"""
app/ai/config.py
================
Configuration for the AI investigation subsystem (LangGraph + Ollama).

This module is intentionally self-contained so the rest of the AI package
never hardcodes model names, URLs, or directory paths.
"""

import os

from app.config import settings

# --- Ollama ---------------------------------------------------------------
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
OLLAMA_TEMPERATURE: float = float(os.getenv("OLLAMA_TEMPERATURE", "0.2"))
OLLAMA_REQUEST_TIMEOUT: int = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))

# --- Rule-engine thresholds (Threat Hunter agent) --------------------------
BRUTE_FORCE_FAILED_LOGIN_THRESHOLD: int = int(
    os.getenv("BRUTE_FORCE_FAILED_LOGIN_THRESHOLD", "5")
)
PORT_SCAN_DISTINCT_ENDPOINT_THRESHOLD: int = int(
    os.getenv("PORT_SCAN_DISTINCT_ENDPOINT_THRESHOLD", "8")
)

# --- Filesystem paths -------------------------------------------------------
# Resolve backend/ root the same way app/api/upload.py does, so this module
# works regardless of the process's current working directory.
_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR: str = os.path.join(_BACKEND_ROOT, settings.UPLOAD_DIR)
REPORTS_DIR: str = os.path.join(_BACKEND_ROOT, settings.REPORTS_DIR)
os.makedirs(REPORTS_DIR, exist_ok=True)


_llm_singleton = None


def get_llm(temperature: float = None):
    """
    Lazily construct (and cache) a ChatOllama client.

    Lazy + cached so importing this module never requires Ollama to be
    running, and every agent shares one client instance by default.
    """
    global _llm_singleton
    if _llm_singleton is not None and temperature is None:
        return _llm_singleton

    from langchain_ollama import ChatOllama

    llm = ChatOllama(
        model=OLLAMA_MODEL,
        base_url=OLLAMA_BASE_URL,
        temperature=OLLAMA_TEMPERATURE if temperature is None else temperature,
    )

    if temperature is None:
        _llm_singleton = llm
    return llm
