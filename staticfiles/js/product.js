document.addEventListener("DOMContentLoaded", function () {

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
  // 購物車
  // =============================
  const form = document.querySelector("form[action='/cart/add/']");
  if (!form) return;

  form.querySelector("input[name='sku']").value = product.sku;
  form.querySelector("input[name='title']").value = product.title;
  form.querySelector("input[name='price']").value = product.price;
  form.querySelector("input[name='image']").value = product.images[0];

  form.addEventListener("submit", function (e) {
    const sizeSelect = document.getElementById("sizeSelect");
    if (!sizeSelect.value || sizeSelect.value === "請選擇") {
      e.preventDefault();
      alert("請先選擇尺寸");
    }
  });

});
