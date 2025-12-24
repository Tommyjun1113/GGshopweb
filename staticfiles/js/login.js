document.addEventListener("DOMContentLoaded", () => {
  const auth = window.auth;

  auth.onAuthStateChanged(async (user) => {
    if (!user) return;

    const token = await user.getIdToken();
    const res = await fetch("/api/firebase-login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();
    if (data.success) {
      window.location.replace("/GGshopping/");
    }
  });

  // Email 登入
  document.getElementById("email-login-btn")?.addEventListener("click", async () => {
    const email = document.querySelector("input[name='account']").value.trim();
    const password = document.querySelector("input[name='password']").value;

    if (!email || !password) {
      alert("請輸入帳號密碼");
      return;
    }

    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (e) {
      alert(e.message);
    }
  });

  // Google
  document.getElementById("google-login-btn")?.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
  });

  // LINE
  document.querySelector(".social-btn.line")?.addEventListener("click", () => {
    window.location.href = "/api/auth/line/login/";
  });
});
