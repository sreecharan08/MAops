from rest_framework import serializers
from .models import Submission


class SubmissionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Submission

        fields = [
            "id",
            "subject",
            "assignment_title",
            "file",
            "comments",
            "status",
            "uploaded_at",
            "file_size",
            "file_hash",
        ]

        read_only_fields = [
            "id",
            "status",
            "uploaded_at",
            "file_size",
            "file_hash",
        ]

    def validate_file(self, file):

        max_size = 25 * 1024 * 1024

        if file.size > max_size:
            raise serializers.ValidationError(
                "File size cannot exceed 25 MB."
            )

        allowed_extensions = [
            ".pdf",
            ".doc",
            ".docx",
            ".ppt",
            ".pptx",
            ".zip",
        ]

        file_name = file.name.lower()

        if not any(
            file_name.endswith(ext)
            for ext in allowed_extensions
        ):
            raise serializers.ValidationError(
                "Unsupported file type."
            )

        return file