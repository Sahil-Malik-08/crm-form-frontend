# Company Dashboard

A full-stack company management dashboard built with **React.js** (frontend) and **Node.js + Express** (backend).

## Features

- Dashboard overview with business statistics
- Employee management (CRUD)
- Customer management (CRUD)
- Inventory/Item management (CRUD)
- Order management with status updates (CRUD)
- Profile management

## Tech Stack

- **Frontend**: React.js, Vite
- **Backend**: Node.js, Express
- **Database**: MySQL (via mysql2)

## Run locally

Open two terminals:

```powershell
cd backend
npm.cmd start
```

```powershell
cd frontend
npm.cmd run dev
```

Then open the Vite address, normally `http://localhost:5173`.

The backend is connected to the local MySQL `company_dashboard` database (the same one visible in phpMyAdmin). Changes made through the dashboard are stored permanently in that database.

