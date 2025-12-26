function getCSRFToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content || "";
}
async function syncDjangoSession(user) {
  
  if (sessionStorage.getItem("djangoLoggedIn")) return;

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

  sessionStorage.setItem("djangoLoggedIn", "1");
}
