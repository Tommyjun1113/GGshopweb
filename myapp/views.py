from django.shortcuts import render , redirect
from django.http import JsonResponse
from django.views.decorators.http import require_POST
import json
import random
import requests
from firebase_admin import firestore
from .firebase_init import db
from .auth_utils import get_uid_from_request
from django.views.decorators.csrf import csrf_exempt
from firebase_admin import auth as firebase_auth
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

def line_login(request):
    # 這裡你應該已經拿到 LINE userId / email
    line_user_id = "LINE_USER_ID"
    email = "line_user@email.com"

    uid = f"line:{line_user_id}"

    try:
        firebase_auth.get_user(uid)
    except:
        firebase_auth.create_user(uid=uid, email=email)

    token = firebase_auth.create_custom_token(uid)

    return redirect(f"/login/line/callback/?token={token.decode()}")

def line_callback(request):
    return render(request, "line_callback.html")
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

    db.collection("users").document(uid).collection("cart").add(item)
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




@require_POST
def api_order_submit(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    cart_ref = db.collection("users").document(uid).collection("cart")
    cart_docs = cart_ref.stream()

    items = []
    total = 0

    for doc in cart_docs:
        item = doc.to_dict()
        items.append(item)
        total += item["price"] * item["quantity"]

    if not items:
        return JsonResponse({"error": "Cart empty"}, status=400)

    db.collection("orders").add({
        "uid": uid,
        "items": items,
        "total": total,
        "createdAt": firestore.SERVER_TIMESTAMP
    })

   
    for doc in cart_ref.stream():
        doc.reference.delete()

    return JsonResponse({"success": True})


def api_orders(request):
    uid = get_uid_from_request(request)
    if not uid:
        return JsonResponse({"error": "Unauthorized"}, status=401)

    docs = db.collection("orders").where("uid", "==", uid).stream()
    return JsonResponse([doc.to_dict() for doc in docs], safe=False)
