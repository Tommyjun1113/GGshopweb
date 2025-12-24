document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("favoritesList");

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      listEl.innerHTML = "<p>請先登入</p>";
      return;
    }

    const token = await user.getIdToken();

    const res = await fetch("/api/favorites/", {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) {
      listEl.innerHTML = "<p>讀取失敗</p>";
      return;
    }

    const favorites = await res.json();

    if (favorites.length === 0) {
      listEl.innerHTML = "<p>尚未收藏任何商品</p>";
      return;
    }

    listEl.innerHTML = "";

    favorites.forEach(fav => {
      const product = window.productsData.find(
        p => p.sku === fav.productId
      );

      if (!product) return;

      listEl.insertAdjacentHTML("beforeend", `
        <div class="fav-card">
          <img src="${product.images[0]}" class="fav-img">
          <h4>${product.title}</h4>
          <p>NT$${product.price}</p>
          <a href="/product/?sku=${product.sku}" class="btn btn-dark">
            查看商品
          </a>
        </div>
      `);
    });
  });
});
