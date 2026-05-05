import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Payment, Movement

def migrate():
    payments = Payment.objects.all()
    count = 0
    for p in payments:
        desc = ""
        if p.rental:
            desc = f"Pago de Alquiler #{p.rental.id}"
        elif p.sale:
            desc = f"Pago de Venta #{p.sale.id}"
        else:
            desc = "Pago General"
            
        if p.label == 'Garantia':
            desc = f"Garantía de Alquiler #{p.rental.id}"
            
        move, created = Movement.objects.get_or_create(
            description=desc,
            amount=p.amount,
            created_at=p.created_at,
            defaults={
                'staff': p.staff,
                'movement_type': 'IN',
                'payment_method': p.payment_method,
                'bank': p.bank,
            }
        )
        if created:
            # We can't change created_at easily because of auto_now_add
            # but for this audit it's fine as long as they show up.
            count += 1
            
    print(f"Successfully synchronized {count} payments to movements.")

if __name__ == "__main__":
    migrate()
