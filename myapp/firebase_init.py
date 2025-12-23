import os
import firebase_admin
from firebase_admin import credentials, firestore

_db = None
def init_firebase():
    if not firebase_admin._apps:
<<<<<<< HEAD
        cred = credentials.Certificate("shopping-54704-firebase-adminsdk-fbsvc-45a36d8480.json")
=======
        cred = credentials.Certificate("shopping-54704-firebase-adminsdk-fbsvc-abdc0effc3.json") #shopping-54704-firebase-adminsdk-fbsvc-45a36d8480.json
>>>>>>> 23ed7dc3155447bd64d6dc0e7dcf7860ea3e3f53
        firebase_admin.initialize_app(cred)
def get_db():
    global _db
    if _db:
        return _db

    if not firebase_admin._apps:
        if os.getenv("RENDER"):
            # Render：用 Secret File
            cred = credentials.Certificate("/etc/secrets/firebase.json")
        else:
            # 本機：請確定這個檔案真的存在
            cred = credentials.Certificate(
<<<<<<< HEAD
                "shopping-54704-firebase-adminsdk-fbsvc-45a36d8480.json"
=======
                "shopping-54704-firebase-adminsdk-fbsvc-abdc0effc3.json" ##shopping-54704-firebase-adminsdk-fbsvc-45a36d8480.json
>>>>>>> 23ed7dc3155447bd64d6dc0e7dcf7860ea3e3f53
            )

        firebase_admin.initialize_app(cred)

    _db = firestore.client()
<<<<<<< HEAD
    return _db
=======
    return _db
>>>>>>> 23ed7dc3155447bd64d6dc0e7dcf7860ea3e3f53
