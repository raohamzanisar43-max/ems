# Novu Lab — Employee Management System (Backend)

Single Django REST Framework project (`novulab/`) — one process, one port
(`8080`), one database. Originally built as 9 separate microservices; those
have been consolidated into one project for simplicity and are kept (unused)
under `_archived_microservices/` in case anything needs to be recovered.

## Folder structure

```
novulab/
├── manage.py
├── config/              # project-wide settings, root urls.py, wsgi/asgi — nothing else goes here
│   ├── settings.py
│   └── urls.py
└── apps/                # every domain app lives here, one folder per feature
    ├── users/           # login/JWT, accounts, roles, departments
    ├── employees/
    ├── attendance/
    ├── leaves/
    ├── payroll/
    ├── notifications/
    ├── tasks/
    ├── reports/
    ├── chat/
    └── common/          # shared permission/queryset mixins used by more than one app
```

Each app under `apps/` follows the standard Django layout:
`models.py`, `serializers.py`, `views.py`, `urls.py`, `admin.py`, and — where
the app needs one — `permissions.py`. If you're looking for where a feature
lives, it's always `apps/<feature>/`.

## Apps

| App              | Responsibility |
|------------------|-----------------|
| users            | Login (JWT), employee account creation + email credentials, roles, departments |
| employees        | Extended employee profile (designation, skills, joining date) |
| attendance       | Check-in/out, daily attendance, department-scoped |
| leaves           | Leave requests/approvals |
| payroll          | Payslips — **Finance/HR only** see all; everyone else sees only their own |
| notifications    | In-app notifications |
| tasks            | Tasks: pending/started/completed, assigned per employee, department-scoped |
| reports          | Daily report submission + Team Lead/CEO review |
| chat             | Task-linked conversations between employee and team lead/CEO |

## Roles (`users.models.User.Role`)

- **CEO / CTO** — see all departments' work/attendance/reports (read access everywhere)
- **HR** — same visibility as CEO/CTO + creates employee accounts (emails username/password), can delete employees
- **TEAM_LEAD** — sees + manages only their own department's employees, tasks, attendance, reports
- **FINANCE** — payroll access alongside HR
- **EMPLOYEE** — sees only their own attendance, tasks, reports, and payslip; submits daily reports; chats with their team lead/CEO about a task

## How permission scoping works

Every viewset filters its queryset the same way:
```python
if user.can_see_all_departments:      # CEO, CTO, or HR
    qs = Model.objects.all()
elif user.is_team_lead:
    qs = Model.objects.filter(department_id=user.department_id)
else:
    qs = Model.objects.filter(employee_id=user.id)   # or assigned_to_id / owner
```
Payroll is the one exception: **even CEO/Team Lead cannot see others' pay** —
only Finance, HR, and the employee themself.

## Employee onboarding flow

1. HR/Admin (only — CEO/CTO/Team Lead cannot create accounts) calls
   `POST /api/auth/employees/` with username, email, department, role, and a
   password they set themselves.
2. The account is created and `send_credentials_email()` emails the employee
   their username + password.
3. Employee logs in via `POST /api/auth/token/` → gets a JWT with `role` and
   `department_id` baked in → uses that JWT against every endpoint.

## Getting started

```bash
cd novulab
pip install -r requirements.txt
cp .env.example .env      # then set a real SECRET_KEY
python manage.py migrate
python manage.py runserver 8080
```

Or from `backend/`, just run `run-all.ps1` (see `stop-all.ps1` to stop).

## Important before running

- Fill real SMTP credentials in `novulab/.env` (`EMAIL_HOST_USER`,
  `EMAIL_HOST_PASSWORD`) so onboarding/reset emails actually send — until then,
  emails print to the console/log instead (see `EMAIL_BACKEND` logic in `settings.py`).
