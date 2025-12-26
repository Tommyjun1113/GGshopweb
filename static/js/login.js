document.addEventListener("DOMContentLoaded", () => {
  const auth = window.auth;
  if (window.location.pathname.includes("/login")) {
    auth.onAuthStateChanged(async (user) => {
    if (!user) return;

    try {
      await syncDjangoSession(user);
      window.location.replace("https://ggshopweb.onrender.com/GGshopping/");
   } catch (err) {
     console.error("sync login error", err);
    }
  });
}

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
