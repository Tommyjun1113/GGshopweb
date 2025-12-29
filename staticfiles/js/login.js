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

  document.getElementById("email-login-btn")?.addEventListener("click", async () => {
  const accountInput = document.querySelector("input[name='account']");
  const passwordInput = document.querySelector("input[name='password']");

  const email = accountInput.value.trim();
  const password = passwordInput.value;

  
  hideError("login-error");
  accountInput.classList.remove("input-error");
  passwordInput.classList.remove("input-error");

  
  if (!email || !password) {
    showError("login-error", "請輸入帳號與密碼");
    if (!email) accountInput.classList.add("input-error");
    if (!password) passwordInput.classList.add("input-error");
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (e) {
    console.error(e);

    const msg = firebaseErrorToMessage(e);
    showError("login-error", msg);

    
    accountInput.classList.add("input-error");
    passwordInput.classList.add("input-error");
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