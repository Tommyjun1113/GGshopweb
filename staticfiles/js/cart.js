let authToken = null;
let cartItems = [];
let selectedIds = new Set();
let availableCoupons = [];
let selectedCoupon = null;
let selectedCouponId = null;
let userWantsCoupon = false;


function waitForAuth() {
  return new Promise(resolve => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user) {
        unsub();
        resolve(user);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await waitForAuth();
  authToken = await user.getIdToken();
  await loadCart();
});


async function loadCart() {
  const res = await fetch("/api/cart/", {
    headers: { Authorization: "Bearer " + authToken }
  });

  cartItems = await res.json();

  if (!cartItems.length) {
    document.getElementById("cart-empty").style.display = "block";
    document.getElementById("cart-container").innerHTML = "";
    selectedIds.clear();
    recalc();
    updateActionState();
    return;
  }

  selectedIds.clear();
  document.getElementById("selectAll").checked = false;

  renderCart();
  await loadBestCoupon();
  recalc();
  updateActionState();
}



function renderCart() {
  const container = document.getElementById("cart-container");
  container.innerHTML = "";

  cartItems.forEach(item => {
    const itemId = String(item.id); 
    const subtotal = item.price * item.quantity;

    container.innerHTML += `
      <div class="cart-item">
        <input type="checkbox"
          class="cart-check"
          data-id="${itemId}"
          ${selectedIds.has(itemId) ? "checked" : ""}
        >

        <div class="cart-img">
          <img src="/static/products/${item.imageKey}.png">
        </div>

        <div class="cart-body">
          <div class="cart-info">
            <div class="cart-name">${item.productName}</div>
            <div class="cart-size">尺寸：${item.size}</div>
          </div>

          <div class="cart-meta">
            <div class="meta-row">
              <span>單價 :</span><span>NT$ ${item.price}</span>
            </div>

            <div class="meta-row">
              <span>數量 :</span>
              <div class="qty-control">
                <button class="qty-btn" data-id="${itemId}" data-action="minus">−</button>
                <span class="qty-num">${item.quantity}</span>
                <button class="qty-btn" data-id="${itemId}" data-action="plus">＋</button>
              </div>
            </div>

            <div class="meta-row meta-strong">
              <span>小計 :</span><span>NT$ ${subtotal}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}
async function loadBestCoupon() {
  const res = await fetch("/api/coupons/best", {
    headers: { Authorization: "Bearer " + authToken }
  });

  if (!res.ok) return;
  const data = await res.json();

  availableCoupons = (data.coupons || []).map(c => {
    let type = String(c.type || "").toUpperCase();

    
    if (!type) {
      if (c.value < 100) {
        type = "PERCENT";   
      } else {
        type = "AMOUNT";   
      }
    }

    return {
      ...c,
      type,
      minSpend: Number(c.minSpend),
      value: Number(c.value)
    };
  });

  console.log("normalized coupons:", availableCoupons);
}



document.addEventListener("change", e => {
  if (e.target.classList.contains("cart-check")) {
    const id = String(e.target.dataset.id);
    e.target.checked ? selectedIds.add(id) : selectedIds.delete(id);
    syncSelectAll();
    recalc();
    updateActionState();
  }

  if (e.target.id === "selectAll") {
    selectedIds.clear();
    document.querySelectorAll(".cart-check").forEach(cb => {
      cb.checked = e.target.checked;
      if (e.target.checked) selectedIds.add(String(cb.dataset.id));
    });
    recalc();
    updateActionState();
  }
  if (e.target.name === "coupon") {
    selectedCouponId = e.target.value;
    userWantsCoupon = true; 
    document.getElementById("useCoupon").checked = true;
    recalc();
  }
  if (e.target.id === "useCoupon") {
    userWantsCoupon = e.target.checked;
    recalc();
  }
});

function syncSelectAll() {
  const all = document.querySelectorAll(".cart-check").length;
  document.getElementById("selectAll").checked = (all > 0 && selectedIds.size === all);
}


document.addEventListener("click", async e => {
  if (!e.target.classList.contains("qty-btn")) return;

  const id = String(e.target.dataset.id);
  const action = e.target.dataset.action;

  const item = cartItems.find(i => String(i.id) === id);
  if (!item) return;

  const newQty = action === "plus"
    ? item.quantity + 1
    : item.quantity - 1;

  if (newQty < 1) return;

  await fetch(`/api/cart/update/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + authToken
    },
    body: JSON.stringify({ quantity: newQty })
  });

  item.quantity = newQty;
  renderCart();
  recalc();
  if (typeof updateCartBadge === "function") {
    updateCartBadge();
  }
});
function updateActionState() {
  const canAction = selectedIds.size > 0;
  document.getElementById("checkoutBtn").disabled = !canAction;
  document.getElementById("deleteSelected").disabled = !canAction;
}



function calcDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (coupon.type === "PERCENT") {
    return Math.floor(subtotal * coupon.value / 100);
  }
  if (coupon.type === "AMOUNT") {
    return Math.min(coupon.value, subtotal);
  }
  return 0;
}
function recalc() {
  const couponRow = document.getElementById("coupon-row");
  const discountEl = document.getElementById("cart-discount");
  const finalTotalEl = document.getElementById("cart-final-total");
  const couponText = document.getElementById("coupon-text");
  const couponHintEl = document.getElementById("coupon-hint");
  const useCouponCheckbox = document.getElementById("useCoupon");

  console.log("========== RECALC START ==========");
  console.log("selectedIds:", [...selectedIds]);
  console.log("cartItems:", cartItems);
  console.log("availableCoupons:", availableCoupons);
  console.log("selectedCouponId:", selectedCouponId);
  console.log("userWantsCoupon (before):", userWantsCoupon);
  if (selectedIds.size === 0) {
    document.getElementById("cart-subtotal").innerText = "NT$ 0";
    discountEl.innerText = "NT$ 0";
    finalTotalEl.innerText = "NT$ 0";

    couponRow.style.display = "none";
    couponHintEl.style.display = "none";
    useCouponCheckbox.checked = false;
    useCouponCheckbox.disabled = true;

    selectedCoupon = null;
    selectedCouponId = null;
    userWantsCoupon = false;

    return;
  }
  let subtotal = 0;
  cartItems.forEach(item => {
    const itemId = String(item.id);
    if (selectedIds.has(itemId)) {
      subtotal += item.price * item.quantity;
    }
  });

  document.getElementById("cart-subtotal").innerText = `NT$ ${subtotal}`;

  console.log("subtotal:", subtotal);

  const usableCoupons = availableCoupons.filter(c => subtotal >= c.minSpend);

  console.log("usableCoupons:", usableCoupons);

  const couponListEl = document.getElementById("coupon-list");
  couponListEl.innerHTML = "";

  if (selectedCouponId && !usableCoupons.some(c => c.id === selectedCouponId)) {
    selectedCouponId = null;
  }

  if (usableCoupons.length && !selectedCouponId) {
    const bestCoupon = usableCoupons.reduce((best, c) =>
    calcDiscount(c, subtotal) > calcDiscount(best, subtotal) ? c : best
  );

  selectedCouponId = bestCoupon.id;

  
  userWantsCoupon = true;
  document.getElementById("useCoupon").checked = true;
}

    usableCoupons.forEach(c => {
    couponListEl.innerHTML += `
      <label class="coupon-item">
        <input type="radio" name="coupon" value="${c.id}" ${c.id === selectedCouponId ? "checked" : ""}>
        ${c.title} ${
          c.type === "PERCENT"
            ? `（${c.value}% OFF）`
            : `（折 NT$ ${c.value}）`
        }
      </label>
    `;
  });
  selectedCoupon = usableCoupons.find(c => c.id === selectedCouponId) || null;

  console.log("selectedCoupon:", selectedCoupon);


  const nextCoupon = availableCoupons
    .filter(c => subtotal < c.minSpend)
    .sort((a, b) => a.minSpend - b.minSpend)[0];

  if (!usableCoupons.length && nextCoupon) {
    const diff = nextCoupon.minSpend - subtotal;
    couponHintEl.style.display = "block";
    couponHintEl.innerText = `再消費 NT$ ${diff} 即可使用「${nextCoupon.title}」`;
  } else {
    couponHintEl.style.display = "none";
  }
  const wantsCoupon = userWantsCoupon;

  let total = subtotal;
  let discount = 0;
  if (!selectedCoupon) {
    couponRow.style.display = "none";
    discountEl.innerText = "NT$ 0";
    useCouponCheckbox.checked = false;
    useCouponCheckbox.disabled = true;
  } else {
    couponRow.style.display = "block";
    useCouponCheckbox.disabled = false;

    couponText.innerText =
      selectedCoupon.type === "PERCENT"
        ? `已為你套用優惠券：${selectedCoupon.title}（${selectedCoupon.value}% OFF）`
        : `已為你套用優惠券：${selectedCoupon.title}`;


    console.log(">>> BEFORE DISCOUNT");
    console.log("userWantsCoupon (final):", userWantsCoupon);
    console.log("selectedCoupon at discount time:", selectedCoupon);

    if (wantsCoupon && selectedCoupon) {
      discount = calcDiscount(selectedCoupon, subtotal);
      discountEl.innerText = `NT$ ${discount}`;
      total = subtotal - discount;
    } else {
      discountEl.innerText = "NT$ 0";
      total = subtotal;
    }
  }

  document.getElementById("cart-final-total").innerText = `NT$ ${Math.max(total, 0)}`;
}


document.getElementById("deleteSelected").onclick = async () => {
  if (!selectedIds.size) return;

  if (!confirm("確定要刪除選取的商品嗎？")) return;

  await fetch("/api/cart/delete-batch/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + authToken
    },
    body: JSON.stringify({ ids: [...selectedIds] })
  });
  selectedIds.clear();
  selectedCoupon = null;
  selectedCouponId = null;
  userWantsCoupon = false
  document.getElementById("selectAll").checked = false;
  await loadCart(); 

  if (typeof updateCartBadge === "function") {
  updateCartBadge();
}  
};

document.getElementById("checkoutBtn").onclick = () => {
  if (!selectedIds.size) {
    alert("請先選擇商品");
    return;
  }

  const checkoutItems = cartItems.filter(item =>
    selectedIds.has(String(item.id))
  );

  sessionStorage.setItem(
    "checkoutItems",
    JSON.stringify(checkoutItems)
  );
  sessionStorage.setItem(
  "checkoutCoupon",
  JSON.stringify(
    userWantsCoupon ? selectedCoupon : null)
  );
  window.location.href = "/checkout/";
};
