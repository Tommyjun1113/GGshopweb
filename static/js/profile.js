const $ = id => document.getElementById(id);

function validateProfile() {
  const name = $("name").value.trim();
  const phone = $("phone").value.trim();
  const birthday = $("birthday").value;
  const gender = $("gender").value;

  if (!name) {
    alert("請輸入使用者名稱");
    $("name").focus();
    return false;
  }

  if (name.length < 2 || name.length > 20) {
    alert("使用者名稱需為 2～20 個字");
    $("name").focus();
    return false;
  }

  if (phone && !/^09\d{8}$/.test(phone)) {
    alert("手機號碼格式錯誤（需為 09xxxxxxxx）");
    $("phone").focus();
    return false;
  }

  if (birthday) {
    const today = new Date().toISOString().split("T")[0];
    if (birthday > today) {
      alert("生日不能是未來日期");
      $("birthday").focus();
      return false;
    }
  }

  if (gender && !["男", "女", "其他"].includes(gender)) {
    alert("性別資料異常");
    return false;
  }

  return true;
}

async function loadProfile() {
  const user = await new Promise(resolve => {
    auth.onAuthStateChanged(u => u && resolve(u));
  });

  const token = await user.getIdToken();

  const res = await fetch("/api/profile/", {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  const data = await res.json();

  $("name").value = data.name || "";
  $("email").value = data.email || "";
  $("phone").value = data.phone || "";
  $("birthday").value = data.birthday || "";
  $("gender").value = data.gender || "";
  $("address").value = data.address || "";
}

async function saveProfile() {
    if (!validateProfile()) return;
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();

    const body = {
        name: $("name").value,
        phone: $("phone").value,
        birthday: $("birthday").value,
        gender: $("gender").value,
        address: $("address").value
    };

    const res = await fetch("/api/profile_update/", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
        },
        body: JSON.stringify(body)
    });

    if (res.ok) {
        const btn = $("saveProfile");
        btn.innerText = "已儲存 ✔";
        setTimeout(() => location.reload(), 800);
    } else {
        alert("更新失敗");
    }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  $("saveProfile").onclick = saveProfile;
  $("deleteAccountBtn").onclick = () => {
    location.href = DELETE_ACCOUNT_URL;
  };
});