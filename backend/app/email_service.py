
import smtplib
from email.message import EmailMessage

from app.config import settings


def send_email(to_email: str, subject: str, body: str) -> bool:
    """Send an email when SMTP is configured; otherwise skip safely."""
    if not all(
        [
            settings.SMTP_HOST,
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD,
            settings.SMTP_FROM_EMAIL,
        ]
    ):
        print("Email skipped: SMTP settings are not configured.")
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)
        return True
    except (smtplib.SMTPException, OSError) as exc:
        print(f"Email delivery failed: {exc}")
        return False

