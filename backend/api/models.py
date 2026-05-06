from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
import uuid
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, email, password, **extra_fields)

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrador'),
        ('staff', 'Personal'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='staff')
    phone = models.CharField(max_length=20, blank=True, null=True)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    document_number = models.CharField(max_length=50, blank=True, null=True)
    
    objects = UserManager()

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(null=True, blank=True)
    
    def __cl__(self):
        return self.name

class Product(models.Model):
    TYPE_CHOICES = (
        ('sale', 'Solo Venta'),
        ('rental', 'Solo Alquiler'),
        ('both', 'Venta y Alquiler'),
    )
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    product_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='both')
    price_sale = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    price_rental = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    stock = models.IntegerField(default=0)
    reference = models.CharField(max_length=50, null=True, blank=True, unique=True)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    
    # Technical details
    color = models.CharField(max_length=50, null=True, blank=True)
    size = models.CharField(max_length=20, null=True, blank=True)
    pieces_count = models.IntegerField(default=1)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_available_stock(self, start_date, end_date, exclude_rental_id=None):
        # Base availability is just the current stock
        # In a real app, this would check against overlapping rentals
        return self.stock

    def __str__(self):
        return self.name

class Customer(models.Model):
    full_name = models.CharField(max_length=200)
    doc_type = models.CharField(max_length=10, default='CC')
    dni = models.CharField(max_length=50, unique=True, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(null=True, blank=True)
    phone_ref = models.CharField(max_length=20, null=True, blank=True)
    name_ref = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name

class Sale(models.Model):
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price_at_sale = models.DecimalField(max_digits=12, decimal_places=2)

class Rental(models.Model):
    STATUS_CHOICES = (
        ('reserved', 'Reservado'),
        ('preparing', 'Alistado'),
        ('ready', 'Listo'),
        ('delivered', 'Entregado'),
        ('received', 'Recibido'),
        ('cancelled', 'Cancelado'),
    )
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    total = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='reserved')
    
    # Tracking
    last_updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='rentals_updated')
    
    # Guarantee info
    guarantee_type = models.CharField(max_length=50, default='ninguna') # 'monto', 'documento', 'otro'
    guarantee_info = models.TextField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def total_paid(self):
        # We exclude security deposits (Garantia) from the rental payment total
        return sum(p.amount for p in self.payments.exclude(label='Garantia'))

class RentalItem(models.Model):
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    price_at_rental = models.DecimalField(max_digits=12, decimal_places=2)

class Invoice(models.Model):
    number = models.UUIDField(default=uuid.uuid4, editable=False)
    sale = models.OneToOneField(Sale, on_delete=models.CASCADE, null=True, blank=True)
    rental = models.OneToOneField(Rental, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Payment(models.Model):
    METHOD_CHOICES = (
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia Bancaria'),
        ('tarjeta', 'Tarjeta'),
    )
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, null=True, blank=True, related_name='payments')
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, null=True, blank=True, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    bank = models.CharField(max_length=100, null=True, blank=True)
    label = models.CharField(max_length=100, default='Pago') # 'Abono', 'Total', 'Garantia'
    created_at = models.DateTimeField(auto_now_add=True)

class Movement(models.Model):
    TYPE_CHOICES = (
        ('IN', 'Ingreso'),
        ('OUT', 'Egreso'),
    )
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    movement_type = models.CharField(max_length=3, choices=TYPE_CHOICES)
    payment_method = models.CharField(max_length=20, default='efectivo')
    bank = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    TYPE_CHOICES = (
        ('alert', 'Alerta Stock'),
        ('warning', 'Alerta Retraso / Vencimiento'),
        ('info', 'Informativa'),
    )
    title = models.CharField(max_length=200)
    message = models.TextField(null=True, blank=True)
    notification_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='info')
    is_read = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False)
    related_rental = models.ForeignKey('Rental', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class SiteConfig(models.Model):
    company_name_white = models.CharField(max_length=100, default='URBAN')
    company_name_gold = models.CharField(max_length=100, default='LUXURY')
    company_name = models.CharField(max_length=100, default='Urban Luxury')
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
    
    # Section Titles & Descriptions
    nosotros_title = models.CharField(max_length=100, default='NOSOTROS')
    contacto_title = models.CharField(max_length=100, default='CONTACTO')
    contacto_subtitle = models.CharField(max_length=255, default='¿Tienes alguna pregunta? Estamos listos para asesorarte de manera personalizada.')
    
    footer_text = models.TextField(default='La plataforma líder en gestión de activos, brindando soluciones eficientes para ventas y alquileres industriales y comerciales.')
    footer_links_title = models.CharField(max_length=100, default='Enlaces Rápidos')
    footer_contact_title = models.CharField(max_length=100, default='Contacto')
    
    def __str__(self):
        return f"Configuración de {self.company_name_white} {self.company_name_gold}"

class HeroImage(models.Model):
    image = models.ImageField(upload_to='hero_images/')
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Imagen de Inicio'
        verbose_name_plural = 'Imágenes de Inicio'

class AboutImage(models.Model):
    image = models.ImageField(upload_to='about_images/')
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Imagen de Nosotros'
        verbose_name_plural = 'Imágenes de Nosotros'
        ordering = ['order', '-created_at']
