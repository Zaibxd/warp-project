from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminOrderListView,
    AdminOrderStatusUpdateView,
    OrderStreamView,
    CartItemDetailView,
    CartItemListCreateView,
    ClearCartView,
    DeliveryAddressDetailView,
    DeliveryAddressListCreateView,
    LoginView,
    MeView,
    MyOrdersView,
    PlaceOrderView,
    ProductDetailView,
    ProductListCreateView,
    RegisterView,
    UserProfileView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("user/profile/", UserProfileView.as_view(), name="user_profile"),
    path("user/addresses/", DeliveryAddressListCreateView.as_view(), name="delivery_addresses"),
    path("user/addresses/<int:pk>/", DeliveryAddressDetailView.as_view(), name="delivery_address_detail"),
    path("products/", ProductListCreateView.as_view(), name="product_list"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product_detail"),
    path("cart/", CartItemListCreateView.as_view(), name="cart_list"),
    path("cart/<int:pk>/", CartItemDetailView.as_view(), name="cart_item_detail"),
    path("cart/clear/", ClearCartView.as_view(), name="clear_cart"),
    path("orders/place/", PlaceOrderView.as_view(), name="place_order"),
    path("orders/stream/", OrderStreamView.as_view(), name="order_stream"),
    path("orders/my/", MyOrdersView.as_view(), name="my_orders"),
    path("orders/", AdminOrderListView.as_view(), name="admin_orders"),
    path("orders/<int:pk>/status/", AdminOrderStatusUpdateView.as_view(), name="admin_order_status"),
]
