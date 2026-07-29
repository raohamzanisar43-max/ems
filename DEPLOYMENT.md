# Novu Lab Employee Management System — Unified Single-Link Deployment Guide

This repository is configured as a **unified single-service application**. Your entire application (React Frontend + Django REST API + Admin) runs on **ONE single URL / link**!

---

## Single Web Service Deployment Instructions

### **Build Command**:
```bash
cd navulab-frontend && npm install && npm run build && cd ../backend/novulab && pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate
```

### **Start Command**:
```bash
cd backend/novulab && gunicorn config.wsgi:application
```

---

## Render Configuration

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Select your existing Web Service (`ems-qs4i` or create a new Web Service).
3. Under **Settings**:
   - **Root Directory**: Leave **BLANK**
   - **Build Command**:
     ```bash
     cd navulab-frontend && npm install && npm run build && cd ../backend/novulab && pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate
     ```
   - **Start Command**:
     ```bash
     cd backend/novulab && gunicorn config.wsgi:application
     ```

4. Under **Environment Variables**:
   - `DEBUG` = `False`
   - `SECRET_KEY` = *(Click Generate or enter a secret key)*
   - `ALLOWED_HOSTS` = `.onrender.com`

5. Click **Save Changes** and **Deploy latest commit**!

---

## 🎯 What You Get (One Single URL):

Once deployed, your single URL (e.g. `https://ems-qs4i.onrender.com`) will serve:
* 💻 **React Frontend UI**: `https://ems-qs4i.onrender.com/` (all pages `/login`, `/tasks`, `/attendance`, `/employees`, etc.)
* 🛡️ **Django Admin Portal**: `https://ems-qs4i.onrender.com/admin/`
* ⚡ **REST API Endpoints**: `https://ems-qs4i.onrender.com/api/...`
* 🩺 **Health Check**: `https://ems-qs4i.onrender.com/health/`

Default Admin Login:
- **Username**: `admin`
- **Password**: `admin12345`
