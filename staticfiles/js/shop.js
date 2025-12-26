var app = angular.module("shopApp", []);

app.controller("MainCtrl", function($scope) {

  let brand = new URLSearchParams(window.location.search).get("brand");

  let allProducts = window.productsData; 

  if (brand) {
    $scope.productList = allProducts.filter(p => p.brand === brand);
  } else {
    $scope.productList = allProducts;
  }
});


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
