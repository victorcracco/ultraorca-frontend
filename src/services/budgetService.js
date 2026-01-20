import { supabase } from "./supabase";

// --- NOVA FUNÇÃO: PEGAR O PLANO ATUAL (Centralizada) ---
export async function getUserPlan() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'free';

  // 1. Prioridade: Busca assinatura ATIVA na tabela subscriptions
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_type, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (sub && sub.plan_type) {
    return sub.plan_type; // Retorna 'starter', 'pro' ou 'annual'
  }

  // 2. Fallback: Se não tiver assinatura ativa, verifica se foi setado manualmente no profile
  // (Útil se você der um plano manual para alguém editando o banco)
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_type')
    .eq('id', user.id)
    .single();

  return profile?.plan_type || 'free';
}

// --- VERIFICAÇÃO DE LIMITES ---
export async function checkPlanLimit() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, reason: "login_required" };

  // Usa a mesma função para garantir consistência
  const plan = await getUserPlan();

  // 1. PRO ou ANUAL -> Liberado
  if (plan === 'pro' || plan === 'annual') {
    return { allowed: true, plan };
  }

  // 2. INICIANTE (Starter) -> Limite 30/mês
  if (plan === 'starter') {
    // Conta orçamentos deste mês
    const { data: countThisMonth, error } = await supabase.rpc('count_budgets_this_month', { 
      user_uuid: user.id 
    });

    if (error) {
      // Se a função RPC não existir, faz contagem simples manual (fallback de segurança)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0,0,0,0);
      
      const { count } = await supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());
        
      if (count >= 30) return { allowed: false, plan: 'starter', type: 'limit_reached' };
      return { allowed: true, plan: 'starter' };
    }

    if (countThisMonth >= 30) {
      return { allowed: false, plan: 'starter', type: 'limit_reached' };
    }
    return { allowed: true, plan: 'starter' };
  }

  // 3. FREE -> Limite 3 Total
  const { count } = await supabase
    .from('budgets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (count >= 3) {
    return { allowed: false, plan: 'free', type: 'limit_reached' };
  }

  return { allowed: true, plan: 'free' };
}

// --- SALVAR (Mantido igual) ---
export async function saveBudget(budgetData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não logado");

  // UPDATE
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
  
  // INSERT
  else {
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
  const { data, error } = await supabase.from('budgets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

export async function getBudgetById(id) {
  const { data, error } = await supabase.from('budgets').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

export async function deleteBudget(id) {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}