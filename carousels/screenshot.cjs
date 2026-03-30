const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const carousels = [
  { name: 'carousel1', file: 'carousel1.html' },
  { name: 'carousel2', file: 'carousel2.html' },
  { name: 'carousel3', file: 'carousel3.html' },
  { name: 'carousel4', file: 'carousel4.html' },
  { name: 'carousel5', file: 'carousel5.html' },
  { name: 'carousel6', file: 'carousel6.html' },
  { name: 'carousel7', file: 'carousel7.html' },
  { name: 'carousel8', file: 'carousel8.html' },
  { name: 'carousel9', file: 'carousel9.html' },
  { name: 'carousel10', file: 'carousel10.html' },
  { name: 'carousel11', file: 'carousel11.html' },
  { name: 'carousel12', file: 'carousel12.html' },
  { name: 'carousel13', file: 'carousel13.html' },
  { name: 'carousel14', file: 'carousel14.html' },
  { name: 'carousel15', file: 'carousel15.html' },
];

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1200, height: 900 });

  for (const { name, file } of carousels) {
    const outDir = path.join(__dirname, 'output', name);
    fs.mkdirSync(outDir, { recursive: true });

    const filePath = path.resolve(path.join(__dirname, 'slides', file));
    const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');

    await page.goto(fileUrl, { waitUntil: 'networkidle' });

    const slides = await page.$$('.slide');
    console.log(`\n${name}: ${slides.length} slides`);

    for (let i = 0; i < slides.length; i++) {
      const num = String(i + 1).padStart(2, '0');
      const outPath = path.join(outDir, `slide-${num}.jpg`);

      await slides[i].screenshot({
        path: outPath,
        type: 'jpeg',
        quality: 95,
      });

      process.stdout.write(`  ✓ slide-${num}.jpg\n`);
    }
  }

  await browser.close();
  console.log('\nPronto! Imagens salvas em carousels/output/');
}

run().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
