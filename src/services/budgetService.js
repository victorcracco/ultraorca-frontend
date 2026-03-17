import { supabase } from "./supabase";

// --- NOVA FUNÇÃO: PEGAR O PLANO ATUAL (Centralizada) ---
export async function getUserPlan() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "free";

  // 1. Prioridade: Busca assinatura VÁLIDA na tabela subscriptions
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_type, status")
    .eq("user_id", user.id)
    .in("status", ["active", "canceling", "trialing"])
    .maybeSingle();

  if (sub && sub.plan_type) {
    return sub.plan_type;
  }

  // 2. Fallback: verifica manualmente no profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_type")
    .eq("id", user.id)
    .single();

  return profile?.plan_type || "free";
}

// --- VERIFICAÇÃO DE LIMITES ---
// knownPlan: passa o plano já carregado para evitar query dupla
export async function checkPlanLimit(knownPlan = null) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { allowed: false, reason: "login_required" };

  const plan = knownPlan || await getUserPlan();

  // PRO ou ANUAL -> Liberado (Infinito)
  if (plan === "pro" || plan === "annual") {
    return { allowed: true, plan };
  }

  // INICIANTE -> Limite 30/mês
  if (plan === "starter") {
    const { data: countThisMonth, error } = await supabase.rpc(
      "count_budgets_this_month",
      { user_uuid: user.id }
    );

    if (error) {
      // Fallback manual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("budgets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      if (count >= 30)
        return { allowed: false, plan: "starter", type: "limit_reached" };
      return { allowed: true, plan: "starter" };
    }

    if (countThisMonth >= 30) {
      return { allowed: false, plan: "starter", type: "limit_reached" };
    }
    return { allowed: true, plan: "starter" };
  }

  // FREE -> Limite 3 Total
  const { count } = await supabase
    .from("budgets")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (count >= 3) {
    return { allowed: false, plan: "free", type: "limit_reached" };
  }

  return { allowed: true, plan: "free" };
}

// --- SALVAR ---
export async function saveBudget(budgetData) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não logado");

  // UPDATE
  if (budgetData.id) {
    const { error } = await supabase
      .from("budgets")
      .update({
        client_name: budgetData.client,
        client_address: budgetData.clientAddress,
        items: budgetData.items,
        total: budgetData.total,
        layout: budgetData.layout,
        primary_color: budgetData.primaryColor,
        validity_days: parseInt(budgetData.validityDays),
        updated_at: new Date(),
      })
      .eq("id", budgetData.id)
      .eq("user_id", user.id);

    if (error) throw error;
    return budgetData.id;
  }

  // INSERT — usa RPC atômica para evitar race condition no display_id
  const { data: nextDisplayId, error: rpcError } = await supabase
    .rpc("get_next_display_id", { user_uuid: user.id });

  const displayId = rpcError ? 1 : (nextDisplayId || 1);

  const { data, error } = await supabase
    .from("budgets")
    .insert([
      {
        user_id: user.id,
        display_id: displayId,
        client_name: budgetData.client,
        client_address: budgetData.clientAddress,
        items: budgetData.items,
        total: budgetData.total,
        layout: budgetData.layout,
        primary_color: budgetData.primaryColor,
        validity_days: parseInt(budgetData.validityDays),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function getBudgets() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

export async function getBudgetById(id) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  // P7 FIX: filtra pelo user_id para garantir que só o dono vê seu orçamento
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error) return null;
  return data;
}

export async function deleteBudget(id) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
}

export async function toggleBudgetPublic(id, isPublic) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { error } = await supabase
    .from("budgets")
    .update({ is_public: isPublic })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
}

// Aceita um orçamento públio via RPC (sem autenticação necessária)
export async function acceptBudget(id) {
  const { data, error } = await supabase.rpc("accept_budget", { budget_id: id });
  if (error) throw error;
  return data; // true se aceitou, false se já estava aceito ou não encontrado
}

// Busca um orçamento público por ID (sem autenticação)
// Seleciona apenas as colunas necessárias para exibição — user_id e dados internos nunca são expostos
export async function getPublicBudget(id) {
  const { data, error } = await supabase
    .from("budgets")
    .select("id, display_id, client_name, client_address, items, total, validity_days, primary_color, created_at, status, is_public")
    .eq("id", id)
    .eq("is_public", true)
    .single();
  if (error) return null;
  return data;
}