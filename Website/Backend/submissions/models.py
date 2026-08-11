from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.db import models
from django.contrib.auth.models import User

# PHASE 2 FIX: uploaded files must never land in MEDIA_ROOT, since that's
# served publicly at /media/ (see config/urls.py). This is a separate
# storage location that has no URL route pointing at it -- nothing can
# fetch these files back out over HTTP.
quarantine_storage = FileSystemStorage(location=str(settings.QUARANTINE_ROOT))


class Submission(models.Model):

    STATUS_CHOICES = [
        ("SUBMITTED", "Submitted"),
        ("PROCESSING", "Processing"),
        ("UNDER_REVIEW", "Under Review"),
        ("GRADED", "Graded"),
        ("REJECTED", "Rejected"),
    ]

    # Internal verdict -- NOT shown to the student, only on the SOC dashboard.
    # STATUS_CHOICES above stays as the student-facing "assignment portal"
    # cover story; this is the real security verdict underneath it.
    VERDICT_CHOICES = [
        ("PENDING", "Pending analysis"),
        ("CLEAN", "Clean"),
        ("SUSPICIOUS", "Suspicious"),
        ("MALICIOUS", "Malicious"),
    ]

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="submissions"
    )

    subject = models.CharField(max_length=150)

    assignment_title = models.CharField(max_length=255)

    file = models.FileField(
        upload_to="submissions/%Y/%m/",
        storage=quarantine_storage,
    )

    comments = models.TextField(
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="SUBMITTED"
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    file_size = models.BigIntegerField(
        default=0
    )

    file_hash = models.CharField(
        max_length=64,
        blank=True
    )

    # --- Phase 2 additions ---

    verdict = models.CharField(
        max_length=20,
        choices=VERDICT_CHOICES,
        default="PENDING",
    )

    risk_score = models.IntegerField(
        default=0,
        help_text="Aggregate score from static analysis (YARA severity sum)",
    )

    static_report = models.JSONField(
        default=dict,
        blank=True,
        help_text="Full structured output from the static analysis scanner",
    )

    is_flagged = models.BooleanField(
        default=False,
        help_text="True if this case needs analyst review or sandbox escalation",
    )

    analyzed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return f"{self.student.username} - {self.assignment_title}"

    class Meta:
        ordering = ["-uploaded_at"]