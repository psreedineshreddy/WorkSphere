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
- Employee search and advanced filtering by status, role, attendance, and performance rating

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
- Leave calendar and team availability view

### 6. Document Management
- Upload and manage employee documents
- Select employees for document assignment
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
- Advanced analytics and reports

### 10. Notifications
- View notifications and HR activity updates
- Late attendance notifications
- Refresh notifications and manage read status

### 11. Admin User Management
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
├── Phase 3 Screenshots/
├── .gitignore
└── README.md
```

*The structure above highlights the main project files and screenshot folders. Additional files may exist in the actual project.*

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

The project includes screenshots and development evidence for the following phases:

- **Phase 1:** Core HRMS functionality, including authentication, employee management, attendance, and other core features.
- **Phase 2:** Refer to the Phase 2 Screenshots folder for the relevant implementation evidence.
- **Phase 3 :** Shift management, leave calendar, document management, performance reviews, analytics and reports, late attendance alerts, and employee advanced filters.

Screenshots are stored in the corresponding phase folders.

## Security

- Keep secret keys and credentials private.
- Do not commit `.env` files.
- Use `.env.example` to document required environment variables without exposing real credentials.
- Exclude local databases, virtual environments, and installed frontend dependencies from version control.
- Enforce role-based access and appropriate authorization checks for protected operations.

## Project Status

WorkSphere HRMS is being developed in phases, with features added incrementally. Refer to the corresponding screenshot folders and API documentation to review the implemented functionality.
