FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for audio decoding
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
COPY run_service.py .

EXPOSE 8000

ENV SPEECH_HOST=0.0.0.0
ENV SPEECH_PORT=8000
ENV PYTHONUNBUFFERED=1

CMD ["python", "run_service.py"]
