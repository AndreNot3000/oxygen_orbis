import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('🏨 RUNNING TEST SUITE: MODULE 7 (Production Deployment, SEO & Security)');
console.log('================================================================\n');

let passedTests = 0;
const runTest = (name, fn) => {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
    process.exit(1);
  }
};

async function executeTestSuite() {
  const rootDir = process.cwd();

  // -------------------------------------------------------------
  // TEST GROUP 1: CARD 7.1 - Production Hosting, Headers & Config
  // -------------------------------------------------------------
  console.log('📦 TEST GROUP 1: Production Deployment & Security Config (Card 7.1)');

  runTest('vercel.json exists and contains valid JSON syntax', () => {
    const vercelPath = path.join(rootDir, 'vercel.json');
    assert.ok(fs.existsSync(vercelPath), 'vercel.json file must exist in project root');
    const content = fs.readFileSync(vercelPath, 'utf8');
    const parsed = JSON.parse(content);
    assert.ok(parsed.headers && parsed.headers.length > 0, 'vercel.json must specify headers array');
  });

  runTest('vercel.json enforces strict production security headers', () => {
    const vercelPath = path.join(rootDir, 'vercel.json');
    const parsed = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
    const allHeaders = parsed.headers[0].headers;

    const hsts = allHeaders.find((h) => h.key === 'Strict-Transport-Security');
    assert.ok(hsts, 'HSTS header must be present');
    assert.ok(hsts.value.includes('max-age=63072000'));

    const nosniff = allHeaders.find((h) => h.key === 'X-Content-Type-Options');
    assert.strictEqual(nosniff.value, 'nosniff');

    const frameOptions = allHeaders.find((h) => h.key === 'X-Frame-Options');
    assert.strictEqual(frameOptions.value, 'SAMEORIGIN');

    const csp = allHeaders.find((h) => h.key === 'Content-Security-Policy');
    assert.ok(csp, 'Content-Security-Policy header must be configured');
    assert.ok(csp.value.includes('paystack.co'), 'CSP must whitelist Paystack checkout gateway');
  });

  runTest('public/_headers exists with static CDN security policies', () => {
    const headersPath = path.join(rootDir, 'public', '_headers');
    assert.ok(fs.existsSync(headersPath), 'public/_headers must exist');
    const content = fs.readFileSync(headersPath, 'utf8');
    assert.ok(content.includes('Strict-Transport-Security'));
    assert.ok(content.includes('X-Content-Type-Options: nosniff'));
    assert.ok(content.includes('X-Frame-Options: SAMEORIGIN'));
  });

  runTest('public/robots.txt allows indexing and links to sitemap', () => {
    const robotsPath = path.join(rootDir, 'public', 'robots.txt');
    assert.ok(fs.existsSync(robotsPath), 'public/robots.txt must exist');
    const content = fs.readFileSync(robotsPath, 'utf8');
    assert.ok(content.includes('User-agent: *'));
    assert.ok(content.includes('Allow: /'));
    assert.ok(content.includes('Sitemap: https://oxygenorbis.com/sitemap.xml'));
  });

  runTest('public/sitemap.xml contains valid XML and canonical routes', () => {
    const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
    assert.ok(fs.existsSync(sitemapPath), 'public/sitemap.xml must exist');
    const content = fs.readFileSync(sitemapPath, 'utf8');
    assert.ok(content.includes('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(content.includes('<loc>https://oxygenorbis.com/</loc>'));
    assert.ok(content.includes('<loc>https://oxygenorbis.com/#rooms</loc>'));
    assert.ok(content.includes('<loc>https://oxygenorbis.com/#lagos-escape</loc>'));
  });

  runTest('GitHub Actions production CI/CD workflow is configured', () => {
    const workflowPath = path.join(rootDir, '.github', 'workflows', 'production-deploy.yml');
    assert.ok(fs.existsSync(workflowPath), 'production-deploy.yml must exist in .github/workflows/');
    const content = fs.readFileSync(workflowPath, 'utf8');
    assert.ok(content.includes('npm test'), 'Workflow must execute automated test suite');
    assert.ok(content.includes('npm run build'), 'Workflow must compile production Vite bundle');
    assert.ok(content.includes('oxygenorbis.com'), 'Workflow must target production domain oxygenorbis.com');
  });

  runTest('.env.example documents production domain and Paystack integration', () => {
    const envPath = path.join(rootDir, '.env.example');
    assert.ok(fs.existsSync(envPath), '.env.example must exist');
    const content = fs.readFileSync(envPath, 'utf8');
    assert.ok(content.includes('VITE_APP_URL=https://oxygenorbis.com'));
    assert.ok(content.includes('VITE_PAYSTACK_PUBLIC_KEY='));
    assert.ok(content.includes('VITE_WHATSAPP_PHONE=+2349033987126'));
  });

  runTest('Containerized hosting (Dockerfile & nginx.conf) enforces HSTS, CSP, and Gzip', () => {
    const dockerPath = path.join(rootDir, 'Dockerfile');
    const nginxPath = path.join(rootDir, 'nginx.conf');
    assert.ok(fs.existsSync(dockerPath), 'Dockerfile must exist');
    assert.ok(fs.existsSync(nginxPath), 'nginx.conf must exist');

    const nginxContent = fs.readFileSync(nginxPath, 'utf8');
    assert.ok(nginxContent.includes('gzip on;'), 'Nginx must enable gzip for sub-1.2s speed');
    assert.ok(nginxContent.includes('Strict-Transport-Security'), 'Nginx must enforce HSTS');
    assert.ok(nginxContent.includes('Content-Security-Policy'), 'Nginx must enforce CSP');
    assert.ok(nginxContent.includes('try_files $uri $uri/ /index.html;'), 'Nginx must support SPA client routing');
  });

  runTest('Production asset bundle adheres to performance budget for sub-1.2s load', () => {
    const distPath = path.join(rootDir, 'dist');
    assert.ok(fs.existsSync(distPath), 'dist directory must exist from build');
    const indexPath = path.join(distPath, 'index.html');
    assert.ok(fs.existsSync(indexPath), 'dist/index.html must exist');

    const assetsPath = path.join(distPath, 'assets');
    const assetFiles = fs.readdirSync(assetsPath);
    const jsFiles = assetFiles.filter((f) => f.endsWith('.js'));
    assert.ok(jsFiles.length > 0, 'Production bundle must generate compiled JS assets');

    const mainJsStat = fs.statSync(path.join(assetsPath, jsFiles[0]));
    // Uncompressed JS bundle under 600 KB (~133 KB gzip) loads in <1.2s even on 3G/4G
    assert.ok(mainJsStat.size < 600 * 1024, `JS bundle must be < 600KB uncompressed, was ${(mainJsStat.size / 1024).toFixed(1)}KB`);
  });

  // -------------------------------------------------------------
  // TEST GROUP 2: CARD 7.2 - Schema.org & Luxury SEO Meta Tags
  // -------------------------------------------------------------
  console.log('\n📦 TEST GROUP 2: Luxury SEO & Schema.org JSON-LD (Card 7.2)');

  const indexPath = path.join(rootDir, 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  runTest('index.html contains parseable Schema.org Hotel JSON-LD markup', () => {
    const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
    const match = indexHtml.match(jsonLdRegex);
    assert.ok(match, 'index.html must have <script type="application/ld+json"> tag');

    const parsed = JSON.parse(match[1].trim());
    assert.strictEqual(parsed['@context'], 'https://schema.org');
    assert.strictEqual(parsed['@type'], 'Hotel');
    assert.strictEqual(parsed.name, 'Oxygen Orbis Hotel & Resort');
  });

  runTest('Schema.org defines Moniya, Ibadan address and geographic coordinates', () => {
    const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
    const parsed = JSON.parse(indexHtml.match(jsonLdRegex)[1].trim());

    assert.strictEqual(parsed.address.addressLocality, 'Ibadan');
    assert.strictEqual(parsed.address.addressRegion, 'Oyo State');
    assert.strictEqual(parsed.address.addressCountry, 'NG');

    assert.strictEqual(parsed.geo.latitude, 7.5250);
    assert.strictEqual(parsed.geo.longitude, 3.9167);
  });

  runTest('Schema.org highlights key resort amenities and Mac Foster nightlife', () => {
    const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
    const parsed = JSON.parse(indexHtml.match(jsonLdRegex)[1].trim());

    const amenityNames = parsed.amenityFeature.map((a) => a.name);
    assert.ok(amenityNames.includes('Swimming Pool'));
    assert.ok(amenityNames.includes('Mac Foster Nightclub & Lounge'));
    assert.ok(amenityNames.includes('Moniya Train Station VIP Chauffeur Shuttle'));
    assert.ok(amenityNames.includes('Guaranteed 24/7 Power'));
  });

  runTest('OpenGraph & Twitter Card social meta tags are configured', () => {
    assert.ok(indexHtml.includes('<meta property="og:title"'));
    assert.ok(indexHtml.includes('<meta property="og:image"'));
    assert.ok(indexHtml.includes('<meta property="og:url" content="https://oxygenorbis.com/"'));
    assert.ok(indexHtml.includes('<meta property="og:image:width" content="1200"'));
    assert.ok(indexHtml.includes('<meta property="og:image:height" content="630"'));
    assert.ok(indexHtml.includes('<meta name="twitter:card" content="summary_large_image"'));
    assert.ok(indexHtml.includes('<meta name="twitter:site" content="@oxygenorbis"'));
  });

  runTest('Geo localization tags pinpoint Moniya, Ibadan', () => {
    assert.ok(indexHtml.includes('<meta name="geo.region" content="NG-OY"'));
    assert.ok(indexHtml.includes('<meta name="geo.placename" content="Moniya, Ibadan"'));
    assert.ok(indexHtml.includes('<meta name="geo.position" content="7.5250;3.9167"'));
  });

  runTest('Schema.org LodgingBusiness schema and room OfferCatalog are indexed', () => {
    const allMatches = [...indexHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(allMatches.length >= 2, 'index.html must include Hotel and LodgingBusiness schemas');

    const lodgingScript = allMatches[1][1].trim();
    const lodging = JSON.parse(lodgingScript);
    assert.strictEqual(lodging['@type'], 'LodgingBusiness');
    assert.strictEqual(lodging.name, 'Oxygen Orbis Hotel & Resort');
    assert.ok(lodging.hasOfferCatalog, 'Must include hasOfferCatalog');

    const roomOffers = lodging.hasOfferCatalog.itemListElement;
    assert.strictEqual(roomOffers.length, 4, 'Must index all 4 Oxygen Orbis room categories');
    const roomNames = roomOffers.map((r) => r.name);
    assert.ok(roomNames.includes('Deluxe King Room'));
    assert.ok(roomNames.includes('Executive Room'));
    assert.ok(roomNames.includes('Presidential Penthouse Suite'));
    assert.ok(roomNames.includes('Deluxe Twin Room'));
  });

  runTest('Primary meta tags target Moniya railway transit and Ibadan staycation keywords', () => {
    const keywordsRegex = /<meta name="keywords" content="([^"]+)" \/>/;
    const match = indexHtml.match(keywordsRegex);
    assert.ok(match, 'Keywords meta tag must exist');
    const kw = match[1].toLowerCase();
    assert.ok(kw.includes('moniya train station'));
    assert.ok(kw.includes('staycation ibadan'));
    assert.ok(kw.includes('oxygen orbis'));
  });

  console.log('\n================================================================');
  console.log(`📊 MODULE 7 SUMMARY: ${passedTests}/16 TESTS PASSED`);
  console.log('🎉 ALL MODULE 7 TESTS (SEO, SECURITY & HOSTING) PASSED PERFECTLY!');
  console.log('================================================================\n');
}

executeTestSuite();
