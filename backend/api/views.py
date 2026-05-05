from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from .models import (
    User, Category, Product, Sale, Rental, Invoice, 
    Payment, Notification, Customer, SiteConfig, Movement, HeroImage
)
from .serializers import (
    UserSerializer, CategorySerializer, ProductSerializer, SaleSerializer,
    RentalSerializer, InvoiceSerializer, PaymentSerializer, NotificationSerializer,
    CustomerSerializer, SiteConfigSerializer, MovementSerializer, HeroImageSerializer,
    GroupSerializer, PermissionSerializer
)
from django.contrib.auth.models import Group, Permission
from datetime import timedelta

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

class PermissionViewSet(viewsets.ModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated]

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'availability']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Product.objects.all()
        p_type = self.request.query_params.get('type')
        category = self.request.query_params.get('category')
        if p_type:
            if p_type == 'both':
                queryset = queryset.filter(product_type='both')
            else:
                queryset = queryset.filter(product_type__in=[p_type, 'both'])
        if category and category != 'all':
            queryset = queryset.filter(category_id=category)
        return queryset

    @action(detail=False, methods=['get'])
    def availability(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response({"error": "start_date and end_date are required"}, status=400)
            
        products = Product.objects.all()
        results = []
        
        for product in products:
            # Find overlapping rentals
            # Overlap: (StartA <= EndB) and (EndA >= StartB)
            overlapping_rentals = Rental.objects.filter(
                items__product=product,
                start_date__lte=end_date,
                end_date__gte=start_date
            ).exclude(status='received') # Don't count returned items
            
            # Sum pieces of this product in overlapping rentals
            # We need to filter the items inside the rentals too
            booked_count = 0
            conflicts = []
            for rental in overlapping_rentals:
                # Count how many times this product appears in this rental
                count = rental.items.filter(product=product).count()
                booked_count += count
                conflicts.append({
                    "start": rental.start_date,
                    "end": rental.end_date,
                    "customer": rental.customer.full_name if rental.customer else "N/A"
                })
                
            results.append({
                "id": product.id,
                "available_stock": max(0, product.stock - booked_count),
                "conflicts": conflicts
            })
            
        return Response(results)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Customer.objects.all()
        doc_id = self.request.query_params.get('doc_id')
        search = self.request.query_params.get('search')
        if doc_id:
            queryset = queryset.filter(dni=doc_id)
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) | 
                Q(dni__icontains=search)
            )
        return queryset

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().order_by('-created_at')
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user)

class RentalViewSet(viewsets.ModelViewSet):
    queryset = Rental.objects.all().order_by('-created_at')
    serializer_class = RentalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user, last_updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(last_updated_by=self.request.user)

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(is_hidden=False).order_by('-created_at')

    def perform_destroy(self, instance):
        instance.is_hidden = True
        instance.save()
    
    @action(detail=False, methods=['post'])
    def refresh(self, request):
        from django.utils import timezone
        from .models import Rental, Product
        
        # 1. Auto-generate stock alerts
        products = Product.objects.filter(stock__lte=2)
        for p in products:
            title = f"Stock Bajo: {p.name}"
            if not Notification.objects.filter(title=title).exists():
                Notification.objects.create(
                    title=title,
                    message=f"Quedan solo {p.stock} unidades de {p.name}.",
                    notification_type='alert',
                    is_read=False
                )
            
        # 2. Auto-generate rental due alerts
        today = timezone.now().date()
        due_rentals = Rental.objects.filter(
            end_date__date__lte=today,
            status__in=['reserved', 'preparing', 'ready', 'delivered']
        )
        
        for r in due_rentals:
            title = f"Alquiler por Vencer/Vencido: #{r.id}"
            if not Notification.objects.filter(title=title, related_rental=r).exists():
                status_label = r.get_status_display()
                msg = f"El alquiler #{r.id} ({r.customer.full_name if r.customer else 'Sin cliente'}) vence hoy o está vencido. Estado actual: {status_label}."
                Notification.objects.create(
                    title=title,
                    message=msg,
                    notification_type='warning',
                    related_rental=r,
                    is_read=False
                )
            
        return Response({"status": "refreshed"})

    @action(detail=False, methods=['post'])
    def read_all(self, request):
        Notification.objects.filter(is_read=False).update(is_read=True)
        return Response({"status": "all marked as read"})

class MovementViewSet(viewsets.ModelViewSet):
    queryset = Movement.objects.all().order_by('-created_at')
    serializer_class = MovementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user)

class CashViewSet(viewsets.ModelViewSet):
    queryset = Movement.objects.all().order_by('-created_at')
    serializer_class = MovementSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        q = Q()
        if start_date:
            q &= Q(created_at__date__gte=start_date)
        if end_date:
            q &= Q(created_at__date__lte=end_date)
            
        movements = Movement.objects.filter(q)
        total_in = movements.filter(movement_type='IN').aggregate(Sum('amount'))['amount__sum'] or 0
        total_out = movements.filter(movement_type='OUT').aggregate(Sum('amount'))['amount__sum'] or 0
        
        return Response({
            "total_income": total_in,
            "total_expense": total_out,
            "balance": total_in - total_out
        })

    @action(detail=False, methods=['get'])
    def movements(self, request):
        return self.list(request)

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        last_30_days = timezone.now() - timedelta(days=30)
        
        # Daily Sales
        daily_sales = Sale.objects.filter(created_at__gte=last_30_days)\
            .annotate(date=TruncDate('created_at'))\
            .values('date')\
            .annotate(total=Sum('total'))\
            .order_by('date')
        
        # Daily Rentals
        daily_rentals = Rental.objects.filter(created_at__gte=last_30_days)\
            .annotate(date=TruncDate('created_at'))\
            .values('date')\
            .annotate(total=Sum('total'))\
            .order_by('date')
            
        # Top Staff Sales
        top_sales_staff = Sale.objects.filter(created_at__gte=last_30_days)\
            .values('staff__username')\
            .annotate(sales_count=Count('id'))\
            .order_by('-sales_count')[:5]
            
        # Top Staff Rentals
        top_rental_staff = Rental.objects.filter(created_at__gte=last_30_days)\
            .values('staff__username')\
            .annotate(rentals_count=Count('id'))\
            .order_by('-rentals_count')[:5]

        # Formatting keys for frontend
        formatted_sales_staff = [{"username": item['staff__username'], "sales_count": item['sales_count']} for item in top_sales_staff]
        formatted_rental_staff = [{"username": item['staff__username'], "rentals_count": item['rentals_count']} for item in top_rental_staff]

        return Response({
            "daily_sales": list(daily_sales),
            "daily_rentals": list(daily_rentals),
            "top_sales_staff": formatted_sales_staff,
            "top_rental_staff": formatted_rental_staff
        })

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        # Today
        sales_today = Sale.objects.filter(created_at__date=today).aggregate(total=Sum('total'))['total'] or 0
        rentals_today = Rental.objects.filter(created_at__date=today).aggregate(total=Sum('total'))['total'] or 0
        
        # Month
        sales_month = Sale.objects.filter(created_at__date__gte=month_start).aggregate(total=Sum('total'))['total'] or 0
        rentals_month = Rental.objects.filter(created_at__date__gte=month_start).aggregate(total=Sum('total'))['total'] or 0
        
        # Weekly data (last 7 days)
        weekly_revenue = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            day_total = (Sale.objects.filter(created_at__date=d).aggregate(total=Sum('total'))['total'] or 0) + \
                        (Rental.objects.filter(created_at__date=d).aggregate(total=Sum('total'))['total'] or 0)
            weekly_revenue.append({
                "day": d.strftime('%a'),
                "value": float(day_total)
            })

        # Recent rentals
        recent_rentals = Rental.objects.all().order_by('-created_at')[:5]
        recent_data = []
        for r in recent_rentals:
            recent_data.append({
                "id": r.id,
                "customer_name": r.customer.full_name if r.customer else "N/A",
                "end_date": r.end_date,
                "status": r.status,
                "total": r.total
            })

        return Response({
            "revenue_today": float(sales_today + rentals_today),
            "monthly_sales": float(sales_month + rentals_month),
            "active_rentals": Rental.objects.filter(status='active').count(),
            "low_stock": Product.objects.filter(stock__lte=2).count(),
            "upcoming_deliveries": Rental.objects.filter(start_date__date=today, status='pending').count(),
            "returns_today": Rental.objects.filter(end_date__date=today, status='active').count(),
            "revenue_trend": 12, # Static for now
            "weekly_revenue": weekly_revenue,
            "recent_rentals": recent_data
        })

class SiteConfigViewSet(viewsets.ModelViewSet):
    queryset = SiteConfig.objects.all()
    serializer_class = SiteConfigSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def list(self, request, *args, **kwargs):
        config, created = SiteConfig.objects.get_or_create(id=1)
        serializer = self.get_serializer(config)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        config, created = SiteConfig.objects.get_or_create(id=1)
        serializer = self.get_serializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class HeroImageViewSet(viewsets.ModelViewSet):
    queryset = HeroImage.objects.all()
    serializer_class = HeroImageSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
