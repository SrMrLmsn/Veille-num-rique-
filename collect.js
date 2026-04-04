/**

- collect.js — Collecteur RSS pour veille juridique numérique
- 
- Usage :
- node collect.js           → collecte et sauvegarde dans data/articles.json
- node collect.js –dry-run → affiche le résultat sans sauvegarder
- 
- Dépendances :
- npm install rss-parser
  */

const RSSParser = require(‘rss-parser’);
const fs = require(‘fs’);
const path = require(‘path’);

const parser = new RSSParser({
timeout: 10000,
headers: { ‘User-Agent’: ‘VeilleJuridique/1.0 (legal research bot)’ }
});

// ── SOURCES ──────────────────────────────────────────────────────────────────
// category : “veille” = onglet Veille Juridique | “tech” = onglet Actu Tech
const SOURCES = [
// ── Autorités françaises
{
name: ‘CNIL’,
url: ‘https://www.cnil.fr/fr/rss.xml’,
category: ‘veille’,
tag: ‘Données personnelles’
},
{
name: ‘ANSSI’,
url: ‘https://www.ssi.gouv.fr/feed/’,
category: ‘veille’,
tag: ‘Cybersécurité’
},
{
name: ‘ARCEP’,
url: ‘https://www.arcep.fr/rss/actualites.xml’,
category: ‘veille’,
tag: ‘Régulation télécom’
},

// ── Institutions européennes
{
name: ‘EDPB’,
url: ‘https://www.edpb.europa.eu/rss/edpb_news_rss_en.xml’,
category: ‘veille’,
tag: ‘RGPD / UE’
},
{
name: ‘EUR-Lex’,
url: ‘https://eur-lex.europa.eu/rss/rss.xml?type=whatsNew&search=OJ_L&lang=fr’,
category: ‘veille’,
tag: ‘JOUE’
},
{
name: ‘Commission UE’,
url: ‘https://ec.europa.eu/newsroom/dae/rss.cfm?item_type=1131’,
category: ‘veille’,
tag: ‘Digital Policy’
},

// ── Actu tech & innovation
{
name: ‘Next INpact’,
url: ‘https://www.nextinpact.com/rss/news.xml’,
category: ‘tech’,
tag: ‘Tech FR’
},
{
name: ‘Numerama’,
url: ‘https://www.numerama.com/feed/’,
category: ‘tech’,
tag: ‘Tech FR’
},
{
name: ‘The Verge’,
url: ‘https://www.theverge.com/rss/index.xml’,
category: ‘tech’,
tag: ‘Big Tech’
},
];

// ── HELPERS ──────────────────────────────────────────────────────────────────
function cleanText(str) {
if (!str) return ‘’;
return str
.replace(/<[^>]+>/g, ‘’) // strip HTML tags
.replace(/&/g, ‘&’)
.replace(/</g, ‘<’)
.replace(/>/g, ‘>’)
.replace(/"/g, ‘”’)
.replace(/'/g, “’”)
.replace(/\s+/g, ’ ’)
.trim()
.slice(0, 280); // limit description length
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function collect() {
const isDryRun = process.argv.includes(’–dry-run’);
const articles = [];
const errors = [];

console.log(`\n📰 Collecte RSS — ${new Date().toLocaleString('fr-FR')}\n`);

for (const source of SOURCES) {
try {
process.stdout.write(` → ${source.name.padEnd(16)}`);
const feed = await parser.parseURL(source.url);
const items = (feed.items || []).slice(0, 20); // max 20 par source

```
  for (const item of items) {
    articles.push({
      id: Buffer.from(item.link || item.title || '').toString('base64').slice(0, 16),
      source: source.name,
      category: source.category,
      tag: source.tag,
      title: cleanText(item.title),
      description: cleanText(item.contentSnippet || item.summary || item.content),
      link: item.link || item.guid || '',
      date: item.isoDate || item.pubDate || null,
    });
  }

  console.log(`✓ ${items.length} articles`);
} catch (err) {
  console.log(`✗ ERREUR (${err.message})`);
  errors.push({ source: source.name, error: err.message });
}
```

}

// Sort by date desc
articles.sort((a, b) => {
if (!a.date && !b.date) return 0;
if (!a.date) return 1;
if (!b.date) return -1;
return new Date(b.date) - new Date(a.date);
});

const output = {
lastUpdate: new Date().toISOString(),
totalArticles: articles.length,
errors: errors.length > 0 ? errors : undefined,
articles,
};

console.log(`\n✅ ${articles.length} articles collectés au total`);

if (errors.length > 0) {
console.log(`⚠️  ${errors.length} source(s) en erreur :`);
errors.forEach(e => console.log(`   - ${e.source}: ${e.error}`));
}

if (isDryRun) {
console.log(’\n[DRY RUN] — aucune sauvegarde effectuée’);
console.log(‘Aperçu (5 premiers articles) :’);
articles.slice(0, 5).forEach(a => {
console.log(`  [${a.source}] ${a.title}`);
});
return;
}

// Save to data/articles.json
const dataDir = path.join(__dirname, ‘data’);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const outPath = path.join(dataDir, ‘articles.json’);
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), ‘utf8’);
console.log(`\n💾 Sauvegardé → ${outPath}`);
}

collect().catch(err => {
console.error(‘Erreur fatale :’, err);
process.exit(1);
});
