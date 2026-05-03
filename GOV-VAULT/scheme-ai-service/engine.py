"""
SchemeEngine — single adapter seam between GOV-VAULT wrapper and Scheme Saathi internals.

Design decisions:
- Lazy import via importlib.import_module to defer module-level init (Pinecone, SentenceTransformer, ChatGroq)
- Startup warmup moves cold start to boot, not first request
- Monkey-patches ssa.index after import to supply real PINECONE_HOST from our env
- Double-checked singleton sufficient for prototype concurrency
"""

import os
import logging
import threading
import importlib
import sys
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

SCHEME_SAATHI_PATH = os.getenv("SCHEME_SAATHI_PATH", r"D:\capstone\Scheme_Saathi")
PINECONE_HOST = os.getenv("PINECONE_HOST", "")
if not PINECONE_HOST:
    raise EnvironmentError("PINECONE_HOST env var is required")


class SchemeEngine:
    """
    Single seam for all Scheme Saathi coupling.
    If Scheme Saathi internals change → only this class changes.
    """

    _ssa = None          # scheme_search_agent module
    _lock = threading.Lock()

    @classmethod
    def _ensure_loaded(cls) -> None:
        """
        Idempotent. Thread-safe via double-checked locking.
        Runs module-level init for Pinecone, SentenceTransformer, ChatGroq.
        Called at startup warmup — never during request handling.
        """
        if cls._ssa is not None:
            return

        with cls._lock:
            if cls._ssa is not None:
                return  # another thread won the race

            logger.info("SchemeEngine: loading Scheme Saathi agents...")

            # Inject path so importlib can find the modules
            if SCHEME_SAATHI_PATH not in sys.path:
                sys.path.insert(0, SCHEME_SAATHI_PATH)

            # Import triggers module-level Pinecone + SentenceTransformer + ChatGroq init
            # Keys must already be in env — if not, this raises and startup fails (correct)
            ssa = importlib.import_module("scheme_search_agent")

            # Monkey-patch: override module-level Pinecone index with our env-supplied host.
            # scheme_search_agent hardcodes host="Pinecone DB hosting link" — we fix it here.
            try:
                from pinecone import Pinecone as _PC
                _pc_client = _PC(api_key=os.environ["PINECONE_API_KEY"])
                ssa.index = _pc_client.Index(name="scheme-data", host=PINECONE_HOST)
                logger.info("SchemeEngine: Pinecone index overridden with env host ✓")
            except Exception as e:
                logger.error(f"SchemeEngine: Pinecone host override failed: {e}")
                raise

            cls._ssa = ssa
            logger.info("SchemeEngine: fully loaded ✓")

    @classmethod
    def recommend(cls, profile: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Main recommendation pipeline. Returns top_k schemes.

        Args:
            profile: dict with keys matching Scheme Saathi user_details:
                     state, gender, occupation, income, category, additional_details
            top_k: number of schemes to return (default 5)

        Returns:
            list of scheme dicts (trimmed for API response)
        """
        cls._ensure_loaded()
        ssa = cls._ssa

        # 1. Build natural-language query from profile
        query = ssa.generate_query(profile)
        logger.info(f"SchemeEngine: generated query ({len(query)} chars)")

        # 2. Vector search via Pinecone
        raw_results = ssa.search_pinecone(query, top_k=20)
        if not raw_results:
            logger.warning("SchemeEngine: Pinecone returned no results")
            return []

        # 3. State filter (same logic as original search_schemes)
        user_state = str(profile.get("state", "")).lower()
        filtered_state = [
            s for s in raw_results
            if user_state == str(s["metadata"].get("state", "")).lower()
            or any(t in str(s["metadata"].get("state", "")).lower()
                   for t in ["all india", "central", "nationwide"])
        ]
        
        # 3.5. Hard constraint filter for Religion / Caste
        user_religion = str(profile.get("religion", "")).lower()
        user_category = str(profile.get("category", "")).lower()
        user_caste = str(profile.get("caste", "")).lower()

        # All Hindu-Brahmin specific scheme keywords found in the AP Brahmin Welfare Corp schemes
        BRAHMIN_SCHEME_KEYWORDS = [
            "brahmin", "brahmana", "brahmanulu", "brahmin welfare", "andhra brahmin",
            # AP Brahmin Welfare Corporation scheme series names
            "bharati scheme", "veda vyasa", "vedavyasa", "kashyapa scheme", "garuda scheme",
            "parasara scheme", "agastya scheme", "vasishta scheme", "vishwamitra scheme",
            "bharadwaj scheme", "dronacharya scheme", "sankaracharya scheme",
            # General upper-caste / forward-caste identifiers
            "forward caste", "upper caste", "oc community", "fc community",
            "vedic education", "vedic scholar", "puja", "agrahara",
            # Hindu-community-only schemes
            "kapu welfare", "kamma welfare", "reddy welfare", "velama welfare",
            "naidu welfare", "raju welfare",
        ]

        # SC/ST specific scheme keywords that should NOT go to General/OBC/OC
        SC_ST_ONLY_KEYWORDS = []  # SC/ST users CAN see their own schemes

        def is_valid_for_profile(meta):
            scheme_name = str(meta.get("scheme_name", "")).lower()
            text = f"{scheme_name} {meta.get('brief_description','')} {meta.get('eligibility_criteria','')} {meta.get('tags','')} {meta.get('category','')}".lower()

            # For non-Hindu religions OR SC/ST category → block all Brahmin/Hindu-exclusive schemes
            is_minority_religion = user_religion in ["christian", "muslim", "sikh", "buddhist", "jain", "other"]
            is_sc_st = user_category in ["sc", "st", "scheduled caste", "scheduled tribe"]

            if is_minority_religion or is_sc_st:
                if any(keyword in text for keyword in BRAHMIN_SCHEME_KEYWORDS):
                    logger.info(f"Filtered out Brahmin scheme for {user_religion}/{user_category}: {meta.get('scheme_name','?')}")
                    return False

            return True

        filtered = [s for s in filtered_state if is_valid_for_profile(s["metadata"])]

        if not filtered:
            logger.warning("SchemeEngine: no schemes after state and hard filters")
            return []

        # 4. LLM reranking
        ranked = ssa.rerank_with_llm(filtered, profile, top_k=top_k)

        return ranked
