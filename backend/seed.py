import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Category, Product, User

def seed():
    # Create Admin
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("Admin user created")

    # Categories
    tools, _ = Category.objects.get_or_create(name='Herramientas', slug='herramientas')
    tech, _ = Category.objects.get_or_create(name='Tecnología', slug='tecnologia')
    
    # Products
    Product.objects.get_or_create(
        name='Taladro Industrial',
        description='Taladro de alta potencia para trabajos pesados.',
        category=tools,
        product_type='both',
        price_sale=150.00,
        price_rental_daily=15.00,
        stock=10
    )
    
    Product.objects.get_or_create(
        name='Laptop Pro 2024',
        description='Potente laptop para diseño y desarrollo.',
        category=tech,
        product_type='sale',
        price_sale=1200.00,
        stock=5
    )
    
    Product.objects.get_or_create(
        name='Andamio de Aluminio',
        description='Andamio ligero y resistente.',
        category=tools,
        product_type='rental',
        price_rental_daily=25.00
    )
    
    print("Seeding complete!")

if __name__ == '__main__':
    seed()
