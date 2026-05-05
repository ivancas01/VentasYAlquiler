from rest_framework import serializers
from .models import (
    User, Category, Product, Sale, SaleItem, Rental, RentalItem, 
    Invoice, Payment, Notification, Customer, SiteConfig, Movement
)
from django.contrib.auth.models import Group, Permission

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ('id', 'name', 'codename')

class GroupSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Permission.objects.all(), source='permissions'
    )

    class Meta:
        model = Group
        fields = ('id', 'name', 'permissions', 'permission_ids')

class UserSerializer(serializers.ModelSerializer):
    groups_data = GroupSerializer(source='groups', many=True, read_only=True)
    group_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=Group.objects.all(), source='groups'
    )
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone', 'groups_data', 'group_ids', 'password')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        groups = validated_data.pop('groups', [])
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        user.groups.set(groups)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        groups = validated_data.pop('groups', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        if groups is not None:
            instance.groups.set(groups)
        return instance

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Product
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = SaleItem
        fields = ('id', 'product', 'product_name', 'quantity', 'price_at_sale')

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    staff_name = serializers.ReadOnlyField(source='staff.username')
    customer_data = CustomerSerializer(source='customer', read_only=True)

    class Meta:
        model = Sale
        fields = ('id', 'staff', 'staff_name', 'customer', 'customer_data', 'total', 'created_at', 'items')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        sale = Sale.objects.create(**validated_data)
        for item_data in items_data:
            SaleItem.objects.create(sale=sale, **item_data)
            # Update Stock
            product = item_data['product']
            product.stock -= item_data['quantity']
            product.save()
        # Create Invoice
        Invoice.objects.create(sale=sale)
        return sale

class RentalItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = RentalItem
        fields = ('id', 'product', 'product_name', 'product_image', 'price_at_rental')

    def get_product_image(self, obj):
        if obj.product.image:
            return f"http://127.0.0.1:8000{obj.product.image.url}"
        return None

class RentalSerializer(serializers.ModelSerializer):
    items = RentalItemSerializer(many=True)
    staff_name = serializers.ReadOnlyField(source='staff.username')
    customer_data = CustomerSerializer(source='customer', read_only=True)
    total_paid = serializers.ReadOnlyField()

    class Meta:
        model = Rental
        fields = ('id', 'staff', 'staff_name', 'customer', 'customer_data', 'start_date', 'end_date', 'total', 'total_paid', 'guarantee_type', 'guarantee_info', 'status', 'created_at', 'items')

    def validate(self, data):
        start = data.get('start_date')
        end = data.get('end_date')
        items = data.get('items')
        
        if items and start and end:
            # Count requested quantity for each product in this rental
            requested_counts = {}
            for item in items:
                pid = item['product'].id
                requested_counts[pid] = requested_counts.get(pid, 0) + 1
            
            for pid, qty in requested_counts.items():
                product = Product.objects.get(id=pid)
                # Check available stock for this period
                available = product.get_available_stock(start, end, exclude_rental_id=self.instance.id if self.instance else None)
                
                if available < qty:
                    raise serializers.ValidationError(f"El producto {product.name} no tiene suficiente stock disponible para esas fechas. Disponible: {available}")
        
        return data

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        rental = Rental.objects.create(**validated_data)
        for item_data in items_data:
            RentalItem.objects.create(rental=rental, **item_data)
        # Create Invoice
        Invoice.objects.create(rental=rental)
        
        # Auto-create guarantee payment if it's cash
        if rental.guarantee_type == 'monto' and rental.guarantee_info:
            try:
                # Clean and parse amount
                clean_amount = "".join(filter(str.isdigit, rental.guarantee_info))
                amount = float(clean_amount)
                if amount > 0:
                    from .models import Payment
                    Payment.objects.create(
                        rental=rental,
                        amount=amount,
                        payment_method='efectivo',
                        label='Garantia'
                    )
            except:
                pass
        return rental

    def update(self, instance, validated_data):
        old_g_type = instance.guarantee_type
        
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                item_data.pop('id', None)
                RentalItem.objects.create(rental=instance, **item_data)

        # Handle guarantee payment synchronization
        from .models import Payment, Movement
        if instance.status == 'received':
            # Instead of deleting, we record an OUT movement to show the return in history
            # But only if there's a cash guarantee and we haven't recorded the return yet
            if instance.guarantee_type == 'monto':
                try:
                    clean_amount = "".join(filter(str.isdigit, instance.guarantee_info))
                    amount = float(clean_amount)
                    if amount > 0:
                        # Check if already returned
                        return_desc = f"Devolución Garantía Alquiler #{instance.id}"
                        if not Movement.objects.filter(description=return_desc).exists():
                            Movement.objects.create(
                                staff=instance.staff, # Use the staff who received it
                                amount=amount,
                                movement_type='OUT',
                                payment_method='efectivo',
                                description=return_desc
                            )
                except:
                    pass
        elif instance.guarantee_type == 'monto':
            try:
                clean_amount = "".join(filter(str.isdigit, instance.guarantee_info))
                amount = float(clean_amount)
                if amount > 0:
                    Payment.objects.update_or_create(
                        rental=instance, label='Garantia',
                        defaults={'amount': amount, 'payment_method': 'efectivo'}
                    )
            except:
                pass
        elif old_g_type == 'monto' and instance.guarantee_type != 'monto':
            Payment.objects.filter(rental=instance, label='Garantia').delete()

        return instance

class PaymentSerializer(serializers.ModelSerializer):
    staff_name = serializers.ReadOnlyField(source='staff.username')
    reference = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ('id', 'staff', 'staff_name', 'rental', 'sale', 'amount', 'payment_method', 'bank', 'label', 'created_at', 'reference')

    def get_reference(self, obj):
        if obj.rental:
            customer = obj.rental.customer.full_name if obj.rental.customer else obj.rental.customer_name
            return f"Alquiler #{obj.rental.id} - {customer}"
        if obj.sale:
            customer = obj.sale.customer.full_name if obj.sale.customer else obj.sale.customer_name
            return f"Venta #{obj.sale.id} - {customer}"
        return "N/A"

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'

class MovementSerializer(serializers.ModelSerializer):
    staff_name = serializers.ReadOnlyField(source='staff.username')

    class Meta:
        model = Movement
        fields = ('id', 'staff', 'staff_name', 'amount', 'movement_type', 'payment_method', 'bank', 'description', 'created_at')

class SiteConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteConfig
        fields = '__all__'
