
let currentReturnOrderId = null;
const canReturnStatus = ["COMPLETED", "PENDING"];

ORDER_STATUS_LABEL = {
  "PENDING": "待付款 / 處理中",
  "COMPLETED": "已完成",
  "RETURN_REQUESTED": "退貨申請中",
  "RETURN_APPROVED": "退貨審核通過",
  "RETURN_REJECTED": "退貨被拒",
  "CANCELLED": "已取消",
}

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
  const token = await user.getIdToken();

  const res = await fetch("/api/orders/", {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  if (res.status === 401) {
    document.getElementById("orders-container").innerHTML =
      `<p style="color:#c00;">登入狀態已失效，請重新登入</p>`;
    return;
  }

  if (!res.ok) {
    document.getElementById("orders-container").innerHTML =
      `<p style="color:#c00;">訂單載入失敗</p>`;
    return;
  }

  const orders = await res.json();
  renderOrders(orders);
});


function renderOrders(orders) {
  const container = document.getElementById("orders-container");
  container.innerHTML = "";

  if (!Array.isArray(orders) || orders.length === 0) {
    container.innerHTML = `<p class="empty">尚無購買紀錄</p>`;
    return;
  }

  orders.forEach(order => {
    
    let date = "";
    if (order.createdAt?.seconds) {
      date = new Date(order.createdAt.seconds * 1000).toLocaleString();
    } else if (typeof order.createdAt === "number") {
      date = new Date(order.createdAt).toLocaleString();
    }

    
    let itemsHtml = "";
    order.items.forEach(item => {
      itemsHtml += `
        <div class="order-item">
          <img src="/static/products/${item.imageKey}.png" class="order-img">
          <div class="order-item-info">
            <div class="name">${item.productName}</div>
            <div class="meta">
              尺寸：${item.size} ｜ 數量：${item.quantity}
            </div>
            <div class="price">NT$ ${item.price}</div>
          </div>
        </div>
      `;
    });

    
    let couponHtml = "";
    if (order.coupon && order.discount > 0) {
      couponHtml = `
        <div class="order-coupon">
          使用優惠券：<strong>${order.coupon.title}</strong>
          <span class="discount">- NT$ ${order.discount}</span>
        </div>
      `;
    }

    let returnInfoHtml = "";
    if (order.status === "RETURN_REQUESTED" && order.return) {
      returnInfoHtml = `
        <div class="return-info">
          <strong>${ORDER_STATUS_LABEL[order.status]}</strong><br>
          原因：${order.return.reason}<br>
          ${order.return.note ? `說明：${order.return.note}` : ""}
        </div>
      `;
    }

    
    let returnBtnHtml = "";
    if (canReturnStatus.includes(order.status)) {
      returnBtnHtml = `
        <button class="return-btn"
          onclick="openReturnModal('${order.id}')">
          申請退貨
        </button>
      `;
    }

    container.innerHTML += `
      <div class="order-card">
        <div class="order-header">
          <div>訂單日期：${date}</div>
          <div>付款方式：${order.paymentMethod || "—"}</div>
          <div class="status ${getStatusClass(order.status)}">
            ${ORDER_STATUS_LABEL[order.status] || order.status}
          </div>
        </div>

        <div class="order-items">${itemsHtml}</div>

        ${couponHtml}
        ${returnInfoHtml}
        
        <div class="order-footer">
          <strong>NT$ ${order.total}</strong>
          ${returnBtnHtml}
        </div>
      </div>
    `;
  });
}


function openReturnModal(orderId) {
  currentReturnOrderId = orderId;
  document.getElementById("return-modal").classList.remove("hidden");
}

function closeReturnModal() {
  document.getElementById("return-modal").classList.add("hidden");
}

async function submitReturn() {
  const reason = document.getElementById("return-reason").value;
  const note = document.getElementById("return-note").value;

  const token = await auth.currentUser.getIdToken();

  const res = await fetch(`/api/orders/${currentReturnOrderId}/return/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ reason, note })
  });

  if (res.ok) {
    alert("退貨申請已送出");
    location.reload();
  } else {
    alert("退貨失敗");
  }
}

function getStatusClass(status) {
  switch (status) {
    case "PENDING":
      return "pending";
    case "COMPLETED":
      return "paid";
    case "RETURN_REQUESTED":
    case "RETURN_APPROVED":
      return "returning";
    case "RETURN_REJECTED":
    case "CANCELLED":
      return "cancelled";
    default:
      return "";
  }
}

