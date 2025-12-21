from django.shortcuts import render , redirect
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.http import require_http_methods
import json
import random
import requests
import firebase_admin
from .firebase_init import db
from .auth_utils import get_uid_from_request
from django.views.decorators.csrf import csrf_exempt
from firebase_admin import credentials,auth as firebase_auth,firestore
from django.contrib.auth import login
from django.contrib.auth.models import User

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

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
@csrf_exempt
def firebase_login(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Invalid method"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8"))
        token = body.get("token")
        if not token:
            return JsonResponse({"success": False, "message": "No token"}, status=400)

        # 🔥 驗證 Firebase Token
        decoded = firebase_auth.verify_id_token(token)

        uid = decoded["uid"]
        email = decoded.get("email", f"{uid}@firebase.local")

        # 🔑 建立或取得 Django User
        user, _ = User.objects.get_or_create(
            username=uid,
            defaults={"email": email}
        )

        # ✅ 建立 Django session
        login(request, user)
        print("✅ Django login success:", user.username)
        return JsonResponse({"success": True})

    except Exception as e:
        print("🔥 firebase_login error:", e)
        return JsonResponse(
            {"success": False, "message": str(e)},
            status=400
        )
# ================= LINE Login =================
LINE_CHANNEL_ID = 2008634753
LINE_CHANNEL_SECRET = "d417d86ac49cc7f482035a82ccc4a18d"
LINE_REDIRECT_URI = "http://127.0.0.1:8000/api/auth/line/callback/"    # https://ggshopweb.onrender.com/api/auth/line/callback/

def line_login(request):
    line_auth_url = (
        "https://access.line.me/oauth2/v2.1/authorize"
        f"?response_type=code"
        f"&client_id={LINE_CHANNEL_ID}"
        f"&redirect_uri={LINE_REDIRECT_URI}"
        f"&scope=profile%20openid%20email"
        f"&state=12345"
    )
    return redirect(line_auth_url)

def line_callback(request):
    code = request.GET.get("code")
    if not code:
        return JsonResponse({"success": False, "error": "no code"})

    # 1️⃣ 換 access token
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
    if not access_token:
        return JsonResponse({"success": False, "error": "token failed"})

    # 2️⃣ 取得使用者資料
    profile = requests.get(
        "https://api.line.me/v2/profile",
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()

    line_user_id = profile.get("userId")
    display_name = profile.get("displayName")
    picture_url = profile.get("pictureUrl")

    if not line_user_id:
        return JsonResponse({"success": False})

    uid = f"line:{line_user_id}"

    # 3️⃣ 建立 Firebase 使用者（如果不存在）
    try:
        firebase_auth.get_user(uid)
    except:
        firebase_auth.create_user(
            uid=uid,
            display_name=display_name,
            photo_url = picture_url
        ),
    db.collection("users").document(uid).set({
        "uid" : uid,
        "name" : display_name,
        "provider" : "line",
        "photo" : picture_url,
        "createdAt" : firestore.SERVER_TIMESTAMP,
    }, merge=True)
    # 4️⃣ 建立 Firebase Custom Token
    custom_token = firebase_auth.create_custom_token(uid)

    # 5️⃣ 回傳 token 給前端
    return render(request, "line_callback.html", {
        "firebase_token": custom_token.decode()
    })
def api_profile(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        return JsonResponse({"error": "User not found"}, status=404)

    return JsonResponse(doc.to_dict())


@require_POST
def api_profile_update(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    body = json.loads(request.body)

    db.collection("users").document(uid).set(body, merge=True)
    return JsonResponse({"success": True})
@csrf_exempt
def api_forgot_send_code(request):
    if request.method != "POST":
        return JsonResponse({"success": False}, status=405)
    
    body = json.loads(request.body)
    email = body.get("email")

    if not email:
        return JsonResponse({"success": False, "message": "缺少 Email"})

    users = list(db.collection("users").where("email", "==", email).stream())
    if not users:
        return JsonResponse({"success": False, "message": "Email 不存在"})

    code = str(random.randint(100000, 999999))
    users[0].reference.update({"resetCode": code})

    # 🔥 呼叫 Firebase Cloud Function（sendResetCode）
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

    users = list(db.collection("users").where("email", "==", email).stream())
    if users:
        users[0].reference.update({"resetCode": ""})

    return JsonResponse({"success": True})
# 購物車頁面
def cart_page(request):
    return render(request,"cart.html")

def api_cart(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    docs = (
        db.collection("users")
        .document(uid)
        .collection("cart")
        .stream()
    )

    return JsonResponse(
        [{**doc.to_dict(), "id": doc.id} for doc in docs],
        safe=False
    )


@require_POST
def api_cart_add(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

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

@require_http_methods(["PATCH"])
def api_cart_update(request, cart_id):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    body = json.loads(request.body)
    quantity = int(body.get("quantity", 1))

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

    db.collection("users") \
        .document(uid) \
        .collection("cart") \
        .document(cart_id) \
        .delete()

    return JsonResponse({"success": True})
def api_best_coupon(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

   
    cart_docs = db.collection("users").document(uid).collection("cart").stream()
    total = sum(d.to_dict()["price"] * d.to_dict()["quantity"] for d in cart_docs)

    coupons = db.collection("users").document(uid).collection("coupons") \
        .where("used", "==", False) \
        .stream()

    best = None
    for doc in coupons:
        c = doc.to_dict()
        if c["minSpend"] <= total:
            if not best or c["value"] > best["value"]:
                best = {**c, "id": doc.id}

    return JsonResponse({
        "cartTotal": total,
        "bestCoupon": best
    })
def checkout(request):
    return render("/checkout.html/")
@require_POST
def api_order_submit(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    body = json.loads(request.body or "{}")
    coupon_id = body.get("couponId")

    cart_ref = db.collection("users").document(uid).collection("cart")
    cart_docs = list(cart_ref.stream())

    if not cart_docs:
        return JsonResponse({"error": "Cart empty"}, status=400)

    items = []
    subtotal = 0

    for doc in cart_docs:
        item = doc.to_dict()
        items.append(item)
        subtotal += item["price"] * item["quantity"]

   
    discount = 0
    coupon_data = None

    if coupon_id:
        coupon_ref = (
            db.collection("users")
            .document(uid)
            .collection("coupons")
            .document(coupon_id)
        )
        coupon_doc = coupon_ref.get()

        if coupon_doc.exists:
            coupon = coupon_doc.to_dict()

            if (
                not coupon.get("used", False)
                and coupon["minSpend"] <= subtotal
            ):
                discount = coupon["value"]
                coupon_data = {
                    "couponId": coupon_id,
                    "couponTitle": coupon["title"],
                    "discount": discount
                }

                coupon_ref.update({
                    "used": True,
                    "usedAt": firestore.SERVER_TIMESTAMP
                })

    total = max(subtotal - discount, 0)

  
    db.collection("orders").add({
        "uid": uid,
        "items": items,
        "subtotal": subtotal,
        "discount": discount,
        "total": total,
        "coupon": coupon_data,
        "paymentMethod": "WEB",
        "createdAt": firestore.SERVER_TIMESTAMP
    })

    
    for doc in cart_docs:
        doc.reference.delete()

    return JsonResponse({"success": True})



def api_orders(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    docs = db.collection("orders").where("uid", "==", uid).stream()
    return JsonResponse([doc.to_dict() for doc in docs], safe=False)
