import os
import firebase_admin
from firebase_admin import credentials, firestore

_db = None
def init_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate("shopping-54704-firebase-adminsdk-fbsvc-abdc0effc3.json") 
        firebase_admin.initialize_app(cred)
def get_db():
    global _db
    if _db:
        return _db

    if not firebase_admin._apps:
        if os.getenv("RENDER"):
            
            cred = credentials.Certificate("/etc/secrets/firebase.json")
        else:
            # 本機：請確定這個檔案真的存在 #shopping-54704-firebase-adminsdk-fbsvc-45a36d8480.json
            cred = credentials.Certificate(
                "shopping-54704-firebase-adminsdk-fbsvc-abdc0effc3.json" 
            )

        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    return _db
