import hashlib

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Submission
from .serializers import SubmissionSerializer


class SubmissionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        submissions = Submission.objects.filter(student=request.user)
        serializer = SubmissionSerializer(submissions, many=True)
        return Response(
            {
                "success": True,
                "submissions": serializer.data
            },
            status=status.HTTP_200_OK
        )


class SubmissionCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = SubmissionSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_file = serializer.validated_data["file"]

        # Calculate SHA-256 hash
        sha256 = hashlib.sha256()

        for chunk in uploaded_file.chunks():
            sha256.update(chunk)

        file_hash = sha256.hexdigest()

        # Reset file pointer
        uploaded_file.seek(0)

        submission = serializer.save(
            student=request.user,
            file_size=uploaded_file.size,
            file_hash=file_hash
        )

        return Response(
            {
                "success": True,
                "message": "Assignment submitted successfully.",
                "submission": SubmissionSerializer(
                    submission
                ).data
            },
            status=status.HTTP_201_CREATED
        )