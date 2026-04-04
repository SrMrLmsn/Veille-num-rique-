const RSSParser = require('rss-parser');
const fs = require('fs');
const parser = new RSSParser({ timeout: 10000 });

const SOURCES = [
  { name: 'CNIL', url: 'https://www.cnil.fr/fr/rss.xml', category: 'veille', tag: 'Donnees personnelles' },
  { name: 'ANSSI', url: 'https://www.ssi.gouv.fr/feed/', category: 'veille', tag: 'Cybersecurite' },
  { name: 'EDPB', url: 'https://www.edpb.europa.eu/rss/edpb_news_rss_en.xml', category: 'veille', tag: 'RGPD' },
  { name: 'Numerama', url: 'https://www.numerama.com/feed/', category: 'tech', tag: 'Tech' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'tech', tag: 'Big Tech' },
];

async function collect() {
  const articles = [];
  for (const source of SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);
      for (const item of (feed.items || []).slice(0, 15)) {
        articles.push({
          source: source.name,
          category: source.category,
          tag: source.tag,
          title: (item.title || '').replace(/<[^>]+>/g, '').trim(),
          description: (item.contentSnippet || item.summary || '').replace(/<[^>]+>/g, '').trim().slice(0, 280),
          link: item.link || '',
          date: item.isoDate || null,
        });
      }
      console.log('OK ' + source.name);
    } catch (e) {
      console.log('ERREUR ' + source.name + ': ' + e.message);
    }
  }

  articles.sort(function(a, b) {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  if (!fs.existsSync('data')) fs.mkdirSync('data');
  fs.writeFileSync('data/articles.json', JSON.stringify({
    lastUpdate: new Date().toISOString(),
    totalArticles: articles.length,
    articles: articles,
  }, null, 2));

  console.log('Sauvegarde OK - ' + articles.length + ' articles');
}

collect().catch(function(e) {
  console.error(e);
  process.exit(1);
});
