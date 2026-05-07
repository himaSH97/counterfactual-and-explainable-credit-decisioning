# =============================================================================
# Dockerfile for Explainable AI Loan Approval API
# =============================================================================
# Multi-stage build for optimized production image.
#
# Build: docker build -t loan-approval-api .
# Run:   docker run -p 8000:8000 loan-approval-api
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt


# -----------------------------------------------------------------------------
# Stage 2: Production
# -----------------------------------------------------------------------------
FROM python:3.11-slim as production

# Labels for container metadata
LABEL maintainer="ML Engineering Team" \
      description="Explainable AI Loan Approval API" \
      version="1.0.0"

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Application settings
    APP_HOME=/app \
    PORT=8000 \
    # Model path (can be overridden at runtime)
    MODEL_PATH=/app/models/xgb_pipeline.pkl

# Create non-root user for security
RUN groupadd --gid 1000 appgroup && \
    useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

# Set working directory
WORKDIR ${APP_HOME}

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY --chown=appuser:appgroup app/ ${APP_HOME}/app/
COPY --chown=appuser:appgroup models/ ${APP_HOME}/models/
COPY --chown=appuser:appgroup training_data.csv ${APP_HOME}/training_data.csv

# Create logs directory
RUN mkdir -p ${APP_HOME}/logs && \
    chown -R appuser:appgroup ${APP_HOME}

# Switch to non-root user
USER appuser

# Expose port
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/')" || exit 1

# Run the application
# Using shell form to allow PORT environment variable substitution
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1


# -----------------------------------------------------------------------------
# Stage 3: Development (optional, for local development)
# -----------------------------------------------------------------------------
FROM production as development

# Switch back to root for installing dev dependencies
USER root

# Install development tools
RUN pip install \
    pytest \
    pytest-asyncio \
    httpx \
    black \
    isort \
    mypy

# Switch back to non-root user
USER appuser

# Override command for development with auto-reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
