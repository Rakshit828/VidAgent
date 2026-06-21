FROM python:3.12-slim-trixie

COPY --from=ghcr.io/astral-sh/uv:0.10.3 /uv /uvx /bin/

WORKDIR /contenerization

ENV UV_CACHE_DIR=/root/.cache/uv

# Important: expose venv
ENV PATH="/contenerization/.venv/bin:$PATH"

COPY uv.lock pyproject.toml ./

RUN uv sync --locked

COPY . .