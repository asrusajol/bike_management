from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.reminder_tasks.check_and_send_reminders")
def check_and_send_reminders():
    """Check all active reminders daily and dispatch email notifications for due ones."""
    # TODO Phase 3: query active reminders, compare trigger_date/trigger_km
    # against today/current odometer, call send_reminder_email for each due reminder
    pass


@celery_app.task(name="app.tasks.reminder_tasks.send_reminder_email")
def send_reminder_email(user_email: str, bike_name: str, reminder_title: str):
    """Send a reminder notification email via SMTP."""
    # TODO Phase 3: render HTML email template and send via smtplib
    pass
