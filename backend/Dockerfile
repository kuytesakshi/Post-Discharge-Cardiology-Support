FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    BACKEND_PORT=8000

WORKDIR /app

RUN adduser --disabled-password --gecos "" appuser

COPY --chown=appuser:appuser requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${BACKEND_PORT}"]
