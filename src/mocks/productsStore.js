const STORAGE_KEY = "orcasimples_products";

function loadProducts() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function getProducts() {
  return loadProducts();
}

export function addProduct(product) {
  const products = loadProducts();
  products.push({ ...product, id: Date.now() });
  saveProducts(products);
}

export function removeProduct(id) {
  const products = loadProducts().filter((p) => p.id !== id);
  saveProducts(products);
}
