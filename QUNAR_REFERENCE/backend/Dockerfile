# QUNAR Backend Dockerfile
# Multi-stage build for production

# Build stage
FROM python:3.11-slim as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim as production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash qunar

# Set work directory
WORKDIR /app

# Copy Python dependencies from builder stage
COPY --from=builder /root/.local /home/qunar/.local

# Copy application code
COPY . .

# Change ownership to qunar user
RUN chown -R qunar:qunar /app

# Switch to non-root user
USER qunar

# Add .local to PATH
ENV PATH=/home/qunar/.local/bin:$PATH

# Environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Run application with gunicorn
CMD ["gunicorn", "app.main:app", "-c", "gunicorn.conf.py"]
