from firebase_admin import auth

def get_uid_from_request(request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    id_token = auth_header.split("Bearer ")[1]

    try:
        decoded = auth.verify_id_token(id_token)
        return decoded["uid"]
    except Exception:
        return None
