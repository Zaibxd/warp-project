from django.core.management.base import BaseCommand

from cafe.models import Product


SAMPLE_PRODUCTS = [
    {
        "name": "Espresso",
        "description": "Rich and bold single-shot espresso.",
        "category": "coffee",
        "price": "3.50",
        "image_url": "https://images.unsplash.com/photo-1511920170033-f8396924c348",
    },
    {
        "name": "Cappuccino",
        "description": "Espresso with steamed milk and silky foam.",
        "category": "coffee",
        "price": "4.75",
        "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
    },
    {
        "name": "Latte",
        "description": "Smooth espresso blended with creamy milk.",
        "category": "coffee",
        "price": "5.00",
        "image_url": "https://images.unsplash.com/photo-1561047029-3000c68339ca",
    },
    {
        "name": "Matcha Tea",
        "description": "Ceremonial-grade matcha with warm milk.",
        "category": "tea",
        "price": "4.50",
        "image_url": "https://images.unsplash.com/photo-1523920290228-4f321a939b4c",
    },
    {
        "name": "Chocolate Muffin",
        "description": "Soft baked muffin with dark chocolate chips.",
        "category": "dessert",
        "price": "3.25",
        "image_url": "https://images.unsplash.com/photo-1607478900766-efe13248b125",
    },
]


class Command(BaseCommand):
    help = "Seed the database with sample coffee shop products."

    def handle(self, *args, **options):
        created_count = 0
        for product_data in SAMPLE_PRODUCTS:
            _, created = Product.objects.get_or_create(
                name=product_data["name"],
                defaults=product_data,
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Seed complete. Created {created_count} new products.")
        )
