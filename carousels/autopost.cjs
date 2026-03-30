/**
 * UltraOrça — Instagram Auto-Post (versão local com Supabase Storage)
 *
 * Uso:
 *   node carousels/autopost.cjs              → posta o que estiver agendado para hoje
 *   node carousels/autopost.cjs 2026-04-01   → força uma data específica (para testar)
 *
 * Configuração necessária:
 *   Crie o arquivo carousels/.env com:
 *     IG_USER_ID=xxx
 *     META_ACCESS_TOKEN=xxx
 *     SUPABASE_URL=https://xxxx.supabase.co
 *     SUPABASE_SERVICE_KEY=eyJ...
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ─── Carregar .env local ─────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo carousels/.env não encontrado. Veja carousels/.env.example');
    process.exit(1);
  }
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.trim().split('=');
    if (key && !key.startsWith('#') && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

function env(name) {
  const val = process.env[name];
  if (!val) { console.error(`❌ Faltando no .env: ${name}`); process.exit(1); }
  return val;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Supabase Storage upload ──────────────────────────────────────────────────
// Usa a REST API do Supabase diretamente (sem SDK) para manter o arquivo como CJS puro.
// O bucket "carousels" precisa ser público (Storage → Buckets → carousels → Make public).

async function uploadToSupabase(filePath, supabaseUrl, serviceKey) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = `ig-post-${Date.now()}-${path.basename(filePath)}`;
  const bucket = 'carousels';

  // Extrai o hostname da URL do Supabase
  const url = new URL(`${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`);

  const publicUrl = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'image/jpeg',
          'Content-Length': fileBuffer.length,
          'x-upsert': 'true',
        },
      },
      (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Supabase upload falhou (${res.statusCode}): ${data}`));
            return;
          }
          // Monta URL pública
          resolve(`${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`);
        });
      }
    );
    req.on('error', reject);
    req.write(fileBuffer);
    req.end();
  });

  return publicUrl;
}

// ─── Meta Graph API ──────────────────────────────────────────────────────────

function metaPost(igUserId, endpoint, params) {
  const query = new URLSearchParams(params).toString();
  const reqPath = `/v20.0/${igUserId}/${endpoint}?${query}`;

  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: 'graph.facebook.com', path: reqPath, method: 'POST' },
      (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { resolve(data); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function createImageContainer(igUserId, token, imageUrl) {
  const res = await metaPost(igUserId, 'media', {
    image_url: imageUrl,
    is_carousel_item: 'true',
    access_token: token,
  });
  if (!res.id) throw new Error(`Erro ao criar container de imagem: ${JSON.stringify(res)}`);
  return res.id;
}

async function createCarouselContainer(igUserId, token, childrenIds, caption) {
  const res = await metaPost(igUserId, 'media', {
    media_type: 'CAROUSEL',
    children: childrenIds.join(','),
    caption,
    access_token: token,
  });
  if (!res.id) throw new Error(`Erro ao criar carrossel: ${JSON.stringify(res)}`);
  return res.id;
}

async function publishCarousel(igUserId, token, carouselId) {
  const res = await metaPost(igUserId, 'media_publish', {
    creation_id: carouselId,
    access_token: token,
  });
  if (!res.id) throw new Error(`Erro ao publicar: ${JSON.stringify(res)}`);
  return res.id;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv();

  const IG_USER_ID     = env('IG_USER_ID');
  const ACCESS_TOKEN   = env('META_ACCESS_TOKEN');
  const SUPABASE_URL   = env('SUPABASE_URL');
  const SUPABASE_KEY   = env('SUPABASE_SERVICE_KEY');

  // Data alvo: argumento da linha de comando ou hoje
  const today = process.argv[2] || new Date().toISOString().split('T')[0];
  console.log(`\n📅 Data alvo: ${today}`);

  // Carrega schedule
  const schedulePath = path.join(__dirname, 'schedule.json');
  const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
  const post = schedule.posts.find(p => p.date === today && !p.posted);

  if (!post) {
    console.log(`Nenhum post agendado para ${today}. Nada a fazer.\n`);
    process.exit(0);
  }

  console.log(`\n🚀 Postando: "${post.title}"`);
  console.log(`   Carrossel: ${post.carousel}\n`);

  // Lista slides
  const carouselDir = path.join(__dirname, 'output', post.carousel);
  if (!fs.existsSync(carouselDir)) {
    throw new Error(`Pasta não encontrada: ${carouselDir}\nRode antes: node carousels/screenshot.cjs`);
  }

  let slides = fs.readdirSync(carouselDir)
    .filter(f => f.endsWith('.jpg'))
    .sort()
    .map(f => path.join(carouselDir, f));

  if (slides.length < 2) throw new Error('Mínimo de 2 slides para carrossel.');
  if (slides.length > 10) slides = slides.slice(0, 10); // Instagram limita em 10

  console.log(`📸 ${slides.length} slides\n`);

  // Upload para Supabase Storage
  console.log('⬆️  Enviando imagens para o Supabase Storage...');
  const imageUrls = [];
  for (let i = 0; i < slides.length; i++) {
    process.stdout.write(`   Slide ${i + 1}/${slides.length}... `);
    const url = await uploadToSupabase(slides[i], SUPABASE_URL, SUPABASE_KEY);
    imageUrls.push(url);
    console.log('✓');
  }

  // Cria containers individuais
  console.log('\n📦 Criando containers no Meta...');
  const childrenIds = [];
  for (let i = 0; i < imageUrls.length; i++) {
    process.stdout.write(`   Imagem ${i + 1}/${imageUrls.length}... `);
    const id = await createImageContainer(IG_USER_ID, ACCESS_TOKEN, imageUrls[i]);
    childrenIds.push(id);
    console.log(`✓ ${id}`);
    await sleep(800);
  }

  // Cria carrossel
  console.log('\n🎠 Criando container do carrossel...');
  const carouselId = await createCarouselContainer(IG_USER_ID, ACCESS_TOKEN, childrenIds, post.caption);
  console.log(`   ✓ ${carouselId}`);

  // Aguarda processamento
  console.log('\n⏳ Aguardando Meta processar as imagens (30s)...');
  await sleep(30000);

  // Publica
  console.log('📤 Publicando...');
  const postId = await publishCarousel(IG_USER_ID, ACCESS_TOKEN, carouselId);

  console.log(`\n✅ Publicado! Post ID: ${postId}`);
  console.log(`   https://www.instagram.com/p/${postId}/\n`);

  // Atualiza schedule.json
  post.posted = true;
  post.posted_at = new Date().toISOString();
  post.instagram_post_id = postId;
  fs.writeFileSync(schedulePath, JSON.stringify(schedule, null, 2));
  console.log('📝 schedule.json atualizado\n');
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
