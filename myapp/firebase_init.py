import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate(
    "shopping-54704-firebase-adminsdk-fbsvc-abdc0effc3.json"
)

firebase_admin.initialize_app(cred)
db = firestore.client()
