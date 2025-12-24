document.getElementById("contactForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const url = "https://script.google.com/macros/s/AKfycbz_3IAKK_qu62IrjNwJgQjCq1p-baaYJCRsCNF-xu_01CZTfcF4SESbUOff6zbjoV2E/exec";
  const formData = new FormData(this);

  fetch(url, {
    method: "POST",
    body: formData
  })
    .then(res => res.text())
    .then(text => {
      if (text === "SUCCESS") {
        document.getElementById("result").innerHTML =
          "✅ 已成功寄出，我們將盡快與您聯繫！";
        document.getElementById("contactForm").reset();
      } else {
        document.getElementById("result").innerHTML =
          "❌ 寄信失敗：後端未回傳 SUCCESS";
      }
    })
    .catch(() => {
      document.getElementById("result").innerHTML =
        "❌ 寄信失敗：請稍後再試~";
    });
});