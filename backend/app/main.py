from contextlib import asynccontextmanager
from datetime import datetime
from zoneinfo import ZoneInfo


from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from app.routers.leave_policy import router as leave_policy_router
from app.database import Base, engine, SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from app.models import (
    User,
    Employee,
    Attendance,
    Leave,
    Payroll,
    LeavePolicy,
    LeaveBalance,
)
from app.routers.auth import router as auth_router
from app.routers.employee import router as employee_router
from app.routers.attendance import router as attendance_router
from app.routers.leave import router as leave_router
from app.routers.payroll import router as payroll_router
from app.routers.dashboard import router as dashboard_router
from app.routers.notification import router as notification_router
from app.routers.admin import router as admin_router

Base.metadata.create_all(bind=engine)

IST = ZoneInfo("Asia/Kolkata")
scheduler = BackgroundScheduler(timezone=IST)

def initialize_leave_policies():
    db = SessionLocal()
    default_policies = {
        "SICK": 10,
        "CASUAL": 12,
        "PAID": 15,
    }

    try:
        for leave_type, total_days in default_policies.items():
            policy = db.query(LeavePolicy).filter(
                LeavePolicy.leave_type == leave_type
            ).first()

            if not policy:
                policy = LeavePolicy(
                    leave_type=leave_type,
                    total_days_allowed=total_days,
                )
                db.add(policy)
                db.flush()

            employees = db.query(Employee).filter(
                Employee.status == "ACTIVE"
            ).all()

            for employee in employees:
                balance = db.query(LeaveBalance).filter(
                    LeaveBalance.employee_id == employee.id,
                    LeaveBalance.leave_type == leave_type,
                ).first()

                if not balance:
                    db.add(
                        LeaveBalance(
                            employee_id=employee.id,
                            leave_type=leave_type,
                            remaining_days=policy.total_days_allowed,
                        )
                    )

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def mark_absent_employees():
    db = SessionLocal()
    try:
        today = datetime.now(IST).date()

        employees = db.query(Employee).filter(
            Employee.status == "ACTIVE"
        ).all()

        for employee in employees:
            attendance = db.query(Attendance).filter(
                Attendance.employee_id == employee.id,
                Attendance.date == today,
            ).first()

            if attendance:
                continue

            approved_leave = db.query(Leave).filter(
                Leave.employee_id == employee.id,
                Leave.status == "APPROVED",
                Leave.start_date <= today,
                Leave.end_date >= today,
            ).first()

            if approved_leave:
                continue

            db.add(
                Attendance(
                    employee_id=employee.id,
                    date=today,
                    status="ABSENT",
                    is_late=False,
                    overtime_hours=0,
                )
            )

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        mark_absent_employees,
        trigger="cron",
        hour=23,
        minute=59,
        id="daily_absent_marking",
        replace_existing=True,
    )
    scheduler.start()
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)


app = FastAPI(
    title="WorkSphere HRMS",
    description="Human Resource Management System API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(employee_router)
app.include_router(attendance_router)
app.include_router(leave_router)
app.include_router(payroll_router)
app.include_router(dashboard_router)
app.include_router(notification_router)
app.include_router(leave_policy_router)
app.include_router(admin_router)

@app.get("/")
def root():
    return {"message": "Welcome to WorkSphere HRMS API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
