document.addEventListener("DOMContentLoaded", () => {
  const auth = window.auth;

   auth.onAuthStateChanged(async (user) => {
    if (!user) return;

    try {
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
        window.location.replace("https://ggshopweb.onrender.com/GGshopping/");
      } else {
        alert("登入失敗，請稍後再試");
      }
    } catch (err) {
      console.error("firebase-login error", err);
      alert("登入發生錯誤");
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

  
  document.getElementById("google-login-btn")?.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
  });

  
  document.querySelector(".social-btn.line")?.addEventListener("click", () => {
    window.location.href = "/api/auth/line/login/";
  });
});
