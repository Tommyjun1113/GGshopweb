document.addEventListener("DOMContentLoaded", function () {

  function getCSRFToken() {
  return document.querySelector('meta[name="csrf-token"]').getAttribute('content');
}

  // =============================
  // 取得 SKU & 商品
  // =============================
  const sku = new URLSearchParams(window.location.search).get("sku");
  const allProducts = window.productsData;

  const product = allProducts.find(p => p.sku === sku);

  if (!product) {
    document.querySelector(".main-wrapper").innerHTML =
      "<h2 style='padding:40px;'>找不到商品資料</h2>";
    return;
  }

  // =============================
  // 基本商品資訊
  // =============================
  document.querySelector(".title").textContent = product.title;
  document.querySelector(".new-price").textContent = "NT$" + product.price;

  const mainImage = document.getElementById("mainImage");
  mainImage.src = product.images[0];

  // =============================
  // 縮圖
  // =============================
  const thumbList = document.querySelector(".thumb-list");
  thumbList.innerHTML = "";

  product.images.forEach(img => {
    thumbList.insertAdjacentHTML(
      "beforeend",
      `
      <div class="thumb-item">
        <img src="${img}" onclick="changeImage('${img}')">
      </div>
      `
    );
  });

  window.changeImage = function (src) {
    mainImage.src = src;
  };

  // =============================
  // 商品描述（重點）
  // =============================
  document.getElementById("descHighlight").textContent =
    product.description.highlight;

  const detailList = document.getElementById("descDetailList");
  detailList.innerHTML = "";
  product.description.details.forEach(text => {
    detailList.insertAdjacentHTML("beforeend", `<li>${text}</li>`);
  });

  const noticeList = document.getElementById("descNoticeList");
  noticeList.innerHTML = "";
  product.description.notices.forEach(text => {
    noticeList.insertAdjacentHTML("beforeend", `<li>${text}</li>`);
  });

  // =============================
  // 展開 / 收合（關鍵）
  // =============================
  const descHeader = document.getElementById("descHeader");
  const descContent = document.getElementById("descContent");
  const descToggle = document.getElementById("descToggle");

  descContent.classList.add("hidden");
  descToggle.textContent = "＋";

  descHeader.addEventListener("click", function () {
    const isHidden = descContent.classList.contains("hidden");

    if (isHidden) {
      descContent.classList.remove("hidden");
      descToggle.textContent = "－";
    } else {
      descContent.classList.add("hidden");
      descToggle.textContent = "＋";
    }
  });

  // =============================
  // 數量
  // =============================
  window.changeQty = function (n) {
    const qtyEl = document.getElementById("qtyValue");
    let qty = parseInt(qtyEl.innerText, 10) + n;
    qtyEl.innerText = qty < 1 ? 1 : qty;
  };

// =============================
// 加入購物車（API 版本）
// =============================
const addToCartBtn = document.getElementById("addToCartBtn");
const sizeSelect = document.getElementById("sizeSelect");
const qtyEl = document.getElementById("qtyValue");

addToCartBtn.addEventListener("click", async function () {

  if (!sizeSelect.value || sizeSelect.value === "請選擇") {
    alert("請先選擇尺寸");
    return;
  }
  const imageKey = product.images[0]
  .split("/")
  .pop()
  .replace(".png", "");
  const payload = {
    productId: product.sku,
    productName: product.title,
    price: product.price,
    quantity: parseInt(qtyEl.innerText, 10),
    size: sizeSelect.value,
    imageKey: imageKey,
    
    createdAt: Date.now()
  };
  const token = await auth.currentUser.getIdToken();
  const res = await fetch("/api/cart/add/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
       Authorization: "Bearer " + token
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (data.success) {
    await updateCartBadge();
    alert("已加入購物車");
  } else {
    alert("加入失敗，請先登入");
  }
});

async function updateCartBadge() {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();

    const res = await fetch("/api/cart/", {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) return;

    const cart = await res.json();
    const badge = document.getElementById("cart-badge");
    if (!badge) return;

    if (cart.length > 0) {
      const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
      badge.classList.remove("d-none");
      badge.innerText = totalQty;
    } else {
      badge.classList.add("d-none");
    }
  } catch (err) {
    console.error(err);
  }
}

<<<<<<< HEAD
});
=======
});
>>>>>>> 23ed7dc3155447bd64d6dc0e7dcf7860ea3e3f53
