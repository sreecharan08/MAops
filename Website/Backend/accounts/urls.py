from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, UserProfileView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("me/", UserProfileView.as_view(), name="user-profile"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
]
