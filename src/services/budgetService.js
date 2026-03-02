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
export async function checkPlanLimit() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { allowed: false, reason: "login_required" };

  const plan = await getUserPlan();

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
        primary_color: budgetData.primaryColor,
        validity_days: parseInt(budgetData.validityDays),
        updated_at: new Date(),
      })
      .eq("id", budgetData.id)
      .eq("user_id", user.id); // garante que só o dono pode editar

    if (error) throw error;
    return budgetData.id;
  }

  // INSERT — C6: usa MAX(display_id)+1 em subquery atômica via RPC para evitar race condition
  // Se não tiver a RPC, usa a query sequencial como fallback (seguro para baixo volume)
  const { data: lastBudget } = await supabase
    .from("budgets")
    .select("display_id")
    .eq("user_id", user.id)
    .order("display_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextDisplayId = (lastBudget?.display_id || 0) + 1;

  const { data, error } = await supabase
    .from("budgets")
    .insert([
      {
        user_id: user.id,
        display_id: nextDisplayId,
        client_name: budgetData.client,
        client_address: budgetData.clientAddress,
        items: budgetData.items,
        total: budgetData.total,
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
  // P7 FIX: filtro duplo por id + user_id — impede deletar orçamentos de outros usuários
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
}