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
    
    path("login/", views.login_page, name="login"),
    path("api/auth/line/login/", views.line_login),
    path("api/auth/line/callback/", views.line_callback),

    path("api/profile/", views.api_profile),
    path("api/profile/update/", views.api_profile_update),

    path("api/forgot/send-code/",views.api_forgot_send_code),
    path("api/forgot/verify-code/",views.api_forgot_verify_code),
    path("api/forgot/reset-password/",views.api_forgot_reset_password),

    path("cart/",views.cart_page, name="cart"),
    path("api/cart/", views.api_cart),
    path("api/cart/add/", views.api_cart_add),
    path("api/cart/delete/<str:cart_id>/", views.api_cart_delete),

    path("api/order/submit/", views.api_order_submit),
    path("api/orders/", views.api_orders),
    

]
