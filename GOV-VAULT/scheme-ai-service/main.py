"""
main.py — GOV-VAULT Scheme AI Service (FastAPI wrapper around Scheme Saathi)

Startup warmup pre-loads Pinecone + SentenceTransformer + ChatGroq at boot.
If warmup fails → app crashes hard (fail-fast, no zombie service).
POST /recommend — returns top 5 scheme recommendations.
GET /health     — service observability.
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional
from dotenv import load_dotenv

load_dotenv("../.env")

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from engine import SchemeEngine
from db import fetch_scheme_details

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="GOV-VAULT Scheme AI Service",
    description="Isolated AI microservice wrapping Scheme Saathi recommendation engine.",
    version="1.0.0",
)


# ── Startup warmup ────────────────────────────────────────────────────────────
# Moves Pinecone + SentenceTransformer + ChatGroq cold-start to boot time.
# If any init fails → startup raises → uvicorn exits → NOT a zombie service.
@app.on_event("startup")
async def warmup():
    logger.info("=== Startup warmup: loading SchemeEngine ===")
    # No try/catch — warmup failure must crash the app immediately.
    # Fail-fast > zombie service that silently fails every request.
    SchemeEngine._ensure_loaded()
    logger.info("=== Startup warmup complete ===")


# ── Request / Response models ─────────────────────────────────────────────────
class RecommendRequest(BaseModel):
    state:       str = Field(..., description="User's state, e.g. 'Maharashtra'")
    incomeRange: str = Field(..., description="Income range, e.g. '0-2.5L'")
    occupation:  str = Field(..., description="Occupation, e.g. 'Farmer'")
    age:         int = Field(..., ge=1, le=120)
    gender:      str = Field(..., description="'Male' | 'Female' | 'Other'")
    category:    str = Field(default="General", description="Caste category: General, SC, ST, OBC")
    familySize:  Optional[int] = Field(default=None, ge=1)


class SchemeResult(BaseModel):
    schemeId:          str
    schemeName:        str
    benefitSummary:    str   # kept concise — no raw embedding data
    eligibilityReason: str   # 1-2 lines from LLM rerank score
    source:            str   # always "AI"
    recommendedAt:     str   # ISO-8601 UTC


class RecommendResponse(BaseModel):
    count:   int
    schemes: list[SchemeResult]


# ── POST /recommend ───────────────────────────────────────────────────────────
@app.post("/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest) -> RecommendResponse:
    """
    Returns top 5 government scheme recommendations for a given family profile.
    Calls Scheme Saathi's Pinecone + Groq pipeline internally.
    """

    # Map API fields → Scheme Saathi user_details format
    profile = {
        "state":              req.state,
        "gender":             req.gender,
        "occupation":         req.occupation,
        "income":             req.incomeRange,
        "caste":              req.category,
        "category":           req.category,
        "additional_details": (
            f"Age: {req.age}. Family size: {req.familySize or 'unknown'}."
        ),
    }

    try:
        ranked = SchemeEngine.recommend(profile, top_k=5)
    except Exception as e:
        logger.error(f"/recommend: SchemeEngine failed: {e}")
        raise HTTPException(status_code=503, detail="AI recommendation engine unavailable")

    timestamp = datetime.now(timezone.utc).isoformat()
    results: list[SchemeResult] = []

    for item in ranked:
        meta = item.get("metadata", {})
        scheme_id   = meta.get("scheme_id", "")
        scheme_name = meta.get("scheme_name", "Unknown Scheme")
        llm_score   = item.get("llm_score", 0)

        # SQLite enrichment for brief description — fall back to Pinecone metadata
        db_detail = fetch_scheme_details(scheme_id)
        benefit_summary = (
            (db_detail.get("detailed_description", "") or meta.get("brief_description", ""))[:300]
            if db_detail
            else (meta.get("brief_description", "") or "See official scheme portal")[:300]
        )

        eligibility = (meta.get("eligibility_criteria", "") or "")[:200]

        results.append(SchemeResult(
            schemeId=scheme_id,
            schemeName=scheme_name,
            benefitSummary=benefit_summary,
            eligibilityReason=eligibility or f"Relevance score: {llm_score}/100",
            source="AI",
            recommendedAt=timestamp,
        ))

    logger.info(f"/recommend: returned {len(results)} schemes for state={req.state!r}")
    return RecommendResponse(count=len(results), schemes=results)


# ── GET /health ───────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    """Service observability — confirms engine is loaded."""
    engine_ready = SchemeEngine._ssa is not None
    return {
        "status": "ok" if engine_ready else "warming_up",
        "engine": "loaded" if engine_ready else "not_loaded",
        "service": "scheme-ai-service",
    }
