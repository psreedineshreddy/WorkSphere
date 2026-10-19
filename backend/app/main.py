
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import User, Employee, Attendance, Leave, Payroll
from app.routers.auth import router as auth_router
from app.routers.employee import router as employee_router
from app.routers.attendance import router as attendance_router
from app.routers.leave import router as leave_router
from app.routers.payroll import router as payroll_router
from app.routers.dashboard import router as dashboard_router
from app.routers.notification import router as notification_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WorkSphere HRMS",
    description="Human Resource Management System API",
    version="1.0.0",
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


@app.get("/")
def root():
    return {"message": "Welcome to WorkSphere HRMS API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
