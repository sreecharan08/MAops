from django.db import models
from django.contrib.auth.models import User


class Submission(models.Model):

    STATUS_CHOICES = [
        ("SUBMITTED", "Submitted"),
        ("PROCESSING", "Processing"),
        ("UNDER_REVIEW", "Under Review"),
        ("GRADED", "Graded"),
        ("REJECTED", "Rejected"),
    ]

    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="submissions"
    )

    subject = models.CharField(max_length=150)

    assignment_title = models.CharField(max_length=255)

    file = models.FileField(
        upload_to="submissions/%Y/%m/"
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

    def __str__(self):
        return f"{self.student.username} - {self.assignment_title}"

    class Meta:
        ordering = ["-uploaded_at"]