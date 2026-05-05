from django.contrib import admin
from .models import (
    User, Category, Product, Sale, Rental, Invoice, 
    Payment, Notification, Customer, SiteConfig, HeroImage
)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_active')
    search_fields = ('username', 'email')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'stock', 'price_sale', 'price_rental')
    list_filter = ('category', 'product_type')
    search_fields = ('name',)

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'total', 'created_at')
    list_filter = ('created_at',)

@admin.register(Rental)
class RentalAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'status', 'start_date', 'end_date')
    list_filter = ('status', 'start_date')

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('number', 'created_at')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'payment_method', 'amount', 'created_at')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'notification_type', 'is_read', 'created_at')

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'dni', 'phone')
    search_fields = ('full_name', 'dni')

@admin.register(SiteConfig)
class SiteConfigAdmin(admin.ModelAdmin):
    list_display = ('company_name_white', 'company_name_gold')

@admin.register(HeroImage)
class HeroImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'image', 'order', 'created_at')
