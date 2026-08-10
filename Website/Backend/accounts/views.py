from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer


class LoginView(APIView):

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Invalid roll number or password."
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        profile = getattr(user, "student_profile", None)

        return Response({
            "success": True,
            "message": "Login successful",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "student": {
                "id": user.id,
                "name": user.get_full_name() or user.first_name or user.username,
                "roll_number": user.username,
                "department": profile.department if profile else "Computer Science",
                "year": profile.year if profile else 3,
                "section": profile.section if profile else "A",
            }
        })


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, "student_profile", None)

        return Response({
            "success": True,
            "student": {
                "id": user.id,
                "name": user.get_full_name() or user.first_name or user.username,
                "roll_number": user.username,
                "department": profile.department if profile else "Computer Science",
                "year": profile.year if profile else 3,
                "section": profile.section if profile else "A",
            }
        })