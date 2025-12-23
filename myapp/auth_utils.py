from firebase_admin import auth as firebase_auth
from .firebase_init import init_firebase

def get_uid_from_request(request):
    try:

        init_firebase()

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        token = auth_header.replace("Bearer ", "")
        decoded = firebase_auth.verify_id_token(token,clock_skew_seconds=5)
        return decoded.get("uid")

    except Exception as e:
        print("❌ get_uid_from_request error:", e)
        return None
