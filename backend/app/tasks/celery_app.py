from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "bike_maintenance",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.reminder_tasks"],
)

celery_app.conf.beat_schedule = {
    "check-reminders-daily": {
        "task": "app.tasks.reminder_tasks.check_and_send_reminders",
        "schedule": 86400.0,
    },
}
celery_app.conf.timezone = "UTC"
