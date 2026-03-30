# Setup — Postagem Automática no Instagram

## Como funciona

Você roda `node carousels/autopost.cjs` e ele:
1. Lê o `schedule.json` e encontra o post do dia
2. Faz upload dos slides pro **Supabase Storage** (bucket público do seu próprio projeto)
3. Publica o carrossel no Instagram via **Meta Graph API**
4. Marca o post como publicado no `schedule.json`

Custo total: **R$ 0**. Usa o Supabase que você já tem. Nenhum servidor extra.

---

## Configuração — 3 passos

### Passo 1 — Converter @ultraorcabr para conta Business

1. Instagram no celular → Perfil → Menu (≡)
2. **Configurações → Tipo de conta → Mudar para conta profissional → Empresa**
3. Vincule a uma Página do Facebook (crie uma nova se precisar — pode ser vazia)

---

### Passo 2 — Criar bucket público no Supabase (2 minutos)

1. Acesse seu projeto em [supabase.com](https://supabase.com)
2. Vá em **Storage → New bucket**
3. Nome: `carousels`
4. Marque **Public bucket** → Create
5. Vá em **Settings → API** e copie:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** (secret) → `SUPABASE_SERVICE_KEY`

---

### Passo 3 — Pegar o IG User ID e o Access Token do Meta

**3.1 — Criar um Meta App (5 minutos)**

1. Acesse [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Clique em **Criar app** → Tipo: **Outro** → **Empresa (Business)**
3. Dê um nome (ex: "UltraOrça Posts") e clique em Criar
4. No painel do app, vá em **Adicionar produto** → **Instagram Graph API** → Configurar

**3.2 — Gerar o token de acesso**

1. Acesse [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
2. Em **Meta App**, selecione o app que você criou
3. Clique em **Gerar token de acesso** e marque as permissões:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
4. Clique em **Gerar token** e autorize

**3.3 — Transformar em token de longa duração (60 dias)**

Cole a URL abaixo no navegador (substituindo os valores):

```
https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=SEU_APP_ID&client_secret=SEU_APP_SECRET&fb_exchange_token=TOKEN_GERADO_ACIMA
```

O `App ID` e `App Secret` estão em **Configurações → Básico** no painel do app.

Você vai receber um JSON com o `access_token` de longa duração — copie ele.

**3.4 — Obter o IG User ID**

No [Graph API Explorer](https://developers.facebook.com/tools/explorer), com o token de longa duração:

1. Requisição: `me/accounts` → Enviar
2. Copie o `id` da sua Página do Facebook
3. Nova requisição: `{id_da_pagina}?fields=instagram_business_account` → Enviar
4. Copie o `id` dentro de `instagram_business_account` — esse é o **IG User ID**

---

## Criar o arquivo .env

```bash
cp carousels/.env.example carousels/.env
```

Abra `carousels/.env` e preencha:

```env
IG_USER_ID=123456789
META_ACCESS_TOKEN=EAAxxxxx...
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Usar

**Postar o carrossel do dia:**
```bash
node carousels/autopost.cjs
```

**Testar com uma data específica:**
```bash
node carousels/autopost.cjs 2026-04-01
```

**Regenerar as imagens (se editar algum HTML):**
```bash
node carousels/screenshot.cjs
```

---

## Automatizar no Windows (opcional)

Para rodar sozinho todo dia às 18h30 sem abrir o computador:

1. Abra o **Agendador de Tarefas** do Windows
2. Criar Tarefa Básica → nome: "Instagram UltraOrça"
3. Disparador: **Diariamente às 18:30**
4. Ação: **Iniciar um programa**
   - Programa: `node`
   - Argumentos: `C:\Users\Victor\Desktop\Projetos\orcasimples\orcasimples-frontend\carousels\autopost.cjs`
   - Iniciar em: `C:\Users\Victor\Desktop\Projetos\orcasimples\orcasimples-frontend`

> ⚠️ O computador precisa estar ligado no horário agendado.

---

## Renovação do token (todo mês)

O token expira em 60 dias. No dia 1 de cada mês:

1. Volte ao [Graph API Explorer](https://developers.facebook.com/tools/explorer)
2. Gere novo token curto com as mesmas permissões
3. Converta em token longo (passo 3.3)
4. Atualize o valor de `META_ACCESS_TOKEN` no `carousels/.env`

---

## Ajustar o cronograma

Edite `carousels/schedule.json` para mudar datas, captions ou ordem dos posts.

Para adicionar novo post, copie um item existente e altere:
- `"date"`: data no formato `YYYY-MM-DD`
- `"carousel"`: nome da pasta em `carousels/output/`
- `"caption"`: legenda do Instagram
- `"posted": false`
