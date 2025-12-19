"""
URL configuration for final-homework project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from myapp import views

urlpatterns = [
    path('admin/', admin.site.urls),

    # path('final-homework/',views.final-homework),
    path('GGshopping/', views.GGshopping),
    path('news/', views.news),
    path('news/1/', views.news_detail_1),
    path('news/2/', views.news_detail_2),
    path('shop/', views.shop),
    path('about/', views.about),
    path('contact/', views.contact),
    path('product/', views.product),
    

    path('register/send-code/', views.send_register_code, name='send_register_code'),
    path('register/confirm/', views.confirm_register, name='confirm_register'),
    path('forgot/send-code/', views.forgot_send_code, name='forgot_send_code'),
    path('forgot/confirm/', views.forgot_confirm, name='forgot_confirm'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('', views.GGshopping, name='home'),
    path("cart/", views.cart_view, name="cart"),
    path("cart/add/", views.cart_add, name="cart_add"),
    path("cart/clear/", views.cart_clear, name="cart_clear"),
    path("cart/inc/<str:key>/", views.cart_inc, name="cart_inc"),
    path("cart/dec/<str:key>/", views.cart_dec, name="cart_dec"),
    path("cart/remove/<str:key>/", views.cart_remove, name="cart_remove"),
    path("checkout/", views.checkout_view, name="checkout"),
    path("order/submit/", views.order_submit, name="order_submit"),
    path("orders/", views.order_list, name="order_list"),
    path("profile/", views.profile, name="profile"),
    

]
