from rest_framework import serializers
from django.contrib.auth import authenticate


class LoginSerializer(serializers.Serializer):
    roll_number = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        roll_number = data["roll_number"]
        password = data["password"]

        user = authenticate(
            username=roll_number,
            password=password
        )

        if not user:
            raise serializers.ValidationError(
                "Invalid roll number or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account is inactive."
            )

        data["user"] = user
        return data