// 取得 SKU
let sku = new URLSearchParams(window.location.search).get("sku");

// 與 allProducts.js 相同的商品資料（保持一致）
let allProducts = window.productsData;


// 找到對應的商品
let product = allProducts.find(p => p.sku === sku);

if (!product) {
    document.querySelector(".main-wrapper").innerHTML =
        "<h2 style='padding:40px;'>找不到商品資料</h2>";
    throw new Error("商品不存在: " + sku);
}


// 1️⃣ 更新標題
document.querySelector(".title").textContent = product.title;

// 2️⃣ 更新價格
document.querySelector(".new-price").textContent = "NT$" + product.price;

// 3️⃣ 更換主圖
let mainImage = document.querySelector("#mainImage");
mainImage.src = product.images[0];

// 4️⃣ 替換縮圖清單
let thumbList = document.querySelector(".thumb-list");
thumbList.innerHTML = ""; // 清空 HTML

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

// 主圖切換 function
function changeImage(src) {
    document.querySelector("#mainImage").src = src;
}

// 5️⃣ 商品描述
document.querySelector("#descContent").innerHTML = `
    <p class="desc-highlight">${product.description}</p>
`;


function changeQty(n) {
    const qtyEl = document.getElementById("qtyValue");
    if (!qtyEl) return;

    let qty = parseInt(qtyEl.innerText, 10);
    qty = qty + n;
    if (qty < 1) qty = 1;

    qtyEl.innerText = qty;
}

function toggleDesc() {
    const content = document.getElementById("descContent");
    const toggleBtn = document.getElementById("descToggle");

    content.classList.toggle("hidden");

    if (content.classList.contains("hidden")) {
        toggleBtn.textContent = "＋";
    } else {
        toggleBtn.textContent = "－";
    }
}

// 購物車
document.addEventListener("DOMContentLoaded", function () {

    const form = document.querySelector("form[action='/cart/add/']");

    if (!form) {
        console.error("找不到加入購物車 form");
        return;
    }

    form.querySelector("input[name='sku']").value = product.sku;
    form.querySelector("input[name='title']").value = product.title;
    form.querySelector("input[name='price']").value = product.price;
    form.querySelector("input[name='image']").value = product.images[0];

    form.addEventListener("submit", function (e) {
        const qtyText = document.getElementById("qtyValue")?.innerText || "1";
        const sizeSelect = document.getElementById("sizeSelect");

        if (!sizeSelect || !sizeSelect.value || sizeSelect.value === "請選擇") {
            e.preventDefault();
            alert("請先選擇尺寸");
            return;
        }

        document.getElementById("cartQty").value = qtyText;
        document.getElementById("cartSize").value = sizeSelect.value;
    });

});
