document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("register-btn")?.addEventListener("click", async () => {
    const email = document.getElementById("regEmail").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const pwd1 = document.querySelector("#registerStep2 input[name='password']").value;
    const pwd2 = document.querySelector("#registerStep2 input[name='password2']").value;

    if (!email || !phone || !pwd1 || !pwd2) {
      alert("請填寫完整資料");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Email 格式不正確");
      return;
    }
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(phone)) {
      alert("手機號碼格式錯誤（需為 09 開頭共 10 碼）");
      return;
    }
    if (pwd1.length < 6) {
      alert("密碼至少需要 6 碼");
      return;
    }
    if (pwd1 !== pwd2) {
      alert("兩次輸入的密碼不一致");
      return;
    }

    try {
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, pwd1);
      const user = cred.user;

      await firebase.firestore()
        .collection("users")
        .doc(user.uid)
        .set({
        uid: user.uid,
        email: email,
        name: "",
        phone: phone,
        address: "",
        birthday: "",
        gender: "",
        provider: "password",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      window.location.href = "/GGshopping/";
    } catch (e) {
      let msg = "註冊失敗";
      if (e.code === "auth/email-already-in-use") msg = "此 Email 已被註冊";
      if (e.code === "auth/invalid-email") msg = "Email 格式錯誤";
      if (e.code === "auth/weak-password") msg = "密碼強度不足（至少 6 碼）";
      alert(msg);
    }
  });
});