const COMPANY_KEY = "orcasimples_company";
const PRODUCTS_KEY = "orcasimples_products";
const BUDGETS_KEY = "orcasimples_budgets";

// ===== COMPANY =====
export function saveCompany(company) {
  localStorage.setItem(COMPANY_KEY, JSON.stringify(company));
}

export function getCompany() {
  const data = localStorage.getItem(COMPANY_KEY);
  return data ? JSON.parse(data) : { name: "" };
}

// ===== PRODUCTS =====
export function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function getProducts() {
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
}

// ===== BUDGETS =====
export function saveBudgets(budgets) {
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
}

export function getBudgets() {
  const data = localStorage.getItem(BUDGETS_KEY);
  return data ? JSON.parse(data) : [];
}
