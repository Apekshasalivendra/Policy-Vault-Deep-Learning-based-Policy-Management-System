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
    religion:    Optional[str] = Field(default=None, description="User's religion")
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
    Falls back to curated community-matched schemes when index returns insufficient results.
    """

    # Map API fields → Scheme Saathi user_details format
    profile = {
        "state":              req.state,
        "gender":             req.gender,
        "occupation":         req.occupation,
        "income":             req.incomeRange,
        "caste":              req.category,
        "religion":           req.religion or "",
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

    # ── Curated fallback pool ─────────────────────────────────────────────────
    # When Pinecone returns < 5 eligible results for SC/ST/minority/OBC users
    # (because Brahmin schemes were correctly filtered out), we fill up to 5
    # with verified real government schemes for their community.
    religion  = (req.religion or "").lower().strip()
    category  = req.category.lower().strip()
    state     = req.state.strip()
    gender    = req.gender.lower().strip()

    is_sc_st         = category in ["sc", "st", "scheduled caste", "scheduled tribe"]
    is_obc           = category in ["obc", "other backward class", "bc"]
    is_christian     = religion == "christian"
    is_muslim        = religion == "muslim"
    is_minority      = religion in ["christian", "muslim", "sikh", "buddhist", "jain"]
    is_female        = gender == "female"

    CURATED: list[SchemeResult] = []

    if is_sc_st:
        CURATED += [
            SchemeResult(
                schemeId="GOI-SC-001",
                schemeName="Post Matric Scholarship for SC Students",
                benefitSummary=(
                    "Central Government scholarship for Scheduled Caste students pursuing post-matriculation "
                    "or post-secondary education. Covers tuition fees, maintenance allowance, and study materials."
                ),
                eligibilityReason=(
                    "1. Applicant must belong to Scheduled Caste. "
                    "2. Annual family income must not exceed ₹2.5 Lakh. "
                    "3. Must be enrolled in a recognised institution."
                ),
                source="AI",
                recommendedAt=timestamp,
            ),
            SchemeResult(
                schemeId="AP-SC-002",
                schemeName="Dr. BR Ambedkar Overseas Vidyanidhi (SC/ST Foreign Education)",
                benefitSummary=(
                    "Andhra Pradesh government scheme providing financial assistance to SC/ST students "
                    "admitted to top-ranked universities abroad for higher studies."
                ),
                eligibilityReason=(
                    "1. Applicant must belong to SC or ST community. "
                    "2. Must have secured admission in a university ranked in top 500 globally. "
                    "3. Annual family income below ₹6 Lakh."
                ),
                source="AI",
                recommendedAt=timestamp,
            ),
            SchemeResult(
                schemeId="AP-SC-003",
                schemeName="APCNSS — AP Scheduled Caste Cooperative Finance Corporation Loan",
                benefitSummary=(
                    "Low-interest loans for Scheduled Caste entrepreneurs in Andhra Pradesh to start or expand "
                    "self-employment ventures including agriculture, trade, and small business."
                ),
                eligibilityReason=(
                    "1. Applicant must belong to Scheduled Caste. "
                    "2. Must be a resident of Andhra Pradesh. "
                    "3. Annual income below ₹2 Lakh for rural / ₹3 Lakh for urban areas."
                ),
                source="AI",
                recommendedAt=timestamp,
            ),
            SchemeResult(
                schemeId="GOI-SC-004",
                schemeName="National SC/ST Hub — Government e-Marketplace Preference",
                benefitSummary=(
                    "Central Government initiative giving SC/ST entrepreneurs preferential access to government "
                    "procurement on the GeM portal with purchase preference and exemption from earnest money."
                ),
                eligibilityReason=(
                    "1. Business must be owned/controlled by SC or ST individual. "
                    "2. Must be registered on Government e-Marketplace (GeM). "
                    "3. Open to all states."
                ),
                source="AI",
                recommendedAt=timestamp,
            ),
            SchemeResult(
                schemeId="AP-SCST-005",
                schemeName="Jagananna Vidya Deevena — Fee Reimbursement (SC/ST/BC/EWS)",
                benefitSummary=(
                    "Andhra Pradesh fee reimbursement scheme covering full tuition and special fee for SC, ST, BC, "
                    "EWS students pursuing ITI, Diploma, Degree, and PG courses in AP."
                ),
                eligibilityReason=(
                    "1. Must belong to SC, ST, BC, or EWS category. "
                    "2. Must be studying in a recognised institution in Andhra Pradesh. "
                    "3. Annual family income below ₹2.5 Lakh."
                ),
                source="AI",
                recommendedAt=timestamp,
            ),
        ]

    if is_christian or is_minority:
        CURATED += [
            SchemeResult(
                schemeId="GOI-MIN-001",
                schemeName="PM Vikas (Pradhan Mantri VIKAS) — Minority Skill Development",
                benefitSummary=(
                    "Central Government scheme for skill and leadership development of minorities (Muslim, Christian, "
                    "Sikh, Buddhist, Jain, Parsi). Covers vocational training, technology upgradation, and market linkage."
                ),
                eligibilityReason=(
                    "1. Must belong to a notified minority community. "
                    "2. Age 14–45 years. "
                    "3. Open to all states across India."
                ),
                source="AI",
                recommendedAt=timestamp,
            ),
            SchemeResult(
                schemeId="GOI-MIN-002",
                schemeName="Nai Roshni — Leadership Development for Minority Women",
                benefitSummary=(
                    "Central scheme to empower women from minority communities through leadership training, awareness "
                    "of government schemes, and linkage to livelihood opportunities."
                ),
                eligibilityReason=(
                    "1. Must be a woman from a minority community (Muslim, Christian, Sikh, Buddhist, Jain, Parsi). "
                    "2. Age 18–65 years. "
                    "3. Available across India."
                ),
                source="AI",
                recommendedAt=timestamp,
            ),
            SchemeResult(
                schemeId="GOI-MIN-003",
                schemeName="Padho Pardesh — Overseas Scholarship for Minority Students",
                benefitSummary=(
                    "Central Government interest subsidy on educational loans for minority community students "
                    "pursuing approved courses at Masters, M.Phil, and PhD level abroad."
                ),
                eligibilityReason=(
                    "1. Must belong to a notified minority community. "
                    "2. Annual family income below ₹6 Lakh. "
                    "3. Must have obtained education loan from a scheduled bank."
                ),
                source="AI",
                recommendedAt=timestamp,
            ),
        ]

    if is_obc:
        CURATED += [
            SchemeResult(
                schemeId="GOI-OBC-001",
                schemeName="Post Matric Scholarship for OBC Students",
                benefitSummary=(
                    "Central Government scholarship for Other Backward Class students for post-matriculation studies. "
                    "Covers tuition fees and maintenance allowance."
                ),
                eligibilityReason=(
                    "1. Must belong to OBC category. "
                    "2. Annual family income below ₹1 Lakh. "
                    "3. Must be enrolled in a recognised institution."
                ),
                source="AI",
                recommendedAt=timestamp,
            ),
        ]

    if is_female:
        CURATED += [
            SchemeResult(
                schemeId="AP-W-001",
                schemeName="YSR Cheyutha — Women Entrepreneur Support (SC/ST/BC/Minority)",
                benefitSummary=(
                    "Andhra Pradesh scheme providing financial assistance of ₹18,750/year for 4 years to women "
                    "belonging to SC, ST, BC, or minority communities aged 45-60 years for self-employment."
                ),
                eligibilityReason=(
                    "1. Female applicant aged 45–60 years. "
                    "2. Must belong to SC, ST, BC, or minority community. "
                    "3. Must be a resident of Andhra Pradesh. "
                    "4. Annual family income below ₹1.5 Lakh."
                ),
                source="AI",
                recommendedAt=timestamp,
            ),
        ]

    # Fill up to 5 results using curated pool
    needed = max(0, 5 - len(results))
    if needed > 0 and CURATED:
        # Avoid duplicates by schemeId
        existing_ids = {r.schemeId for r in results}
        for fallback in CURATED:
            if fallback.schemeId not in existing_ids and needed > 0:
                results.append(fallback)
                existing_ids.add(fallback.schemeId)
                needed -= 1

    logger.info(f"/recommend: returned {len(results)} schemes for state={req.state!r} religion={religion!r} category={category!r}")
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
