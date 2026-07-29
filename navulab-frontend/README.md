# Novu Lab — Ops Console (Frontend)

React + Tailwind dashboard that talks to all 9 backend microservices through
the API Gateway on `http://127.0.0.1:8080`.

## Before you start

All 9 backend services **and** the API gateway must already be running
(auth :8001, employee :8002, attendance :8003, leave :8004, payroll :8005,
notification :8006, task :8007, report :8008, chat :8009, gateway :8080).

## Setup

```powershell
cd navulab-frontend
npm install
npm run dev
```

Then open **http://localhost:5173**

## Login

Use the username/password of an account created in auth-service
(e.g. the superuser you made with `createsuperuser`, or an employee HR created).

## What each role sees

- **Employee** — Overview, Tasks (own), Attendance (own), Reports (submit own), Chat
- **Team Lead** — same as Employee, plus can assign tasks and review reports for their department
- **CEO / HR** — everything above, all departments, plus Employees page (create accounts)
- **Finance** — Payroll page (all payslips) + generate payslips; HR also has this

## Notes

- Payroll is locked down on the backend itself — even if a non-Finance/HR user
  somehow reaches `/payroll`, the API only ever returns their own payslip.
- Task/Report/Attendance forms currently ask for raw numeric IDs (assigned_to_id,
  department_id) since there's no cross-service employee picker yet — check the
  Employees page for IDs, or extend `Employees.jsx`/`Tasks.jsx` to fetch and
  populate a dropdown instead of a free-text ID field.
