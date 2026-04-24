FROM python:3.11-slim

WORKDIR /app

# Install system deps for torch + sentence-transformers
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (layer-cached)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy wrapper source
COPY main.py engine.py db.py ./

# SCHEME_SAATHI_PATH and DB_PATH are injected via docker-compose volumes + env
# The Scheme Saathi directory is mounted as a read-only volume at runtime

EXPOSE 8000

# Start with single worker (SentenceTransformer is not fork-safe with multiple workers)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
