from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login,get_user_model
from django.contrib.auth.models import User

import json
import random
import requests
import time
from datetime import datetime
from firebase_admin import auth as firebase_auth, firestore
from .auth_utils import get_uid_from_request
from .firebase_init import init_firebase
from .firebase_init import get_db
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

def GGshopping(request):
    return render(request, "GGshopping.html")

def news(request):
    return render(request, "news.html")

def news_detail_1(request):
    return render(request, "news_detail_1.html")

def news_detail_2(request):
    return render(request, "news_detail_2.html")

def shop(request):
    return render(request, "shop.html")

def about(request):
    return render(request, "about.html")

def contact(request):
    return render(request, "contact.html")

def product(request):
    return render(request, "product.html")

def login_page(request):
    return render(request, "login.html")

def profile_page(request):
    return render(request, "profile.html")

def delete_account_page(request):
    return render(request, "account_delete.html")

def cart_page(request):
    return render(request,"cart.html")

def checkout(request):
    return render(request,"checkout.html")

def orders_page(request):
    return render(request,"orders.html")

def favorites_page(request):
    return render(request,"favorites.html")

def order_success_page(request):
    return render(request, "order_success.html")

User = get_user_model()
@csrf_exempt
def firebase_login(request):
    init_firebase()
    if request.method != "POST":
        return JsonResponse({"success": False}, status=405)

    try:
        body = json.loads(request.body)
        token = body.get("token")

        decoded = firebase_auth.verify_id_token(token,clock_skew_seconds=10)
        uid = decoded["uid"]
        email = decoded.get("email", f"{uid}@firebase.local")
        if not email:
            return JsonResponse(
                {"success": False, "error": "No email in token"},
                status=400
            )
        
        user, created = User.objects.get_or_create(
            username=f"firebase_{uid}",
            defaults={
                "email": email,
            }
        )

       
        if user.email != email:
            user.email = email
            user.save()

        
        login(request, user)
        
        db = get_db()
        db.collection("users").document(uid).set({
            "uid": uid,
            "email": email,
            "provider": decoded.get("firebase", {}).get("sign_in_provider"),
            "lastLoginAt": firestore.SERVER_TIMESTAMP
        }, merge=True)
        coupons_ref = db.collection("users").document(uid).collection("coupons")

        
        has_coupon = list(coupons_ref.limit(1).stream())

        if not has_coupon:
            now = firestore.SERVER_TIMESTAMP

            
            coupons_ref.document("SAVE300").set({
                "title": "滿 3000 折 300",
                "type": "AMOUNT",
                "value": 300,
                "minSpend": 3000,
                "used": False,
                "createdAt": now,
                "expireDate": "2026/01/31"
            })

            
            coupons_ref.document("WELCOME10").set({
                "title": "新會員 9 折",
                "type": "PERCENT",
                "value": 10,          
                "minSpend": 0,
                "used": False,
                "createdAt": now,
                "expireDate": "2026/02/15"
            })    
        return JsonResponse({"success": True})
    except Exception as e:
        print("❌ firebase_login error:", e)
        return JsonResponse({"success": False}, status=400)



LINE_CHANNEL_ID = 2008634753
LINE_CHANNEL_SECRET = "d417d86ac49cc7f482035a82ccc4a18d"
LINE_REDIRECT_URI = "https://ggshopweb.onrender.com/api/auth/line/callback/" # http://192.168.59.19:8080/api/auth/line/callback/

def line_login(request):
    url = (
        "https://access.line.me/oauth2/v2.1/authorize"
        f"?response_type=code"
        f"&client_id={LINE_CHANNEL_ID}"
        f"&redirect_uri={LINE_REDIRECT_URI}"
        f"&scope=profile%20openid%20email"
        f"&state=12345"
    )
    return redirect(url)

def line_callback(request):
    code = request.GET.get("code")
    if not code:
        return JsonResponse({"error": "no code"}, status=400)

    token_res = requests.post(
        "https://api.line.me/oauth2/v2.1/token",
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": LINE_REDIRECT_URI,
            "client_id": LINE_CHANNEL_ID,
            "client_secret": LINE_CHANNEL_SECRET,
        },
    ).json()

    access_token = token_res.get("access_token")
    profile = requests.get(
        "https://api.line.me/v2/profile",
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()

    uid = f"line:{profile.get('userId')}"
    db = get_db()

    try:
        firebase_auth.get_user(uid)
    except:
        firebase_auth.create_user(
            uid=uid,
            display_name=profile.get("displayName"),
            photo_url=profile.get("pictureUrl"),
        )

    db.collection("users").document(uid).set({
        "uid": uid,
        "name": profile.get("displayName"),
        "provider": "line",
        "photo": profile.get("pictureUrl"),
        "createdAt": firestore.SERVER_TIMESTAMP,
    }, merge=True)

    token = firebase_auth.create_custom_token(uid)
    return render(request, "line_callback.html", {
        "firebase_token": token.decode()
    })

@csrf_exempt
def api_profile(request):
    uid = get_uid_from_request(request)
    db = get_db()
    doc = db.collection("users").document(uid).get()
    return JsonResponse(doc.to_dict() if doc.exists else {}, safe=False)


@csrf_exempt
@require_POST
def api_profile_update(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    body = json.loads(request.body)

    name = body.get("name", "").strip()
    phone = body.get("phone", "")

    if not (2 <= len(name) <= 20):
        return JsonResponse({"error": "Invalid name"}, status=400)

    if phone and not phone.startswith("09"):
        return JsonResponse({"error": "Invalid phone"}, status=400)

    db = get_db()
    db.collection("users").document(uid).set(body, merge=True)
    return JsonResponse({"success": True})


@csrf_exempt
def api_delete_account(request):
    if request.method != "POST":
        return JsonResponse({"success": False}, status=405)

    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"success": False, "error": "No UID"}, status=401)

    db = get_db()

    try:
        user_ref = db.collection("users").document(uid)

        for col in ["cart", "orders", "coupons", "favorites"]:
            for doc in user_ref.collection(col).stream():
                doc.reference.delete()

        user_ref.delete()

        User = get_user_model()
        User.objects.filter(username=f"firebase_{uid}").delete()

        return JsonResponse({"success": True})

    except Exception as e:
        print("❌ delete_account error:", e)
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@csrf_exempt
def api_forgot_send_code(request):
    if request.method != "POST":
        return JsonResponse({"success": False}, status=405)
    
    body = json.loads(request.body)
    email = body.get("email")

    if not email:
        return JsonResponse({"success": False, "message": "缺少 Email"})
    
    db = get_db()
    users = list(db.collection("users").where("email", "==", email).stream())

    if not users:
        return JsonResponse({"success": False, "message": "Email 不存在"})

    code = str(random.randint(100000, 999999))
    users[0].reference.update({"resetCode": code})

    
    requests.post(
        "https://us-central1-shopping-54704.cloudfunctions.net/sendResetCode",
        json={
            "data": {
                "email": email,
                "code": code
            }
        },
        headers={"Content-Type": "application/json"}
    )

    return JsonResponse({"success": True})

@csrf_exempt
def api_forgot_verify_code(request):
    if request.method != "POST":
        return JsonResponse({"success": False}, status=405)

    body = json.loads(request.body)
    email = body.get("email")
    code = body.get("code")
    db = get_db()
    users = db.collection("users").where("email", "==", email).stream()
    users = list(users)

    if not users:
        return JsonResponse({"success": False})
    
    if code == users[0].to_dict().get("resetCode"):
        return JsonResponse({"success": True})
    else:
        return JsonResponse({"success": False})
    
@csrf_exempt
def api_forgot_reset_password(request):
    if request.method != "POST":
        return JsonResponse({"success": False}, status=405)

    body = json.loads(request.body)
    email = body.get("email")
    new_password = body.get("password")

    if not email or not new_password:
        return JsonResponse({"success": False})

    try:
        user = firebase_auth.get_user_by_email(email)
    except firebase_auth.UserNotFoundError:
        return JsonResponse({"success": False, "message": "User not found"})

    firebase_auth.update_user(
        user.uid,
        password=new_password
    )
    db = get_db()
    users = list(db.collection("users").where("email", "==", email).stream())
    if users:
        users[0].reference.update({"resetCode": ""})

    return JsonResponse({"success": True})




def api_cart(request):
    uid = get_uid_from_request(request)
    print("📦 api_cart UID =", uid)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    db = get_db()
    docs = (
        db.collection("users")
        .document(uid)
        .collection("cart")
        .stream()
    )

    result = []

    for doc in docs:
        item = doc.to_dict()
        
        result.append({
            "id": doc.id,
            "productId": item.get("productId"),
            "productName": item.get("productName"),  
            "price": item.get("price", 0),
            "quantity": item.get("quantity", 1),
            "size": item.get("size", ""),
            "imageKey": item.get("imageKey"), 
        })

    return JsonResponse(result, safe=False)


@csrf_exempt
@require_POST
def api_cart_add(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    db = get_db()
    item = json.loads(request.body)
    cart_ref = db.collection("users").document(uid).collection("cart")
    exists = (
        cart_ref
        .where("productId", "==", item["productId"])
        .where("size", "==", item["size"])
        .stream()
    )
    exists = list(exists)
    if exists:
        doc = exists[0]
        old_qty = doc.to_dict()["quantity"]
        doc.reference.update({
            "quantity": old_qty + item["quantity"]
        })
    else:
        cart_ref.add(item)
    return JsonResponse({"success": True})

@csrf_exempt
@require_http_methods(["PATCH"])
def api_cart_update(request, cart_id):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    body = json.loads(request.body)
    quantity = int(body.get("quantity", 1))
    db = get_db()
    ref = db.collection("users").document(uid).collection("cart").document(cart_id)

    if quantity <= 0:
        ref.delete()
    else:
        ref.update({"quantity": quantity})

    return JsonResponse({"success": True})

@require_POST
def api_cart_delete(request, cart_id):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    db = get_db()
    db.collection("users") \
        .document(uid) \
        .collection("cart") \
        .document(cart_id) \
        .delete()

    return JsonResponse({"success": True})

@csrf_exempt
@require_POST
def api_cart_delete_batch(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    body = json.loads(request.body or "{}")
    ids = body.get("ids", [])

    db = get_db()
    cart_ref = db.collection("users").document(uid).collection("cart")

    for cart_id in ids:
        cart_ref.document(cart_id).delete()

    return JsonResponse({"success": True})

def api_best_coupon(request):
    uid = get_uid_from_request(request)
    print("🎟️ api_best_coupon UID =", uid)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    db = get_db()
    coupons = db.collection("users").document(uid).collection("coupons") \
        .where("used", "==", False) \
        .stream()

    coupon_list = []
    for doc in coupons:
        print("🎫 found coupon:", doc.id)
        c = doc.to_dict()
        coupon_list.append({
            "id": doc.id,
            "title": c["title"],
            "value": c["value"],
            "minSpend": c["minSpend"]
        })

    return JsonResponse({
        "coupons": coupon_list
    })

@csrf_exempt
@require_POST
def api_checkout_prepare(request):
    uid = get_uid_from_request(request)
    body = json.loads(request.body)
    cart_ids = body.get("cartIds", [])

    db = get_db()
    docs = db.collection("users").document(uid).collection("cart") \
        .where(firestore.FieldPath.document_id(), "in", cart_ids) \
        .stream()

    items = []
    subtotal = 0
    for d in docs:
        item = d.to_dict()
        items.append(item)
        subtotal += item["price"] * item["quantity"]

    request.session["checkout_items"] = items
    request.session["checkout_subtotal"] = subtotal

    return JsonResponse({"success": True})



def api_orders(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    db = get_db()
    docs = (
        db.collection("users")
        .document(uid)
        .collection("orders")
        .order_by("createdAt", direction=firestore.Query.DESCENDING)
        .stream()
    )

    result = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        result.append(data)
    return JsonResponse(result, safe=False)



@csrf_exempt
@require_POST
def api_order_submit(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    body = json.loads(request.body or "{}")
    items = body.get("items", [])
    if not items:
        return JsonResponse({"error": "No items"}, status=400)

    coupon_id = body.get("couponId")
    payment_method = body.get("paymentMethod")
    shipping_info = body.get("shippingInfo")

   
    order_items = []
    subtotal = 0

    for i in items:
        price = int(i.get("price", 0))
        quantity = int(i.get("quantity", 1))
        subtotal += price * quantity

        order_items.append({
            "productId": str(i.get("productId")),
            "productName": i.get("productName"),
            "price": price,
            "quantity": quantity,
            "size": i.get("size"),
            "imageKey": i.get("imageKey"),
        })

    db = get_db()

    
    discount = 0
    coupon_map = None
    coupon_doc = None

    if coupon_id:
        coupon_ref = db.collection("users").document(uid) \
            .collection("coupons").document(coupon_id)
        coupon_doc = coupon_ref.get()

    if coupon_doc and coupon_doc.exists:
        c = coupon_doc.to_dict()

        if not c.get("used", False) and int(c.get("minSpend", 0)) <= subtotal:
            coupon_type = c.get("type")
            value = int(c.get("value", 0))

            if coupon_type == "AMOUNT":
                discount = value

            elif coupon_type == "PERCENT":
                discount = int(subtotal * value / 100)

            
            discount = min(discount, subtotal)

            coupon_map = {
                "id": coupon_id,
                "title": c.get("title"),
                "type": coupon_type,
                "value": value,
            }

            coupon_ref.update({
                "used": True,
                "usedAt": firestore.SERVER_TIMESTAMP
            })


    total = max(subtotal - discount, 0)

   
    order_data = {
        "items": order_items,
        "coupon": coupon_map,
        "discount": discount,
        "paymentMethod": payment_method,
        "shippingInfo": shipping_info,
        "status": "PENDING",
        "total": total,
        "createdAt": int(time.time() * 1000),
    }

    db.collection("users").document(uid).collection("orders").add(order_data)

   
    cart_ref = db.collection("users").document(uid).collection("cart")
    for item in order_items:
        query = (
            cart_ref
            .where("productId", "==", item["productId"])
            .where("size", "==", item.get("size"))
            .stream()
        )
        for doc in query:
            doc.reference.delete()

    return JsonResponse({"success": True})

@csrf_exempt
@require_POST
def api_order_return(request, order_id):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    body = json.loads(request.body or "{}")
    reason = body.get("reason")
    note = body.get("note", "")

    if not reason:
        return JsonResponse({"error": "Missing reason"}, status=400)

    db = get_db()

    order_ref = (
        db.collection("users")
        .document(uid)
        .collection("orders")
        .document(order_id)
    )
    doc = order_ref.get()

    if not doc.exists:
        return JsonResponse({"error": "Order not found"}, status=404)

    order = doc.to_dict()

    
    if order.get("status") not in ["COMPLETED", "PENDING"]:
        return JsonResponse({"error": "Order not returnable"}, status=400)

    order_ref.update({
        "status": "RETURN_REQUESTED",
        "return": {
            "reason": reason,
            "note": note,
            "createdAt": int(time.time() * 1000)
        }
    })

    return JsonResponse({"success": True})


@csrf_exempt
def api_favorites(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    db = get_db()
    docs = (
        db.collection("users")
        .document(uid)
        .collection("favorites")
        .order_by("createdAt", direction=firestore.Query.DESCENDING)
        .stream()
    )

    result = []
    for doc in docs:
        data = doc.to_dict()
        result.append({
            "id": doc.id,                 # productId
            "productId": data.get("productId"),
            "createdAt": data.get("createdAt"),
        })

    return JsonResponse(result, safe=False)
