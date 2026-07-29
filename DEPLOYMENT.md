# Novu Lab Employee Management System — Render Deployment Guide

This repository contains a full-stack **Employee Management System** comprising:
1. **Backend**: Django REST Framework API (`backend/novulab`)
2. **Frontend**: React + Vite + Tailwind CSS Single Page Application (`navulab-frontend`)

---

## Option 1: 1-Click Blueprint Deployment (Recommended)

Render supports Infrastructure as Code via `render.yaml`. This option deploys your **PostgreSQL Database**, **Django Backend Service**, and **React Frontend Static Site** automatically.

### Steps:
1. **Push your code to GitHub / GitLab**.
2. Log into your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** in the top right and select **Blueprints**.
4. Connect your GitHub/GitLab repository containing this project.
5. Render will detect `render.yaml` and display the blueprint plan (Database, Backend Web Service, Frontend Static Site).
6. Click **Apply**.
7. Render will provision:
   - PostgreSQL Database (`novulab-db`)
   - Web Service (`novulab-backend`)
   - Static Site (`novulab-frontend`)
8. Once the build finishes, open the Shell tab on `novulab-backend` and run:
   ```bash
   python manage.py createsuperuser
   ```
   Follow the prompts to create your initial admin account.

---

## Option 2: Manual Deployment via Render Dashboard

If you prefer to configure each service manually:

### 1. Create PostgreSQL Database
1. Go to **New +** → **PostgreSQL**.
2. Name: `novulab-db`
3. Database Name: `novulab`
4. User: `novulab_user`
5. Click **Create Database**.
6. Copy the **Internal Database URL** once created.

---

### 2. Deploy Backend Web Service (Django)
1. Go to **New +** → **Web Service**.
2. Connect your repository.
3. Configure the following fields:
   - **Name**: `novulab-backend`
   - **Environment**: `Python 3`
   - **Build Command**:
     ```bash
     cd backend/novulab && pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate
     ```
   - **Start Command**:
     ```bash
     cd backend/novulab && gunicorn config.wsgi:application
     ```
4. **Environment Variables**:
   - `DEBUG`: `False`
   - `SECRET_KEY`: *(Click Generate or paste a secure key)*
   - `DATABASE_URL`: *(Paste your Internal Database URL from Step 1)*
   - `ALLOWED_HOSTS`: `.onrender.com`
   - `CORS_ALLOWED_ORIGINS`: `https://<your-frontend-name>.onrender.com`
5. Click **Create Web Service**.
6. Note down the deployed Backend URL (e.g., `https://novulab-backend.onrender.com`).

---

### 3. Deploy Frontend Static Site (React Vite)
1. Go to **New +** → **Static Site**.
2. Connect your repository.
3. Configure the following fields:
   - **Name**: `novulab-frontend`
   - **Build Command**:
     ```bash
     cd navulab-frontend && npm install && npm run build
     ```
   - **Publish Directory**: `navulab-frontend/dist`
4. **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://novulab-backend.onrender.com` *(Use your actual backend URL)*
5. Under **Redirects / Rewrites**:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`
6. Click **Create Static Site**.

---

## Verification & Post-Deployment Checklist

- [x] Backend responds at `https://<backend-app>.onrender.com/admin/`
- [x] CORS allowed origins match frontend domain
- [x] React SPA client routing reloads properly on any page
- [x] Superuser account created via Render Web Shell or `python manage.py createsuperuser`
