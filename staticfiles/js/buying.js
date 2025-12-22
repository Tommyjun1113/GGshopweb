// 切換主圖片
function changeImage(src) {
    document.getElementById("mainImage").src = src;
}

// 數量加減
function changeQty(n) {
    const qtyEl = document.getElementById("qtyValue");
    let qty = parseInt(qtyEl.innerText);
    qty = qty + n;
    if (qty < 1) qty = 1;
    qtyEl.innerText = qty;
}

// 商品描述
function toggleDesc() {
    const content = document.getElementById("descContent");
    const toggleBtn = document.getElementById("descToggle");

    if (content.style.display === "none") {
        content.style.display = "block";
        toggleBtn.textContent = "－";
    } else {
        content.style.display = "none";
        toggleBtn.textContent = "＋";
    }
}