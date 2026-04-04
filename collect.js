const RSSParser = require("rss-parser");
const fs = require("fs");
const parser = new RSSParser({ timeout: 8000 });

const SOURCES = [
  { name: "CNIL", url: "https://www.cnil.fr/fr/rss.xml", category: "droit", tag: "Donnees personnelles" },
  { name: "ANSSI", url: "https://www.ssi.gouv.fr/feed/", category: "droit", tag: "Cybersecurite" },
  { name: "ARCEP", url: "https://www.arcep.fr/rss/actualites.xml", category: "droit", tag: "Plateformes" },
  { name: "EDPB", url: "https://www.edpb.europa.eu/rss/edpb_news_rss_en.xml", category: "droit", tag: "Donnees personnelles" },
  { name: "EUR-Lex", url: "https://eur-lex.europa.eu/rss/rss.xml?type=whatsNew&search=OJ_L&lang=fr", category: "droit", tag: "Contrats IT" },
  { name: "ENISA", url: "https://www.enisa.europa.eu/rss.xml", category: "droit", tag: "Cybersecurite" },
  { name: "Legalis", url: "https://www.legalis.net/feed/", category: "droit", tag: "Donnees personnelles" },
  { name: "ICO UK", url: "https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/rss/", category: "droit", tag: "Donnees personnelles" },
  { name: "FTC", url: "https://www.ftc.gov/feeds/press-release.xml", category: "droit", tag: "Plateformes" },
  { name: "Numerama", url: "https://www.numerama.com/feed/", category: "tech", tag: "Tech FR" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", category: "tech", tag: "Big Tech" },
  { name: "Wired", url: "https://www.wired.com/feed/rss", category: "tech", tag: "Big Tech" },
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "tech", tag: "Startups" },
  { name: "Kluwer Arbitration", url: "https://arbitrationblog.kluwerarbitration.com/feed/", category: "arbitrage", tag: "Arbitrage" },
];

function fetchWithTimeout(url) {
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() {
      reject(new Error("Timeout depasse"));
    }, 8000);
    parser.parseURL(url).then(function(result) {
      clearTimeout(timer);
      resolve(result);
    }).catch(function(err) {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function collect() {
  var articles = [];

  for (var i = 0; i < SOURCES.length; i++) {
    var source = SOURCES[i];
    try {
      var feed = await fetchWithTimeout(source.url);
      var items = (feed.items || []).slice(0, 15);
      for (var j = 0; j < items.length; j++) {
        var item = items[j];
        var desc = item.contentSnippet || item.summary || "";
        articles.push({
          source: source.name,
          category: source.category,
          tag: source.tag,
          title: (item.title || "").replace(/<[^>]+>/g, "").trim(),
          description: desc.replace(/<[^>]+>/g, "").trim().slice(0, 280),
          link: item.link || item.guid || "",
          date: item.isoDate || null,
        });
      }
      console.log("OK " + source.name + " (" + items.length + ")");
    } catch(e) {
      console.log("IGNORE " + source.name + ": " + e.message);
    }
  }

  var existing = [];
  var dataPath = "data/articles.json";
  if (fs.existsSync(dataPath)) {
    try {
      var raw = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      existing = raw.articles || [];
    } catch(e) {}
  }

  var existingLinks = {};
  existing.forEach(function(a) { if (a.link) existingLinks[a.link] = true; });
  var newOnes = articles.filter(function(a) { return a.link && !existingLinks[a.link]; });
  var merged = existing.concat(newOnes);
  merged.sort(function(a, b) {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  if (!fs.existsSync("data")) fs.mkdirSync("data");
  fs.writeFileSync(dataPath, JSON.stringify({
    lastUpdate: new Date().toISOString(),
    totalArticles: merged.length,
    articles: merged,
  }, null, 2));

  console.log("Total : " + merged.length + " articles.");
}

collect().catch(function(e) {
  console.error(e);
  process.exit(1);
});
