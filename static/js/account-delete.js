document.addEventListener("DOMContentLoaded", () => {
  const checkboxes = document.querySelectorAll(".confirm-check");
  const deleteBtn = document.getElementById("confirmDeleteBtn");

  
  console.log("checkboxes:", checkboxes.length);
  console.log("deleteBtn:", deleteBtn);

  checkboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      deleteBtn.disabled = ![...checkboxes].every(c => c.checked);
    });
  });

  deleteBtn.addEventListener("click", async () => {
    if (!confirm("最後確認：真的要永久刪除帳戶嗎？")) return;

    const user = auth.currentUser;
    if (!user) {
      alert("尚未登入");
      location.href = "https://ggshopweb.onrender.com/login/";
      return;
    }

    try {
      const token = await user.getIdToken(true);

      const res = await fetch("/api/account/delete/", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token
        }
      });

      const data = await res.json();
      if (!data.success) throw new Error("Backend delete failed");

      await user.delete();

      alert("帳戶已永久刪除");
      location.href = "/";

    } catch (err) {
      console.error(err);

      if (err.code === "auth/requires-recent-login") {
        alert("請重新登入後再刪除帳戶");
        location.href = "https://ggshopweb.onrender.com/login/";
      } else {
        alert("刪除失敗，請稍後再試");
      }
    }
  });
});
