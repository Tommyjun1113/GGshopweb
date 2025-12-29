function getCSRFToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content || "";
}

async function syncDjangoSession(user) {
  const uid = user.uid;
  const key = `djangoLoggedIn_${uid}`;

  
  if (sessionStorage.getItem(key)) return;

  const token = await user.getIdToken();

  const res = await fetch("/api/firebase-login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken(),
    },
    credentials: "include",
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    throw new Error("Django login failed");
  }

  sessionStorage.setItem(key, "1");
}
async function logoutUser() {
  try {
    await firebase.auth().signOut();
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("djangoLoggedIn_")) {
        sessionStorage.removeItem(key);
      }
    });

    await fetch("/logout/", {
      method: "POST",
      headers: {
        "X-CSRFToken": getCSRFToken(),
      },
      credentials: "include",
    });

    
    window.location.replace("/login/");
  } catch (err) {
    console.error("logout error:", err);
    alert("登出失敗，請重新整理再試");
  }
}