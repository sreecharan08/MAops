from django.db import models
from django.contrib.auth.models import User


class StudentProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="student_profile"
    )

    roll_number = models.CharField(max_length=30, unique=True)
    department = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    section = models.CharField(max_length=20)

    def __str__(self):
        return self.roll_number