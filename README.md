# WorkSphere HRMS

A Human Resource Management System built with **React, FastAPI, SQLAlchemy, and SQLite** to simplify employee management and everyday HR operations.

## Features

### 1. Authentication & Role Management
- JWT-based authentication
- Role-based access for Employee, HR, and Admin
- Protected API endpoints

### 2. Employee Management
- Employee profile and information management
- Department, designation, joining date, and employment status

### 3. Attendance Management
- Employee check-in and check-out
- Attendance history
- Working hours and attendance status

### 4. Leave Management
- Submit leave applications
- View leave history and request status
- HR/Admin leave approval and rejection

### 5. Payroll Management
- Generate and view payroll records
- Salary, deductions, bonuses, and net pay

### 6. Dashboard & Analytics
- Employee statistics
- Attendance summaries
- Leave statistics
- Payroll overview

### 7. Notifications
- View notifications and HR activity updates

### 8. Admin User Management
- View and manage user accounts
- Activate or deactivate user accounts
- Delete user accounts, subject to application permissions

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, JavaScript, Vite, CSS |
| Backend | Python, FastAPI |
| ORM | SQLAlchemy |
| Database | SQLite |
| Validation | Pydantic |
| Authentication | JWT |

## Project Structure

```text
WorkSphere/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   └── index.html
├── Phase 1 Screenshots/
├── Phase 2 Screenshots/
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.10 or newer
- Node.js and npm

### Backend Setup

From the project root, run:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` using the variables in `backend/.env.example`. Replace the placeholder `SECRET_KEY` with a strong, private value. Never upload your real `.env` file.

Start the backend:

```bash
uvicorn app.main:app --reload
```

- **Backend:** http://127.0.0.1:8000
- **API documentation:** http://127.0.0.1:8000/docs

### Frontend Setup

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite, usually http://localhost:5173.

## Screenshots

Refer to the `Phase 1 Screenshots/` and `Phase 2 Screenshots/` folders for application screenshots and development evidence.

## Security

- Keep secret keys and credentials private.
- Do not commit `.env` files.
- Use `.env.example` to document required environment variables without exposing real credentials.
- Exclude local databases, virtual environments, and installed frontend dependencies from version control.

