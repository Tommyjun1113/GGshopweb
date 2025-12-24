const checkboxes = document.querySelectorAll(".confirm-check");
const deleteBtn = document.getElementById("confirmDeleteBtn");

checkboxes.forEach(cb => {
  cb.addEventListener("change", () => {
    deleteBtn.disabled = ![...checkboxes].every(c => c.checked);
  });
});

deleteBtn.addEventListener("click", async () => {
  if (!confirm("最後確認：真的要刪除帳戶？")) return;

  const user = auth.currentUser;
  if (!user) {
    alert("尚未登入");
    return;
  }

  const token = await user.getIdToken();

  const res = await fetch("/api/account/delete/", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token
    }
  });

  const data = await res.json();

  if (data.success) {
    await auth.signOut();
    alert("帳戶已永久刪除");
    location.href = "/";
  } else {
    alert("刪除失敗");
  }
});