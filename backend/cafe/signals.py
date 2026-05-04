from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Order
from .order_stream_bus import publish_order_status, publish_orders_changed


@receiver(pre_save, sender=Order)
def order_store_previous_status(sender, instance, **kwargs):
    if not instance.pk:
        instance._previous_status = None
        return
    try:
        prev = Order.objects.only("status").get(pk=instance.pk)
        instance._previous_status = prev.status
    except Order.DoesNotExist:
        instance._previous_status = None


@receiver(post_save, sender=Order)
def order_broadcast_updates(sender, instance, created, **kwargs):
    if created:
        publish_orders_changed()
        return

    previous = getattr(instance, "_previous_status", None)
    status_changed = previous is not None and previous != instance.status
    if status_changed:
        publish_order_status(instance.user_id, instance.id, instance.status)
        publish_orders_changed()
