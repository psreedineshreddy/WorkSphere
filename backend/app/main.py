from contextlib import asynccontextmanager
from datetime import datetime
from zoneinfo import ZoneInfo
from datetime import datetime, timedelta
from app.models.shift import Shift, EmployeeShift

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
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
from app.routers.leave_policy import router as leave_policy_router
from app.routers.payroll import router as payroll_router
from app.routers.dashboard import router as dashboard_router
from app.routers.notification import router as notification_router
from app.routers.admin import router as admin_router
from app.routers.shifts import router as shifts_router
from app.routers.documents import router as documents_router
from app.routers.performance import router as performance_router

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
        now = datetime.now(IST)
        today = now.date()

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

            assignment = db.query(EmployeeShift).filter(
                EmployeeShift.employee_id == employee.id
            ).first()

            if assignment:
                shift = db.query(Shift).filter(
                    Shift.id == assignment.shift_id
                ).first()

                if shift:
                    shift_end = shift.end_time

                    # Handle overnight shifts, such as 10 PM to 6 AM.
                    if shift.end_time <= shift.start_time:
                        shift_end_date = datetime.combine(
                            today + timedelta(days=1),
                            shift_end,
                            tzinfo=IST,
                        )
                    else:
                        shift_end_date = datetime.combine(
                            today,
                            shift_end,
                            tzinfo=IST,
                        )

                    # Allow a 30-minute grace period after shift end.
                    if now < shift_end_date + timedelta(minutes=30):
                        continue
                else:
                    # Avoid marking absent if the assignment is invalid.
                    continue
            else:
                # Default shift ends at 6 PM.
                default_end = datetime.combine(
                    today,
                    datetime.strptime("18:00", "%H:%M").time(),
                    tzinfo=IST,
                )

                if now < default_end + timedelta(minutes=30):
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
app.include_router(shifts_router)
app.include_router(documents_router)
app.include_router(performance_router)

@app.get("/")
def root():
    return {"message": "Welcome to WorkSphere HRMS API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
