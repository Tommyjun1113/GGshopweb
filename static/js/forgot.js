document.addEventListener("DOMContentLoaded", () => {

  // Step 1：送驗證碼
  document.getElementById("forgot-btn")?.addEventListener("click", async () => {
    const email = document.getElementById("forgotAccount").value.trim();
    if (!email) return alert("請輸入 Email");

    const res = await fetch("/api/forgot/send-code/", {
      method: "POST",
      headers: {"Content-Type": "application/json","X-CSRFToken": getCSRFToken(),},
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById("forgotStep1").classList.remove("active");
      document.getElementById("forgotStep2").classList.add("active");
    } else {
      alert(data.message || "寄送失敗");
    }
  });

  // Step 2：驗證碼
  document.getElementById("forgot-confirm-btn")?.addEventListener("click", async () => {
    const email = document.getElementById("forgotAccount").value.trim();
    const code = document.getElementById("forgotCode").value.trim();

    if (!code) {
    alert("請輸入驗證碼");
    return;
    }

    const res = await fetch("/api/forgot/verify-code/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById("forgotStep2").classList.remove("active");
      document.getElementById("resetPasswordBox").classList.add("active");
    } else {
      alert("驗證碼錯誤");
    }
  });

  // Step 3：重設密碼
  document.getElementById("reset-password-btn")?.addEventListener("click", async () => {
    const email = document.getElementById("forgotAccount").value.trim();
    const p1 = document.getElementById("newPwd").value;
    const p2 = document.getElementById("newPwd2").value;

    if (!p1 || !p2) {
        alert("請輸入密碼");
        return;
    }
    if (p1 !== p2) {
        alert("密碼不一致");
        return;
    }

    const res = await fetch("/api/forgot/reset-password/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      },
      body: JSON.stringify({ email, password: p1 }),
    });

    const data = await res.json();
    if (data.success) {
      alert("密碼已重設，請重新登入");
      window.location.reload();
    } else {
      alert("重設失敗");
    }
  });
});