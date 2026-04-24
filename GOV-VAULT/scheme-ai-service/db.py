"""
db.py — Read-only SQLite helper for scheme detail enrichment.

Opens with: uri=True, mode=ro, check_same_thread=False
No writes, no locks, safe under FastAPI concurrency.
"""

import sqlite3
import os
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

# DB_PATH can be overridden via env (e.g., Docker volume mount)
DB_PATH = os.getenv("DB_PATH", r"D:\capstone\Scheme_Saathi\new_schemes.db")


def fetch_scheme_details(scheme_id: str, db_path: str = DB_PATH) -> Optional[Dict[str, str]]:
    """
    Fetch scheme details from SQLite in read-only mode.

    Uses URI mode to enforce read-only — prevents any accidental writes
    and avoids locking under concurrent FastAPI requests.
    """
    try:
        conn = sqlite3.connect(
            f"file:{db_path}?mode=ro",
            uri=True,
            check_same_thread=False,
        )
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT scheme_name, detailed_description, eligibility_criteria,
                   application_process, documents_required
            FROM schemes
            WHERE scheme_id = ?
            """,
            (scheme_id,),
        )
        row = cursor.fetchone()
        conn.close()

        if row:
            return {
                "scheme_name":          row[0] or "Not available",
                "detailed_description": row[1] or "Not available",
                "eligibility_criteria": row[2] or "Not available",
                "application_process":  row[3] or "Not available",
                "documents_required":   row[4] or "Not available",
            }
        logger.warning(f"db: no record found for scheme_id={scheme_id!r}")
        return None

    except sqlite3.OperationalError as e:
        # Read-only failures are loud — don't swallow them silently
        logger.error(f"db: SQLite error for scheme_id={scheme_id!r}: {e}")
        return None
