import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'urban_backend.settings')
django.setup()

from django.contrib.auth.models import Group, Permission

def seed_groups():
    # 1. Administrador Total
    admin_group, created = Group.objects.get_or_create(name='Administrador Total')
    if created:
        # Assign all relevant permissions
        perms = Permission.objects.filter(codename__endswith=('product', 'rental', 'sale', 'category', 'customer', 'payment', 'user', 'group', 'notification', 'siteconfig', 'movement', 'heroimage', 'invoice'))
        admin_group.permissions.set(perms)
        print("Creado grupo: Administrador Total")

    # 2. Personal Operativo
    staff_group, created = Group.objects.get_or_create(name='Personal Operativo')
    if created:
        # Assign limited permissions
        staff_perms = Permission.objects.filter(codename__in=['add_sale', 'view_sale', 'view_product', 'view_rental', 'add_customer', 'view_customer', 'view_movement'])
        staff_group.permissions.set(staff_perms)
        print("Creado grupo: Personal Operativo")

if __name__ == '__main__':
    seed_groups()
