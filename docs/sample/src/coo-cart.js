let cart = [];

function addToCart(productId, productName, productPrice) {
  let productInCart = cart.find((product) => product.id === productId);

  if (productInCart) {
    productInCart.quantity += 1;
  } else {
    cart.push({
      id: productId,
      name: productName,
      price: productPrice,
      quantity: 1,
    });
  }

  renderCart();
}

function renderCart() {
  const cartItemsElement = document.getElementById("cartItems");
  cartItemsElement.innerHTML = "";

  let total = 0;

  for (let product of cart) {
    const listItem = document.createElement("li");
    listItem.textContent = `${product.name} (x${product.quantity}) - $${
      product.price * product.quantity
    }`;
    cartItemsElement.appendChild(listItem);

    total += product.price * product.quantity;
  }

  document.getElementById("totalPrice").textContent = total;
}
