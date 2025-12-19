from django.shortcuts import render
from django.http import HttpResponse
from datetime import datetime
from myapp.models import *
from django.forms.models import model_to_dict

# Create your views here.

    
def GGshopping(request):
    # return HttpResponse("hello")
    return render(request,'GGshopping.html',locals())

def news(request):
    return render(request,'news.html',locals())

def news_detail_1(request):
    return render(request, 'news_detail_1.html')

def news_detail_2(request):
    return render(request, 'news_detail_2.html')


def shop(request):
    return render(request,'shop.html',locals())

def about(request):
    return render(request,'about.html',locals())

def contact(request):
    return render(request,'contact.html',locals())

def product(request):
    return render(request,'product.html',locals())



import random
from django.http import JsonResponse
from django.views.decorators.http import require_POST

@require_POST
def send_register_code(request):
    phone = request.POST.get('phone')
    email = request.POST.get('email')

    if not phone and not email:
        return JsonResponse({'success': False, 'message': '缺少手機或 Email'})

    code = str(random.randint(100000, 999999))

    # 存進 session
    request.session['register_code'] = code
    request.session['register_phone'] = phone
    request.session['register_email'] = email

    # TODO: 寄送簡訊 / Email
    print('驗證碼:', code)

    return JsonResponse({'success': True})

from django.contrib.auth.models import User

from django.contrib import messages
from django.shortcuts import redirect

@require_POST
def confirm_register(request):
    code = request.POST.get('code')
    password = request.POST.get('password')
    password2 = request.POST.get('password2')

    if password != password2:
        messages.error(request, '兩次密碼不一致')
        return redirect('login')

    session_code = request.session.get('register_code')
    email = request.session.get('register_email')

    if not session_code or code != session_code:
        messages.error(request, '驗證碼錯誤')
        return redirect('login')

    if not email:
        messages.error(request, '註冊資料遺失，請重新發送驗證碼')
        return redirect('login')

    if User.objects.filter(username=email).exists():
        messages.error(request, '帳號已存在')
        return redirect('login')

    User.objects.create_user(username=email, email=email, password=password)

    # 清 session（不要 flush，避免把其他 session 都清掉）
    for k in ['register_code', 'register_phone', 'register_email']:
        request.session.pop(k, None)

    messages.success(request, '註冊成功，請登入')
    return redirect('login')


@require_POST
def forgot_send_code(request):
    account = request.POST.get('account')

    user = User.objects.filter(username=account).first()
    if not user:
        return JsonResponse({'success': False, 'message': '帳號不存在'})

    code = str(random.randint(100000, 999999))
    request.session['forgot_code'] = code
    request.session['forgot_user_id'] = user.id

    print('忘記密碼驗證碼:', code)
    return JsonResponse({'success': True})


@require_POST
def forgot_confirm(request):
    code = request.POST.get('code')
    password = request.POST.get('password')
    password2 = request.POST.get('password2')

    if password != password2:
        messages.error(request, '兩次密碼不一致')
        return redirect('login')

    if code != request.session.get('forgot_code'):
        messages.error(request, '驗證碼錯誤')
        return redirect('login')

    user_id = request.session.get('forgot_user_id')
    if not user_id:
        messages.error(request, '資料遺失，請重新發送驗證碼')
        return redirect('login')

    user = User.objects.get(id=user_id)
    user.set_password(password)
    user.save()

    for k in ['forgot_code', 'forgot_user_id']:
        request.session.pop(k, None)

    messages.success(request, '密碼已重設，請登入')
    return redirect('login')



from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login
from django.contrib import messages

def login_view(request):
    if request.method == 'POST':
        account = request.POST.get('account')
        password = request.POST.get('password')

        user = authenticate(request, username=account, password=password)

        if user is None:
            messages.error(request, '帳號或密碼錯誤')
            return redirect('login')

        auth_login(request, user)
        messages.success(request, '登入成功')
        return redirect('/')

    return render(request, 'login.html')

from django.shortcuts import render, redirect

def cart_add(request):
    if request.method != "POST":
        return redirect("/")

    sku = request.POST.get("sku")
    title = request.POST.get("title")
    if not sku or not title:
        return redirect("/product/")  # 或 redirect("/")
    price = int(request.POST.get("price", 0))
    image = request.POST.get("image")
    size = request.POST.get("size")

    qty_str = request.POST.get("qty", "1")
    try:
        qty = int(qty_str)
    except ValueError:
        qty = 1

    cart = request.session.get("cart", {})

    if sku in cart:
        cart[sku]["qty"] += qty
    else:
        cart[sku] = {
            "sku": sku,
            "title": title,
            "price": price,
            "qty": qty,
            "size": size,
            "image": image,
        }

    request.session["cart"] = cart
    request.session.modified = True

    return redirect("/cart/")


def cart_view(request):
    cart = request.session.get("cart", {})
    total = 0

    for item in cart.values():
        item["subtotal"] = item["price"] * item["qty"]
        total += item["subtotal"]

    return render(request, "cart.html", {
        "cart": cart,
        "total": total
    })

def cart_clear(request):
    request.session.pop("cart", None)
    return redirect("/cart/")

from django.shortcuts import redirect

def cart_inc(request, key):
    cart = request.session.get("cart", {})
    if key in cart:
        cart[key]["qty"] += 1
        request.session["cart"] = cart
        request.session.modified = True
    return redirect("/cart/")

def cart_dec(request, key):
    cart = request.session.get("cart", {})
    if key in cart:
        cart[key]["qty"] -= 1
        if cart[key]["qty"] <= 0:
            del cart[key]
        request.session["cart"] = cart
        request.session.modified = True
    return redirect("/cart/")

def cart_remove(request, key):
    cart = request.session.get("cart", {})

    if key in cart:
        del cart[key]
        request.session["cart"] = cart
        request.session.modified = True

    return redirect("/cart/")

from django.contrib.auth.decorators import login_required

@login_required(login_url="/login/")
def checkout_view(request):
    cart = request.session.get("cart",{})

    if not cart:
        return redirect("/cart/")
    
    total = 0
    for item in cart.values():
        item["subtotal"] = item["price"] * item["qty"]
        total += item["subtotal"]

    return render(request, "checkout.html", {
        "cart": cart,
        "total": total
    })

from .models import Order, OrderItem
from django.contrib.auth.decorators import login_required
@login_required(login_url="/login/")
def order_submit(request):
    if request.method == "POST":
        cart = request.session.get("cart", {})

        if not cart:
            return redirect("/cart/")

        total = 0
        for item in cart.values():
            total += item["price"] * item["qty"]

        order = Order.objects.create(
            user=request.user,
            total=total
        )

        for item in cart.values():
            OrderItem.objects.create(
                order=order,
                title=item["title"],
                size=item["size"],
                price=item["price"],
                qty=item["qty"]
            )

        request.session.pop("cart", None)

        return render(request, "order_success.html", {
            "order": order
        })
    
@login_required(login_url="/login/")
def order_list(request):
    orders = Order.objects.filter(user=request.user).order_by("-created_at")
    return render(request, "orders.html", {
        "orders": orders
    })

from django.contrib.auth import logout
from django.shortcuts import redirect

def logout_view(request):
    logout(request)

    # 清除所有殘留 messages
    storage = messages.get_messages(request)
    for _ in storage:
        pass

    return redirect('login')


from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages

@login_required(login_url='login')
def profile(request):
    user = request.user

    if request.method == 'POST':
        display_name = request.POST.get('display_name')

        if not display_name:
            messages.error(request, '使用者名稱不能為空')
            return redirect('profile')

        user.first_name = display_name   
        user.save()

        messages.success(request, '會員資料已更新')
        return redirect('profile')

    return render(request, 'profile.html', {
        'user': user
    })