import { supabase } from "./supabase";

// --- VERIFICAR LIMITES E PLANOS ---
export async function checkPlanLimit() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, message: "Login necessário" };

  // 1. Busca dados do perfil (Plano e Uso)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan_type, current_period_usage, last_reset_date')
    .eq('id', user.id)
    .single();

  if (error) {
    // Se der erro (ex: perfil não criado), assume Free
    console.error("Erro perfil:", error);
    return { allowed: true, plan: 'free' }; // Deixa passar para verificar contagem total depois
  }

  const plan = profile.plan_type || 'free';
  const usage = profile.current_period_usage || 0;
  const lastReset = profile.last_reset_date ? new Date(profile.last_reset_date) : new Date();
  const now = new Date();

  // 2. REGRA: PLANO PRO / ANUAL (ILIMITADO)
  if (plan === 'pro' || plan === 'annual') {
    return { allowed: true, plan };
  }

  // 3. REGRA: PLANO INICIANTE (30 por mês)
  if (plan === 'starter') {
    // Calcula dias passados desde o último reset
    const diffTime = Math.abs(now - lastReset);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    // Se passou mais de 30 dias, Reseta o contador!
    if (diffDays > 30) {
      await supabase.from('profiles').update({ 
        current_period_usage: 0,
        last_reset_date: new Date().toISOString()
      }).eq('id', user.id);
      
      return { allowed: true, plan: 'starter' }; // Resetou, então tá liberado
    }

    // Se ainda está no mês, verifica limite
    if (usage >= 30) {
      return { allowed: false, plan: 'starter', type: 'limit_reached' };
    }
    
    return { allowed: true, plan: 'starter' };
  }

  // 4. REGRA: PLANO FREE (3 no total da vida)
  if (plan === 'free') {
    // Conta quantos orçamentos existem na tabela (mais seguro para free vitalício)
    const { count } = await supabase
      .from('budgets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count >= 3) {
      return { allowed: false, plan: 'free', type: 'limit_reached' };
    }
    return { allowed: true, plan: 'free' };
  }

  return { allowed: true, plan: 'free' };
}

// --- INCREMENTAR USO (Auxiliar) ---
export async function incrementUsage() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Busca uso atual
  const { data: profile } = await supabase.from('profiles').select('current_period_usage').eq('id', user.id).single();
  
  if (profile) {
    // Incrementa +1
    await supabase.from('profiles').update({ 
      current_period_usage: (profile.current_period_usage || 0) + 1 
    }).eq('id', user.id);
  }
}

// --- SALVAR ORÇAMENTO (Principal) ---
export async function saveBudget(budgetData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não logado");

  // Se já tem ID, é UPDATE (Não gasta limite)
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
  
  // Se é NOVO, é INSERT (Gasta limite)
  else {
    // Busca ID legível
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

    // SUCESSO: Incrementa o uso no perfil
    await incrementUsage();

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