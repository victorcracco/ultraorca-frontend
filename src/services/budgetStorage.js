const KEY = "orcasimples_budgets";

export function getBudgets() {
  const data = localStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

export function saveBudget(budget) {
  const budgets = getBudgets();
  
  // Verifica se já existe (Edição)
  const existingIndex = budgets.findIndex((b) => b.id === budget.id);

  if (existingIndex >= 0) {
    budgets[existingIndex] = { ...budget, updatedAt: new Date().toISOString() };
  } else {
    // Novo (Criação)
    budgets.unshift({ ...budget, createdAt: new Date().toISOString() });
  }

  localStorage.setItem(KEY, JSON.stringify(budgets));
}

export function deleteBudget(id) {
  const budgets = getBudgets();
  const filtered = budgets.filter((b) => b.id !== id);
  localStorage.setItem(KEY, JSON.stringify(filtered));
  return filtered;
}

export function getBudgetById(id) {
  const budgets = getBudgets();
  return budgets.find((b) => b.id === id);
}