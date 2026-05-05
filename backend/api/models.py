from django.db import models
from django.db.models import Sum
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrator'),
        ('manager', 'Manager'),
        ('staff', 'Staff'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    phone = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    TYPE_CHOICES = (
        ('sale', 'Venta'),
        ('rental', 'Alquiler'),
        ('both', 'Venta y Alquiler'),
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    pieces_count = models.IntegerField(default=1)
    size = models.CharField(max_length=50, blank=True, null=True, help_text="Talla o Medida")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    product_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='sale')
    
    # Sale fields
    price_sale = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.IntegerField(default=0)
    
    # Rental fields
    price_rental = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Common fields
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def is_available(self, start_date, end_date, exclude_rental_id=None):
        return self.get_available_stock(start_date, end_date, exclude_rental_id) > 0

    def get_available_stock(self, start_date, end_date, exclude_rental_id=None):
        from .models import RentalItem
        # Overlap condition: (start1 <= end2) and (end1 >= start2)
        overlapping_rentals = RentalItem.objects.filter(
            product=self,
            rental__start_date__lte=end_date,
            rental__end_date__gte=start_date
        ).exclude(rental__status='received')
        
        if exclude_rental_id:
            overlapping_rentals = overlapping_rentals.exclude(rental__id=exclude_rental_id)
            
        rented_count = overlapping_rentals.count()
        return max(0, self.stock - rented_count)

    def get_conflicts(self, start_date, end_date, exclude_rental_id=None):
        from .models import RentalItem
        conflicts = RentalItem.objects.filter(
            product=self,
            rental__start_date__lte=end_date,
            rental__end_date__gte=start_date
        ).exclude(rental__status='received')
        
        if exclude_rental_id:
            conflicts = conflicts.exclude(rental__id=exclude_rental_id)
            
        return [
            {
                'rental_id': item.rental.id,
                'start': item.rental.start_date,
                'end': item.rental.end_date,
                'status': item.rental.get_status_display(),
                'customer': item.rental.customer.full_name if item.rental.customer else item.rental.customer_name
            } for item in conflicts
        ]

    def __str__(self):
        return self.name

class Customer(models.Model):
    DOC_TYPES = (
        ('CC', 'Cédula de Ciudadanía'),
        ('CE', 'Cédula de Extranjería'),
        ('TI', 'Tarjeta de Identidad'),
        ('PP', 'Pasaporte'),
    )
    full_name = models.CharField(max_length=255)
    doc_type = models.CharField(max_length=5, choices=DOC_TYPES, default='CC')
    doc_id = models.CharField(max_length=50, unique=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20)
    phone_ref = models.CharField(max_length=20, blank=True, null=True)
    name_ref = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.doc_id})"

class Sale(models.Model):
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sales_handled')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, related_name='sales')
    customer_name = models.CharField(max_length=200, blank=True, null=True) # Legacy support
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sale #{self.id} - {self.total}"

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2)

class Rental(models.Model):
    STATUS_CHOICES = (
        ('reserved', 'Reservado'),
        ('preparing', 'Alistado'),
        ('ready', 'Listo para Entrega'),
        ('delivered', 'Entregado'),
        ('received', 'Recibido'),
        ('overdue', 'Atrasado'),
    )
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='rentals_handled')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, related_name='rentals')
    customer_name = models.CharField(max_length=200, blank=True, null=True) # Legacy support
    start_date = models.DateField()
    end_date = models.DateField()
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    GUARANTEE_CHOICES = (
        ('documento', 'Documento'),
        ('monto', 'Monto Efectivo'),
        ('otro', 'Otro'),
    )
    guarantee_type = models.CharField(max_length=20, choices=GUARANTEE_CHOICES, default='documento')
    guarantee_info = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='reserved')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rental #{self.id} - {self.customer.full_name if self.customer else 'No Name'}"

class Payment(models.Model):
    PAYMENT_METHODS = (
        ('efectivo', 'Efectivo'),
        ('transaccion', 'Transacción / Transferencia'),
    )
    BANKS = (
        ('nequi', 'Nequi'),
        ('bancolombia', 'Bancolombia'),
        ('daviplata', 'Daviplata'),
        ('banco_bogota', 'Banco de Bogotá'),
        ('otro', 'Otro'),
    )
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='payments_recorded')
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHODS, default='efectivo')
    bank = models.CharField(max_length=50, choices=BANKS, null=True, blank=True)
    label = models.CharField(max_length=100, default='Pago') # e.g. "Abono Inicial", "Saldo"
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.rental:
            self.rental.total_paid = self.rental.payments.aggregate(Sum('amount'))['amount__sum'] or 0
            self.rental.save()

class Movement(models.Model):
    TYPE_CHOICES = (
        ('IN', 'Entrada'),
        ('OUT', 'Salida'),
    )
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='movements_recorded')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    movement_type = models.CharField(max_length=5, choices=TYPE_CHOICES)
    payment_method = models.CharField(max_length=50, choices=Payment.PAYMENT_METHODS, default='efectivo')
    bank = models.CharField(max_length=50, choices=Payment.BANKS, null=True, blank=True)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.movement_type} - {self.amount} ({self.description})"

class Notification(models.Model):
    TYPE_CHOICES = (
        ('reminder', 'Reminder'),
        ('alert', 'Alert'),
        ('payment', 'Payment Received'),
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='reminder')
    related_rental = models.ForeignKey(Rental, on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class RentalItem(models.Model):
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    price_at_rental = models.DecimalField(max_digits=10, decimal_places=2)

class Invoice(models.Model):
    sale = models.OneToOneField(Sale, on_delete=models.CASCADE, null=True, blank=True)
    rental = models.OneToOneField(Rental, on_delete=models.CASCADE, null=True, blank=True)
    invoice_number = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            prefix = "INV-S" if self.sale else "INV-R"
            count = Invoice.objects.count() + 1
            self.invoice_number = f"{prefix}-{count:06d}"
        super().save(*args, **kwargs)

class SiteConfig(models.Model):
    company_name_white = models.CharField(max_length=100, default='URBAN')
    company_name_gold = models.CharField(max_length=100, default='LUXURY')
    hero_title_white = models.CharField(max_length=100, default='URBAN')
    hero_title_gold = models.CharField(max_length=100, default='LUXURY')
    hero_tagline = models.CharField(max_length=255, default='ESTILO SIN LÍMITES')
    hero_subtitle = models.TextField(default='ALQUILER Y VENTA DE ALTA COSTURA PARA EVENTOS EXCLUSIVOS. EL LUJO QUE MERECES, SIN COMPROMISOS.')
    
    about_text = models.TextField(default='En Urban Luxury, redefinimos la experiencia de vestir bien. Creemos que la elegancia no debería ser una carga, sino una elección libre y flexible.')
    about_vision = models.TextField(default='Convertirnos en el referente nacional de moda circular de lujo, promoviendo un estilo de vida sofisticado y sostenible.')
    about_mission = models.TextField(default='Facilitar el acceso a prendas exclusivas mediante un servicio impecable de alquiler y venta, garantizando que cada cliente se sienta su mejor versión.')
    
    contact_phone = models.CharField(max_length=50, default='+57 300 000 0000')
    contact_email = models.EmailField(default='info@urbanluxury.com')
    contact_address = models.CharField(max_length=255, default='Avenida Lujo #45-12, Ciudad')
    
    facebook_url = models.URLField(blank=True, null=True)
    instagram_url = models.URLField(blank=True, null=True)
    tiktok_url = models.URLField(blank=True, null=True)
    whatsapp_url = models.URLField(blank=True, null=True)
    
    footer_text = models.TextField(default='© 2026 Urban Luxury. Todos los derechos reservados.')
    
    THEME_CHOICES = (
        ('noir', 'Urban Noir (Oscuro/Oro)'),
        ('arctic', 'Minimal Arctic (Claro/Plata)'),
        ('cyber', 'Street Cyber (Oscuro/Neon)'),
    )
    FONT_CHOICES = (
        ('modern', 'Modern Clean (Outfit)'),
        ('classic', 'Classic Editorial (Playfair)'),
        ('tech', 'Urban Tech (Space Grotesk)'),
    )
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='noir')
    typography = models.CharField(max_length=20, choices=FONT_CHOICES, default='modern')

    def __str__(self):
        return f"Configuración de {self.company_name_white} {self.company_name_gold}"
