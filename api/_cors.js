/**
 * Helper de CORS para todas as API routes da Vercel.
 * Chame setCors(res) no início de cada handler antes de qualquer resposta.
 */
export function setCors(res, req) {
  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN,
    "https://ultraorca.com.br",
    "https://www.ultraorca.com.br",
  ].filter(Boolean);

  const origin = req?.headers?.origin || "";
  const isAllowed = allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production";

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", isAllowed ? origin : "https://ultraorca.com.br");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
}

/**
 * Trata preflight OPTIONS — coloque isso antes do método check em cada handler.
 * Retorna true se a requisição era OPTIONS (já respondida).
 */
export function handlePreflight(req, res) {
  setCors(res, req);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
