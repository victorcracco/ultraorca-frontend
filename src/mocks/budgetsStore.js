const STORAGE_KEY = "orcasimples_budgets";

function loadBudgets() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveBudgets(budgets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
}

export function getBudgets() {
  return loadBudgets();
}

export function addBudget(budget) {
  const budgets = loadBudgets();
  budgets.push({
    ...budget,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  });
  saveBudgets(budgets);
}
