import os
import firebase_admin
from firebase_admin import credentials, firestore

if not firebase_admin._apps:
    if os.getenv("RENDER"):  
        # Render 環境
        cred = credentials.Certificate("/etc/secrets/firebase.json")
    else:
        # 本機開發環境
        cred = credentials.Certificate("shopping-54704-firebase-adminsdk-fbsvc-abdc0effc3.json")

    firebase_admin.initialize_app(cred)

db = firestore.client()
