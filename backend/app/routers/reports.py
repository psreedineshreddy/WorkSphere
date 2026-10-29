
import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet

from app.database import get_db
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.leave import Leave
from app.models.performance import PerformanceReview
from app.models.user import User
from app.routers.auth import require_roles


router = APIRouter(prefix="/api/reports", tags=["Reports"])


def build_report(db, start_date, end_date, department):
    employee_query = db.query(Employee)

    if department:
        employee_query = employee_query.filter(
            Employee.department == department
        )

    department_rows = (
        employee_query.with_entities(
            Employee.department,
            func.count(Employee.id).label("count"),
        )
        .group_by(Employee.department)
        .all()
    )

    attendance_query = db.query(
        Attendance.status,
        func.count(Attendance.id).label("count"),
    ).join(Employee, Attendance.employee_id == Employee.id)

    leave_query = db.query(
        Leave.status,
        func.count(Leave.id).label("count"),
    ).join(Employee, Leave.employee_id == Employee.id)

    if department:
        attendance_query = attendance_query.filter(
            Employee.department == department
        )
        leave_query = leave_query.filter(
            Employee.department == department
        )

    if start_date:
        attendance_query = attendance_query.filter(
            Attendance.date >= start_date
        )
        leave_query = leave_query.filter(
            Leave.start_date >= start_date
        )

    if end_date:
        attendance_query = attendance_query.filter(
            Attendance.date <= end_date
        )
        leave_query = leave_query.filter(
            Leave.start_date <= end_date
        )

    attendance_rows = attendance_query.group_by(
        Attendance.status
    ).all()

    leave_rows = leave_query.group_by(Leave.status).all()

    performance_query = db.query(PerformanceReview)

    if department:
        performance_query = performance_query.join(
            Employee,
            PerformanceReview.employee_id == Employee.id,
        ).filter(Employee.department == department)

    if start_date:
        performance_query = performance_query.filter(
            PerformanceReview.created_at >= start_date
        )

    if end_date:
        performance_query = performance_query.filter(
            PerformanceReview.created_at < end_date
        )

    performance_count = performance_query.count()
    average_rating = performance_query.with_entities(
        func.avg(PerformanceReview.rating)
    ).scalar() or 0

    return {
        "departments": [
            (row.department or "Unassigned", row.count)
            for row in department_rows
        ],
        "attendance": [
            (row.status, row.count)
            for row in attendance_rows
        ],
        "leaves": [
            (row.status, row.count)
            for row in leave_rows
        ],
        "performance_count": performance_count,
        "average_rating": round(float(average_rating), 2),
    }


@router.get("/analytics.csv")
def export_analytics_csv(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    department: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date cannot be after end date",
        )

    data = build_report(db, start_date, end_date, department)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Report Section", "Name / Status", "Count", "Metric"])

    for name, count in data["departments"]:
        writer.writerow(["Employees by Department", name, count, ""])

    for name, count in data["attendance"]:
        writer.writerow(["Attendance", name, count, ""])

    for name, count in data["leaves"]:
        writer.writerow(["Leave Requests", name, count, ""])

    writer.writerow([
        "Performance",
        "Total Reviews",
        data["performance_count"],
        "",
    ])
    writer.writerow([
        "Performance",
        "Average Rating",
        "",
        f'{data["average_rating"]} / 5',
    ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=analytics_report.csv"
        },
    )


@router.get("/analytics.pdf")
def export_analytics_pdf(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    department: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR", "ADMIN")),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date cannot be after end date",
        )

    data = build_report(db, start_date, end_date, department)

    output = io.BytesIO()
    document = SimpleDocTemplate(output, pagesize=landscape(A4))
    styles = getSampleStyleSheet()

    elements = [
        Paragraph("WorkSphere Analytics Report", styles["Title"]),
        Spacer(1, 12),
        Paragraph(
            f"Period: {start_date or 'All dates'} to "
            f"{end_date or 'All dates'}",
            styles["Normal"],
        ),
        Paragraph(
            f"Department: {department or 'All departments'}",
            styles["Normal"],
        ),
        Spacer(1, 16),
    ]

    sections = [
        ("Employees by Department", data["departments"]),
        ("Attendance", data["attendance"]),
        ("Leave Requests", data["leaves"]),
        (
            "Performance",
            [
                ("Total Reviews", data["performance_count"]),
                ("Average Rating", f'{data["average_rating"]} / 5'),
            ],
        ),
    ]

    for title, rows in sections:
        elements.append(Paragraph(title, styles["Heading2"]))

        table_data = [["Name / Status", "Count"]]
        table_data.extend([
            [str(name), str(count)]
            for name, count in rows
        ])

        table = Table(table_data, repeatRows=1)
        table.setStyle(TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#243B53"),
            ),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("PADDING", (0, 0), (-1, -1), 7),
        ]))

        elements.extend([table, Spacer(1, 12)])

    document.build(elements)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=analytics_report.pdf"
        },
    )
