# Frontend build stage
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Backend runtime stage — layout mirrors local dev: backend/ and frontend/dist
# as siblings, since settings.py resolves FRONTEND_DIST as BASE_DIR.parent/frontend/dist.
FROM python:3.13-slim AS backend
WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# collectstatic needs SECRET_KEY/DEBUG resolvable but doesn't touch the DB —
# these placeholders are baked into the image only for this build step;
# docker-compose's real runtime env vars override them when the container starts.
ENV DEBUG=True
ENV SECRET_KEY=build-time-placeholder-not-used-at-runtime
RUN python manage.py collectstatic --no-input

EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
