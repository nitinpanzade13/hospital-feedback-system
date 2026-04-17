FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04

WORKDIR /app

# Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY ai_worker/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY ai_worker/worker.py .

# Create .env file (will be overridden by docker-compose)
RUN echo "BACKEND_URL=http://backend:8000" > .env

# Run worker
CMD ["python3", "worker.py"]
