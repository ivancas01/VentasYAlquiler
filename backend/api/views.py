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
        from .models import Movement
        payment = serializer.save(staff=self.request.user)
        
        # Determine description
        desc = f"Pago de Alquiler #{payment.rental.id}" if payment.rental else f"Pago de Venta #{payment.sale.id}"
        if payment.label == 'Garantia':
            desc = f"Garantía de Alquiler #{payment.rental.id}"
            
        # Register in Movements table for Cash Register
        Movement.objects.create(
            staff=self.request.user,
            amount=payment.amount,
            movement_type='IN',
            payment_method=payment.payment_method,
            bank=payment.bank,
            description=desc
        )


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
        from .models import Payment, Movement, Rental
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        q_pay = Q()
        q_move = Q()
        if start_date:
            q_pay &= Q(created_at__date__gte=start_date)
            q_move &= Q(created_at__date__gte=start_date)
        if end_date:
            q_pay &= Q(created_at__date__lte=end_date)
            q_move &= Q(created_at__date__lte=end_date)
            
        # 1. Income from Sales and Rentals (excluding Guarantees)
        payments_normal = Payment.objects.filter(q_pay).exclude(label='Garantia')
        total_payments = payments_normal.aggregate(Sum('amount'))['amount__sum'] or 0
        
        # 2. Manual Movements (only those NOT from payments)
        movements_manual = Movement.objects.filter(q_move).exclude(description__icontains='Pago de Alquiler #').exclude(description__icontains='Pago de Venta #')
        manual_in = movements_manual.filter(movement_type='IN').aggregate(Sum('amount'))['amount__sum'] or 0
        manual_out = movements_manual.filter(movement_type='OUT').aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Net Income (Utilidad en flujo) = Payments + Manual IN - Manual OUT
        net_income = float(total_payments) + float(manual_in) - float(manual_out)
        
        # 3. Active Guarantees (Security deposits in custody)
        # These are payments labeled 'Garantia' for rentals that are NOT yet 'received' or 'cancelled'
        guarantees_in_custody = Payment.objects.filter(
            label='Garantia',
            rental__status__in=['reserved', 'preparing', 'ready', 'delivered']
        ).aggregate(Sum('amount'))['amount__sum'] or 0

        # 4. Detailed Breakdown for "Disponibilidad de Fondos"
        # We group by specific entities (Nequi, Bancolombia, etc.) or method (Efectivo)
        channels_to_check = [
            {'label': 'Efectivo', 'method': 'efectivo', 'bank': None},
            {'label': 'Nequi', 'method': 'transferencia', 'bank': 'nequi'},
            {'label': 'Bancolombia', 'method': 'transferencia', 'bank': 'bancolombia'},
            {'label': 'Daviplata', 'method': 'transferencia', 'bank': 'daviplata'},
            {'label': 'Otros Bancos', 'method': 'transferencia', 'bank': 'otro'},
        ]
        
        channels_detailed = []
        income_by_method = []
        
        for ch in channels_to_check:
            # Filters
            p_q = Q(payment_method=ch['method'])
            m_q = Q(payment_method=ch['method'])
            
            if ch['bank']:
                p_q &= Q(bank=ch['bank'])
                m_q &= Q(bank=ch['bank'])
            
            # Income
            m_sum = Payment.objects.filter(q_pay).filter(p_q).exclude(label='Garantia').aggregate(Sum('amount'))['amount__sum'] or 0
            m_move_in = movements_manual.filter(m_q).filter(movement_type='IN').aggregate(Sum('amount'))['amount__sum'] or 0
            m_move_out = movements_manual.filter(m_q).filter(movement_type='OUT').aggregate(Sum('amount'))['amount__sum'] or 0
            
            # Guarantees (Active)
            m_guarantees = Payment.objects.filter(
                p_q,
                label='Garantia',
                rental__status__in=['reserved', 'preparing', 'ready', 'delivered']
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            
            total_method_income = float(m_sum) + float(m_move_in) - float(m_move_out)
            
            channels_detailed.append({
                "channel": ch['label'],
                "income": total_method_income,
                "guarantees": float(m_guarantees),
                "total": total_method_income + float(m_guarantees)
            })
            
            income_by_method.append({
                "payment_method": ch['label'],
                "total": total_method_income
            })

        return Response({
            "net_income": net_income,
            "total_guarantees": float(guarantees_in_custody),
            "total_income": float(total_payments) + float(manual_in),
            "total_expense": float(manual_out),
            "channels_detailed": channels_detailed,
            "income_by_method": income_by_method
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
        
        # Trend calculation (this month vs last month)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        last_month_end = month_start - timedelta(days=1)
        
        sales_last_month = Sale.objects.filter(created_at__date__gte=last_month_start, created_at__date__lte=last_month_end).aggregate(total=Sum('total'))['total'] or 0
        rentals_last_month = Rental.objects.filter(created_at__date__gte=last_month_start, created_at__date__lte=last_month_end).aggregate(total=Sum('total'))['total'] or 0
        last_month_total = float(sales_last_month + rentals_last_month)
        # Month
        sales_month = Sale.objects.filter(created_at__date__gte=month_start).aggregate(total=Sum('total'))['total'] or 0
        rentals_month = Rental.objects.filter(created_at__date__gte=month_start).aggregate(total=Sum('total'))['total'] or 0
        this_month_total = float(sales_month + rentals_month)
        
        if last_month_total > 0:
            revenue_trend = round(((this_month_total - last_month_total) / last_month_total) * 100, 1)
        else:
            revenue_trend = 100 if this_month_total > 0 else 0

        # Weekly data (last 7 days)
        weekly_revenue = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            day_total = (Sale.objects.filter(created_at__date=d).aggregate(total=Sum('total'))['total'] or 0) + \
                        (Rental.objects.filter(created_at__date=d).aggregate(total=Sum('total'))['total'] or 0)
            weekly_revenue.append({
                "day": d.strftime('%a').upper(),
                "value": float(day_total)
            })

        # Recent rentals
        recent_rentals = Rental.objects.all().order_by('-created_at')[:5]
        recent_data = []
        for r in recent_rentals:
            recent_data.append({
                "id": r.id,
                "customer_name": r.customer.full_name if r.customer else "Anónimo",
                "end_date": r.end_date,
                "status": r.status,
                "total": float(r.total)
            })

        return Response({
            "revenue_today": float(sales_today + rentals_today),
            "monthly_sales": this_month_total,
            "active_rentals": Rental.objects.filter(status='delivered').count(),
            "low_stock": Product.objects.filter(stock__lte=2).count(),
            "upcoming_deliveries": Rental.objects.filter(start_date__date=today, status__in=['reserved', 'preparing', 'ready']).count(),
            "returns_today": Rental.objects.filter(end_date__date=today, status='delivered').count(),
            "revenue_trend": revenue_trend,
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
