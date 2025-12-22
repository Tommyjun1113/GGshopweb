var app = angular.module("shopApp", []);

app.controller("MainCtrl", function($scope) {

  let brand = new URLSearchParams(window.location.search).get("brand");

  // 商品資料（加入 images + description + 自動產生 /product?sku=xxx）
  let allProducts = window.productsData; // end allProducts



  // --------------------------
  // 依品牌篩選
  // --------------------------

  if (brand) {
    $scope.productList = allProducts.filter(p => p.brand === brand);
  } else {
    $scope.productList = allProducts;
  }
});


// --------------------------
// 商品卡片 Directive
// --------------------------

app.directive("productItem", function() {
  return {
    restrict: "E",
    scope: { data: "=" },
    template: `
      <div class="product-card">

        <a ng-href="/product?sku={{ data.sku }}" class="product-image"
           ng-mouseenter="hover = true"
           ng-mouseleave="hover = false">

          <!-- 🔥 使用正確的 images[] -->
          <img ng-src="{{ hover ? data.images[1] : data.images[0] }}"
               alt="{{ data.title }}">
        </a>

        <div class="product-info">
          <div class="product-title">{{ data.title }}</div>
          <div class="product-price">$ {{ data.price }}</div>
        </div>

      </div>
    `
  };
});
