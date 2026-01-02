import { supabase } from "./supabase";

// Listar todos os orçamentos do usuário logado
export async function getBudgets() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar orçamentos:", error);
    return [];
  }
  return data;
}

// Pegar um orçamento específico (para edição)
export async function getBudgetById(id) {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

// Salvar (Criar ou Atualizar)
export async function saveBudget(budgetData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não logado");

  // Prepara o objeto para o formato do Banco de Dados
  const payload = {
    user_id: user.id,
    client_name: budgetData.client,
    client_address: budgetData.clientAddress,
    items: budgetData.items, // O Supabase salva JSON automaticamente
    total: budgetData.total,
    primary_color: budgetData.primaryColor,
    layout: budgetData.layout || "modern",
    validity_days: parseInt(budgetData.validityDays || 15),
  };

  // Se já tem ID, atualiza. Se não, cria.
  if (budgetData.id) {
    const { error } = await supabase
      .from("budgets")
      .update(payload)
      .eq("id", budgetData.id);
    
    if (error) throw error;
    return budgetData.id;
  } else {
    // Insere e retorna o ID criado
    const { data, error } = await supabase
      .from("budgets")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }
}

// Deletar
export async function deleteBudget(id) {
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id);
    
  if (error) throw error;
}

// Checar limite do plano grátis (Conta quantos orçamentos existem)
export async function checkFreeLimit() {
  const { count, error } = await supabase
    .from("budgets")
    .select("*", { count: "exact", head: true }); // head: true não baixa os dados, só conta

  if (error) return 0;
  return count;
}