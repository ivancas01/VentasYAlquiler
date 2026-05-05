from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, CategoryViewSet, ProductViewSet,
    SaleViewSet, RentalViewSet, InvoiceViewSet, AnalyticsViewSet,
    PaymentViewSet, NotificationViewSet, CustomerViewSet, DashboardStatsView,
    GroupViewSet, PermissionViewSet, SiteConfigViewSet, CashViewSet, MovementViewSet
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'rentals', RentalViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'payments', PaymentViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'permissions', PermissionViewSet)
router.register(r'config', SiteConfigViewSet, basename='config')
router.register(r'cash', CashViewSet, basename='cash')
router.register(r'movements', MovementViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
