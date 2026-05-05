from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from .serializers import (
    UserSerializer, CategorySerializer, ProductSerializer, 
    SaleSerializer, RentalSerializer, InvoiceSerializer,
    PaymentSerializer, NotificationSerializer, CustomerSerializer,
    SiteConfigSerializer, GroupSerializer, PermissionSerializer, MovementSerializer
)
from .models import (
    User, Category, Product, Sale, Rental, Invoice, 
    Payment, Notification, Customer, SiteConfig, Movement
)
from rest_framework.views import APIView
from datetime import date, timedelta

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        today = date.today()
        yesterday = today - timedelta(days=1)
        month_start = today.replace(day=1)
        
        # Sales Stats
        total_sales_month = Sale.objects.filter(created_at__gte=month_start).aggregate(Sum('total'))['total__sum'] or 0
        total_rentals_active = Rental.objects.filter(status__in=['delivered', 'overdue', 'ready']).count()
        pending_returns_today = Rental.objects.filter(end_date=today, status='delivered').count()
        upcoming_deliveries = Rental.objects.filter(start_date=today, status__in=['reserved', 'preparing', 'ready']).count()
        
        # Financials
        total_revenue_today = Payment.objects.filter(created_at__date=today).aggregate(Sum('amount'))['amount__sum'] or 0
        total_revenue_yesterday = Payment.objects.filter(created_at__date=yesterday).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Calculate Revenue Trend
        revenue_trend = 0
        if total_revenue_yesterday > 0:
            revenue_trend = ((total_revenue_today - total_revenue_yesterday) / total_revenue_yesterday) * 100
        elif total_revenue_today > 0:
            revenue_trend = 100 # From 0 to something is 100% growth for display
        
        # Weekly Revenue Chart Data
        weekly_revenue = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            rev = Payment.objects.filter(created_at__date=day).aggregate(Sum('amount'))['amount__sum'] or 0
            weekly_revenue.append({
                'day': day.strftime('%a').upper(),
                'value': float(rev)
            })

        # Inventory
        low_stock = Product.objects.filter(stock__lte=2).count()
        
        # Recent activity
        recent_rentals = Rental.objects.order_by('-created_at')[:5]
        recent_rentals_data = RentalSerializer(recent_rentals, many=True).data

        return Response({
            'monthly_sales': float(total_sales_month),
            'active_rentals': total_rentals_active,
            'returns_today': pending_returns_today,
            'upcoming_deliveries': upcoming_deliveries,
            'revenue_today': float(total_revenue_today),
            'revenue_trend': round(revenue_trend, 1),
            'weekly_revenue': weekly_revenue,
            'low_stock': low_stock,
            'recent_rentals': recent_rentals_data
        })

from django.contrib.auth.models import Group, Permission

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAdminUser]

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAdminUser]

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'me':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        return User.objects.all()

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True)
        product_type = self.request.query_params.get('type')
        category = self.request.query_params.get('category')
        
        if product_type:
            queryset = queryset.filter(product_type__in=[product_type, 'both'])
        if category:
            queryset = queryset.filter(category_id=category)
            
        return queryset

    @action(detail=False, methods=['get'])
    def availability(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response({'error': 'start_date and end_date are required'}, status=400)
            
        queryset = self.get_queryset()
        results = []
        for p in queryset:
            available_stock = p.get_available_stock(start_date, end_date)
            conflicts = []
            if available_stock < p.stock:
                conflicts = p.get_conflicts(start_date, end_date)
                
            results.append({
                'id': p.id,
                'available_stock': available_stock,
                'total_stock': p.stock,
                'conflicts': conflicts
            })
        return Response(results)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Allow searching by doc_id
        doc_id = self.request.query_params.get('doc_id', None)
        if doc_id:
            return self.queryset.filter(doc_id=doc_id)
        return self.queryset

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().order_by('-created_at')
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset
        search = self.request.query_params.get('search')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if search:
            if search.startswith('#'):
                try:
                    queryset = queryset.filter(id=search.replace('#', ''))
                except: pass
            else:
                queryset = queryset.filter(customer_data__full_name__icontains=search) | \
                           queryset.filter(customer_name__icontains=search)
        
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user)

class RentalViewSet(viewsets.ModelViewSet):
    queryset = Rental.objects.all().order_by('-created_at')
    serializer_class = RentalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset
        search = self.request.query_params.get('search')
        status = self.request.query_params.get('status')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if search:
            if search.startswith('#'):
                try:
                    queryset = queryset.filter(id=search.replace('#', ''))
                except: pass
            else:
                queryset = queryset.filter(customer_data__full_name__icontains=search) | \
                           queryset.filter(customer_name__icontains=search)
        
        if status and status != 'all':
            queryset = queryset.filter(status=status)

        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user)

class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        # Daily Sales
        daily_sales = Sale.objects.annotate(date=TruncDate('created_at')) \
            .values('date').annotate(total=Sum('total')).order_by('date')
        
        # Daily Rentals
        daily_rentals = Rental.objects.annotate(date=TruncDate('created_at')) \
            .values('date').annotate(total=Sum('total')).order_by('date')

        # Top Sales Staff
        top_sales_staff = User.objects.annotate(sales_count=Count('sales_handled')) \
            .order_by('-sales_count')[:5].values('username', 'sales_count')

        # Top Rental Staff
        top_rental_staff = User.objects.annotate(rentals_count=Count('rentals_handled')) \
            .order_by('-rentals_count')[:5].values('username', 'rentals_count')

        return Response({
            'daily_sales': daily_sales,
            'daily_rentals': daily_rentals,
            'top_sales_staff': top_sales_staff,
            'top_rental_staff': top_rental_staff
        })

class CashViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        payment_qs = Payment.objects.all()
        movement_qs = Movement.objects.all()

        if start_date:
            payment_qs = payment_qs.filter(created_at__date__gte=start_date)
            movement_qs = movement_qs.filter(created_at__date__gte=start_date)
        if end_date:
            payment_qs = payment_qs.filter(created_at__date__lte=end_date)
            movement_qs = movement_qs.filter(created_at__date__lte=end_date)
        
        # Net Income (Payments - excluding "Garantia")
        net_payments = payment_qs.exclude(label__icontains='garantia').aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Internal Movements (IN - OUT) - excluding guarantee returns
        in_movements = movement_qs.filter(movement_type='IN').aggregate(Sum('amount'))['amount__sum'] or 0
        out_movements = movement_qs.filter(movement_type='OUT').exclude(description__icontains='Devolución Garantía').aggregate(Sum('amount'))['amount__sum'] or 0
        
        net_income = float(net_payments) + float(in_movements) - float(out_movements)
        
        # Total Guarantees (Total IN - Total OUT returns)
        total_in_guarantees = float(payment_qs.filter(label__icontains='garantia').aggregate(Sum('amount'))['amount__sum'] or 0)
        total_out_guarantees = float(movement_qs.filter(movement_type='OUT', description__icontains='Devolución Garantía').aggregate(Sum('amount'))['amount__sum'] or 0)
        total_guarantees = total_in_guarantees - total_out_guarantees

        # Distribution by Channel (Banks + Cash)
        channels_detailed = []

        # 1. Handle Cash
        cash_inc = float(payment_qs.exclude(label__icontains='garantia').filter(payment_method='efectivo').aggregate(Sum('amount'))['amount__sum'] or 0)
        cash_move_in = float(movement_qs.filter(movement_type='IN', payment_method='efectivo').aggregate(Sum('amount'))['amount__sum'] or 0)
        cash_move_out = float(movement_qs.filter(movement_type='OUT', payment_method='efectivo').exclude(description__icontains='Devolución Garantía').aggregate(Sum('amount'))['amount__sum'] or 0)
        
        cash_guar_in = float(payment_qs.filter(label__icontains='garantia', payment_method='efectivo').aggregate(Sum('amount'))['amount__sum'] or 0)
        cash_guar_out = float(movement_qs.filter(movement_type='OUT', payment_method='efectivo', description__icontains='Devolución Garantía').aggregate(Sum('amount'))['amount__sum'] or 0)
        
        channels_detailed.append({
            'channel': 'Efectivo',
            'income': cash_inc + cash_move_in - cash_move_out,
            'guarantees': cash_guar_in - cash_guar_out,
            'total': (cash_inc + cash_move_in - cash_move_out) + (cash_guar_in - cash_guar_out)
        })

        # 2. Handle Banks
        all_banks = ['nequi', 'bancolombia', 'daviplata', 'banco_bogota', 'otro']
        for b in all_banks:
            b_inc = float(payment_qs.exclude(label__icontains='garantia').filter(payment_method='transaccion', bank=b).aggregate(Sum('amount'))['amount__sum'] or 0)
            b_move_in = float(movement_qs.filter(movement_type='IN', payment_method='transaccion', bank=b).aggregate(Sum('amount'))['amount__sum'] or 0)
            b_move_out = float(movement_qs.filter(movement_type='OUT', payment_method='transaccion', bank=b).exclude(description__icontains='Devolución Garantía').aggregate(Sum('amount'))['amount__sum'] or 0)
            
            b_guar_in = float(payment_qs.filter(label__icontains='garantia', payment_method='transaccion', bank=b).aggregate(Sum('amount'))['amount__sum'] or 0)
            b_guar_out = float(movement_qs.filter(movement_type='OUT', payment_method='transaccion', bank=b, description__icontains='Devolución Garantía').aggregate(Sum('amount'))['amount__sum'] or 0)
            
            total_val = (b_inc + b_move_in - b_move_out) + (b_guar_in - b_guar_out)
            if total_val != 0:
                channels_detailed.append({
                    'channel': b,
                    'income': b_inc + b_move_in - b_move_out,
                    'guarantees': b_guar_in - b_guar_out,
                    'total': total_val
                })

        income_by_method = list(payment_qs.exclude(label__icontains='garantia').values('payment_method').annotate(total=Sum('amount')))

        return Response({
            'net_income': net_income,
            'total_guarantees': total_guarantees,
            'channels_detailed': channels_detailed,
            'income_by_method': income_by_method,
        })

    @action(detail=False, methods=['get'])
    def movements(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        page = int(request.query_params.get('page', 1))
        page_size = 10

        payments = Payment.objects.all()
        movements = Movement.objects.all()

        if start_date:
            payments = payments.filter(created_at__date__gte=start_date)
            movements = movements.filter(created_at__date__gte=start_date)
        if end_date:
            payments = payments.filter(created_at__date__lte=end_date)
            movements = movements.filter(created_at__date__lte=end_date)

        unified = []
        for p in payments:
            unified.append({
                'id': f"p_{p.id}",
                'amount': float(p.amount),
                'type': 'IN',
                'method': p.payment_method,
                'bank': p.bank,
                'label': p.label,
                'date': p.created_at,
                'staff': p.staff.username if p.staff else 'N/A'
            })
        for m in movements:
            unified.append({
                'id': f"m_{m.id}",
                'amount': float(m.amount),
                'type': m.movement_type,
                'method': m.payment_method,
                'bank': m.bank,
                'label': m.description,
                'date': m.created_at,
                'staff': m.staff.username if m.staff else 'N/A'
            })

        unified.sort(key=lambda x: x['date'], reverse=True)
        total_count = len(unified)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        return Response({
            'results': unified[start_idx:end_idx],
            'has_more': end_idx < total_count
        })

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def refresh(self, request):
        today = date.today()
        upcoming_3 = today + timedelta(days=3)
        upcoming_1 = today + timedelta(days=1)

        def create_notif(rental, n_type, title, message):
            if not Notification.objects.filter(related_rental=rental, title=title, is_read=False).exists():
                Notification.objects.create(
                    related_rental=rental,
                    notification_type=n_type,
                    title=title,
                    message=message
                )

        # 1. SALIDAS (Deliveries)
        # Reserved -> Alistar (3 days before)
        for r in Rental.objects.filter(start_date__lte=upcoming_3, start_date__gte=today, status='reserved'):
            name = r.customer.full_name if (r.customer and r.customer.full_name) else r.customer_name or "Cliente"
            create_notif(r, 'reminder', f"Alistar: {name}", f"Alquiler #{r.id} en estado Reservado. Alistar prendas.")

        # Preparing -> Marcar como Listo (1-2 days before)
        for r in Rental.objects.filter(start_date__lte=upcoming_1, start_date__gte=today, status='preparing'):
            name = r.customer.full_name if (r.customer and r.customer.full_name) else r.customer_name or "Cliente"
            create_notif(r, 'alert', f"Listo para entrega: {name}", f"Alquiler #{r.id} ya está alistado. Marcar como 'Listo para Entrega'.")

        # Ready -> Urgente Entregar (Day of)
        for r in Rental.objects.filter(start_date=today, status='ready'):
            name = r.customer.full_name if (r.customer and r.customer.full_name) else r.customer_name or "Cliente"
            create_notif(r, 'alert', f"ENTREGA HOY: {name}", f"Alquiler #{r.id} debe entregarse hoy al cliente.")

        # 2. ENTRADAS (Returns)
        # Delivered -> Alistarse para recoger (1 day before)
        for r in Rental.objects.filter(end_date=upcoming_1, status='delivered'):
            name = r.customer.full_name if (r.customer and r.customer.full_name) else r.customer_name or "Cliente"
            create_notif(r, 'reminder', f"Alistar Recogida: {name}", f"Alquiler #{r.id} vence mañana. Alistarse para recoger prendas.")

        # Delivered -> Recoger Hoy (Day of)
        for r in Rental.objects.filter(end_date=today, status='delivered'):
            name = r.customer.full_name if (r.customer and r.customer.full_name) else r.customer_name or "Cliente"
            create_notif(r, 'alert', f"RECOGER HOY: {name}", f"Alquiler #{r.id} vence hoy. Confirmar recepción con el cliente.")

        return Response({'status': 'Notificaciones actualizadas'})

class MovementViewSet(viewsets.ModelViewSet):
    queryset = Movement.objects.all()
    serializer_class = MovementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(staff=self.request.user)

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
