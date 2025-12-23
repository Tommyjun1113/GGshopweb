auth.onAuthStateChanged(async user => {
  if (!user) {
    location.href = "/login/";
    return;
  }

  const token = await user.getIdToken();
  const res = await fetch("/api/orders/", {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  const orders = await res.json();
  renderOrders(orders);
});

function renderOrders(orders) {
  const container = document.getElementById("orders-container");

  if (!orders.length) {
    container.innerHTML = "<p>目前沒有購買紀錄</p>";
    return;
  }

  container.innerHTML = "";

  orders.forEach(order => {
    const itemsHtml = order.items.map(item => `
      <div class="order-item">
        <div>${item.productName}（${item.size}）</div>
        <div>數量：${item.quantity}</div>
        <div>NT$ ${item.price}</div>
      </div>
    `).join("");

    container.innerHTML += `
      <div class="order-card">
        <div class="order-header">
          <span>訂單日期</span>
          <span>NT$ ${order.total}</span>
        </div>
        <div class="order-items">
          ${itemsHtml}
        </div>
      </div>
    `;
  });
<<<<<<< HEAD
}
=======
}
>>>>>>> 23ed7dc3155447bd64d6dc0e7dcf7860ea3e3f53
