from firebase_admin import auth as firebase_auth
from .firebase_init import init_firebase

def get_uid_from_request(request):
    try:
        init_firebase()

        # ✅ Django 正確取得 Authorization 的方式
        auth_header = request.META.get("HTTP_AUTHORIZATION")

        if not auth_header:
            print("❌ No Authorization header")
            return None

        if not auth_header.startswith("Bearer "):
            print("❌ Invalid Authorization header:", auth_header)
            return None

        token = auth_header.split("Bearer ")[1]

        decoded = firebase_auth.verify_id_token(
            token,
            clock_skew_seconds=10  # ✅ Render 必加
        )

        return decoded.get("uid")

    except Exception as e:
        print("❌ get_uid_from_request error:", e)
        return None
