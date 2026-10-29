# WorkSphere HRMS

A Human Resource Management System built with **React, FastAPI, SQLAlchemy, and SQLite** to simplify employee management and everyday HR operations.

## Features

### 1. Authentication & Role Management
- JWT-based authentication
- Role-based access for Employee, HR, and Admin
- Protected API endpoints
- User account activation and deactivation

### 2. Employee Management
- Employee profile and information management
- Department, designation, joining date, salary, and employment status
- Employee search and filtering
- Employee records management

### 3. Attendance Management
- Employee check-in and check-out
- Attendance history and working-hours calculation
- Attendance status tracking
- Late attendance alerts
- Overtime tracking

### 4. Shift Management
- Employee shift management
- Shift scheduling and shift information

### 5. Leave Management
- Submit leave applications
- View leave history and request status
- HR/Admin leave approval and rejection
- Leave calendar and team availability

### 6. Document Management
- Upload and manage employee documents
- Assign documents to employees
- Search and view available documents
- Employee-specific document access

### 7. Performance Management
- Employee performance reviews
- Performance ratings and feedback
- Review history and performance tracking

### 8. Payroll Management
- Generate and view payroll records
- Salary, deductions, bonuses, and net pay

### 9. Dashboard & Analytics
- Employee statistics
- Attendance summaries
- Leave statistics
- Payroll overview
- Analytics and reports

### 10. Notifications
- View notifications and HR activity updates
- Late attendance notifications
- Refresh notifications and manage read status
- Notification preferences for announcements, leave, payroll, and attendance

### 11. Admin User Management
- View and manage user accounts
- Assign and update user roles
- Activate or deactivate user accounts
- Delete user accounts, subject to application permissions

### 12. Profile & Settings
- View personal account information
- View employment information
- Update username and email address
- Change password with current-password verification
- Manage notification preferences

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
├── Phase 1-3 Screenshots/
├── Phase 4 Screenshots/
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

Create `backend/.env` using the variables in `backend/.env.example`. Replace placeholder secrets with strong, private values. Never commit your real `.env` file.

Start the backend:

```bash
uvicorn app.main:app --reload
```

- **Backend:** http://127.0.0.1:8000
- **API Documentation:** http://127.0.0.1:8000/docs

### Frontend Setup

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite, usually http://localhost:5173.

## Screenshots

Screenshots are organized into the following folders:

- **Phase 1-3 Screenshots:** Screenshots documenting core HRMS functionality and features implemented during Phases 1, 2, and 3.
- **Phase 4 Screenshots:** Screenshots documenting the relevant Phase 4 modules, including Profile & Settings and notification preferences.

## Security

- Keep secret keys and credentials private.
- Never commit `.env` files.
- Use `.env.example` to document required environment variables without exposing real credentials.
- Exclude local databases, virtual environments, and installed frontend dependencies from version control.
- Enforce authentication, role-based access, and authorization checks for protected operations.
- Share sensitive employee documents only through authorized channels.

## Project Status

WorkSphere HRMS is developed in phases, with features added incrementally. Refer to the corresponding screenshot folders and API documentation to review the implementation.
