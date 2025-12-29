let authToken = null;
let checkoutItems = [];
let subtotal = 0;
let discount = 0;
let total = 0;
let selectedCoupon = null;


auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "/login/";
    return;
  }

  authToken = await user.getIdToken();
  loadCheckoutItems(); 
  loadCouponFromCart();     
  updateTotal(); 
  renderPaymentForm();
});


function loadCheckoutItems() {
  const raw = sessionStorage.getItem("checkoutItems");

  if (!raw) {
    alert("沒有選擇任何商品");
    window.location.href = "/cart/";
    return;
  }

  checkoutItems = JSON.parse(raw);

  if (!checkoutItems.length) {
    alert("沒有選擇任何商品");
    window.location.href = "/cart/";
    return;
  }

  renderItems();
}


function renderItems() {
  const container = document.getElementById("order-items");
  container.innerHTML = "";
  subtotal = 0;

  checkoutItems.forEach(item => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 1;
    const itemSubtotal = item.price * item.quantity;
    subtotal += itemSubtotal;

    const productName = item.productName || "未命名商品";
    const size = item.size || "-";
    const imageKey = item.imageKey
      ? `/static/products/${item.imageKey}.png`
      : `/static/products/GGicon.png`;

    container.innerHTML += `
     <div class="order-item">
        <img
          src="/static/products/${item.imageKey}.png"
          class="order-img"
          alt="${item.productName}"
        >
        <div class="order-info">
          <div class="order-name">${item.productName}</div>
          <div>尺寸：${item.size}</div>
          <div>數量：${item.quantity}</div>
          <div>NT$ ${itemSubtotal}</div>
        </div>
      </div>
    `;
  });

  document.getElementById("subtotal").innerText = `NT$ ${subtotal}`;
  updateTotal();
}


function loadCouponFromCart() {
  const raw = sessionStorage.getItem("checkoutCoupon");
  if (!raw) return;

  selectedCoupon = JSON.parse(raw);
  if (!selectedCoupon) return;

  
  if (selectedCoupon.type === "PERCENT") {
    discount = Math.floor(subtotal * selectedCoupon.value / 100);
  } else if (selectedCoupon.type === "AMOUNT") {
    discount = Math.min(selectedCoupon.value, subtotal);
  } else {
    discount = 0;
  }

  if (discount > 0) {
    document.getElementById("discount-row").style.display = "block";
    document.getElementById("discount").innerText = `${selectedCoupon.title} - NT$ ${discount}`;
  } else {
    document.getElementById("discount-row").style.display = "none";
  }

  updateTotal();
}



function updateTotal() {
  total = Math.max(subtotal - discount, 0);
  document.getElementById("total").innerText = `NT$ ${total}`;
}


document.querySelectorAll("input[name='payment']").forEach(radio => {
  radio.addEventListener("change", renderPaymentForm);
});

function renderPaymentForm() {
  const method = document.querySelector("input[name='payment']:checked").value;
  const container = document.getElementById("payment-form");

  if (method === "貨到付款") {
    container.innerHTML = `
      <h3>收件資訊</h3>
      <input id="receiverName" placeholder="姓名">
      <small class="error" id="err-name"></small>

      <input id="receiverPhone" placeholder="手機號碼">
      <small class="error" id="err-phone"></small>

      <input id="receiverAddress" placeholder="地址">
      <small class="error" id="err-address"></small>
    `;
  }

  if (method === "信用卡") {
    container.innerHTML = `
      <h3>信用卡（模擬）</h3>
      <input id="cardNumber" placeholder="卡號 16 碼">
      <small class="error" id="err-card"></small>

      <input id="cardExpire" placeholder="MM/YY">
      <small class="error" id="err-expire"></small>

      <input id="cardCVC" placeholder="CVC">
      <small class="error" id="err-cvc"></small>
    `;
  }

  if (method === "LINEPAY") {
    container.innerHTML = `<p>將導向 LINE Pay（模擬）</p>`;
  }
}

document.addEventListener("input", e => {
  if (e.target.id === "receiverPhone")
    e.target.value = e.target.value.replace(/\D/g,"").slice(0,10);

  if (e.target.id === "cardNumber")
    e.target.value = e.target.value.replace(/\D/g,"").slice(0,16);

  if (e.target.id === "cardCVC")
    e.target.value = e.target.value.replace(/\D/g,"").slice(0,3);
});
function validateOrder(method) {
  let ok = true;
  document.querySelectorAll(".error").forEach(e => e.innerText = "");

  const err = (id,msg) => { document.getElementById(id).innerText = msg; ok = false; };

  if (method === "貨到付款") {
    if (receiverName.value.trim().length < 2) err("err-name","姓名至少 2 字");
    if (!/^09\d{8}$/.test(receiverPhone.value)) err("err-phone","手機格式錯誤");
    if (receiverAddress.value.trim().length < 6) err("err-address","地址過短");
  }

  if (method === "信用卡") {
    if (!/^\d{16}$/.test(cardNumber.value)) err("err-card","卡號需 16 碼");
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpire.value)) err("err-expire","格式 MM/YY");
    if (!/^\d{3}$/.test(cardCVC.value)) err("err-cvc","CVC 3 碼");
  }

  return ok;
}

document.getElementById("submitOrder").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("登入已失效，請重新登入");
    location.href = "/login/";
    return;
  }

  
  const authToken = await user.getIdToken();
  const paymentMethod = document.querySelector("input[name='payment']:checked").value;
if (!validateOrder(paymentMethod)) return;

  const payload = {
    items: checkoutItems,
    couponId: selectedCoupon?.id || null,
    paymentMethod: paymentMethod
  };

  if (paymentMethod === "貨到付款") {
    const receiverName = document.getElementById("receiverName");
    const receiverPhone = document.getElementById("receiverPhone");
    const receiverAddress = document.getElementById("receiverAddress");
    payload.shippingInfo = {
      name: receiverName.value,
      phone: receiverPhone.value,
      address: receiverAddress.value
    };
  }

  if (paymentMethod === "信用卡") {
    const cardNumber = document.getElementById("cardNumber");
    const cardExpire = document.getElementById("cardExpire");
    const cardCVC = document.getElementById("cardCVC");
    payload.paymentInfo = {
      cardNumber: cardNumber.value,
      expire: cardExpire.value,
      cvc: cardCVC.value
    };
  }

  const res = await fetch("/api/order/submit/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + authToken
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.success) {
    sessionStorage.removeItem("checkoutItems");
    location.href = "/order_success/";
  } else {
    alert("下單失敗");
  }
});