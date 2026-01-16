import { supabase } from "./supabase";

// Salvar Orçamento (Mantido igual, apenas para referência)
export async function saveBudget(budgetData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não logado");

  // Se já tem ID, é atualização (UPDATE)
  if (budgetData.id) {
    const { error } = await supabase
      .from('budgets')
      .update({
        client_name: budgetData.client,
        client_address: budgetData.clientAddress,
        items: budgetData.items,
        total: budgetData.total,
        primary_color: budgetData.primaryColor,
        validity_days: parseInt(budgetData.validityDays),
        updated_at: new Date()
      })
      .eq('id', budgetData.id)
      .eq('user_id', user.id);

    if (error) throw error;
    return budgetData.id;
  } 
  
  // Se não tem ID, é novo (INSERT)
  else {
    // Busca o último display_id para incrementar
    const { data: lastBudget } = await supabase
      .from('budgets')
      .select('display_id')
      .eq('user_id', user.id)
      .order('display_id', { ascending: false })
      .limit(1)
      .single();

    const nextDisplayId = (lastBudget?.display_id || 0) + 1;

    const { data, error } = await supabase
      .from('budgets')
      .insert([{
        user_id: user.id,
        display_id: nextDisplayId,
        client_name: budgetData.client,
        client_address: budgetData.clientAddress,
        items: budgetData.items,
        total: budgetData.total,
        primary_color: budgetData.primaryColor,
        validity_days: parseInt(budgetData.validityDays)
      }])
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }
}

export async function getBudgets() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

export async function getBudgetById(id) {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function deleteBudget(id) {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}

// --- NOVA LÓGICA DE LIMITES ---
export async function checkPlanLimit() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, reason: "login_required" };

  // 1. Busca a assinatura ATIVA
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_type, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  const plan = sub?.plan_type; // 'starter', 'pro', 'annual' ou undefined (free)

  // 2. Se for PRO ou ANUAL -> Liberado Geral
  if (plan === 'pro' || plan === 'annual') {
    return { allowed: true };
  }

  // 3. Se for INICIANTE (Starter) -> Limite de 30/mês
  if (plan === 'starter') {
    // Chama a função SQL que conta orçamentos DESTE MÊS
    const { data: countThisMonth, error } = await supabase.rpc('count_budgets_this_month', { 
      user_uuid: user.id 
    });

    if (error) {
      console.error("Erro ao contar orçamentos:", error);
      return { allowed: false, reason: "error" }; // Bloqueia por segurança em caso de erro
    }

    if (countThisMonth >= 30) {
      return { 
        allowed: false, 
        reason: "limit_reached", 
        plan: "starter", 
        limit: 30,
        current: countThisMonth 
      };
    }
    return { allowed: true };
  }

  // 4. Se for FREE (Sem assinatura) -> Limite de 3 TOTAL (Teste Grátis)
  // Conta o total de orçamentos na vida inteira
  const { count } = await supabase
    .from('budgets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (count >= 3) {
    return { 
      allowed: false, 
      reason: "limit_reached", 
      plan: "free", 
      limit: 3,
      current: count 
    };
  }

  return { allowed: true };
}