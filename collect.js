const RSSParser = require("rss-parser");
const fs = require("fs");
const parser = new RSSParser({ timeout: 8000 });

const KEYWORDS_DROIT = [
  "numerique", "digital", "donnees", "data", "rgpd", "gdpr", "ia", "intelligence artificielle",
  "artificial intelligence", "algorithme", "cyber", "plateforme", "platform",
  "blockchain", "crypto", "logiciel", "software", "internet", "cloud",
  "regulation", "loi", "law", "directive", "reglement", "tribunal", "decision", "arret",
  "vie privee", "privacy", "surveillance", "biometrie", "deepfake", "chatgpt",
  "openai", "meta", "google", "apple", "microsoft", "amazon", "tiktok"
];

const KEYWORDS_TECH = [
  "ia", "intelligence artificielle", "artificial intelligence", "ai ", "gpt", "llm",
  "machine learning", "deep learning", "robot", "automation", "tech", "startup",
  "big tech", "google", "apple", "meta", "microsoft", "amazon", "openai", "anthropic",
  "nvidia", "chip", "semiconductor", "cloud", "quantum", "blockchain", "crypto"
];

const KEYWORDS_ARBITRAGE = [
  "arbitrage", "arbitration", "numerique", "digital", "ia", "intelligence artificielle",
  "artificial intelligence", "cyber", "donnees", "data", "plateforme", "platform",
  "logiciel", "software", "brevet", "patent", "propriete intellectuelle", "intellectual property",
  "icsid", "lcia", "icc", "siac", "wipo", "ompi", "online dispute", "odr"
];

function matchesKeywords(article, keywords) {
  var text = ((article.title || "") + " " + (article.description || "")).toLowerCase();
  for (var i = 0; i < keywords.length; i++) {
    if (text.indexOf(keywords[i]) !== -1) return true;
  }
  return false;
}

function getKeywords(category) {
  if (category === "tech") return KEYWORDS_TECH;
  if (category === "arbitrage") return KEYWORDS_ARBITRAGE;
  return KEYWORDS_DROIT;
}

// Helper pour dupliquer une source vers plusieurs categories
function src(name, url, categories, tag, filter) {
  return categories.map(function(cat) {
    return { name: name, url: url, category: cat, tag: tag, filter: filter || false };
  });
}

var SOURCES = [].concat(

  // ── ACTUALITES (onglet 1) + EUROPE ACTU (onglet 3)
  src("CNIL", "https://www.cnil.fr/fr/rss.xml", ["actu", "europe-actu"], "Donnees personnelles", false),
  src("ANSSI", "https://www.cert.ssi.gouv.fr/feed/", ["actu", "europe-actu"], "Cybersecurite", false),
  src("ARCEP", "https://en.arcep.fr/news/follow-regulatory-news/newswire/rss.xml", ["actu", "europe-actu"], "Plateformes", false),
  src("ENISA", "https://www.enisa.europa.eu/rss.xml", ["actu", "europe-actu"], "Cybersecurite", false),
  src("EDPB", "https://www.edpb.europa.eu/feed/news_en", ["actu", "europe-actu"], "RGPD", false),
  src("Parlement EU", "https://www.europarl.europa.eu/rss/doc/top-stories/fr.xml", ["actu", "europe-actu"], "Parlement", true),
  src("Legalis", "https://www.legalis.net/feed/", ["actu", "monde-france-actu"], "Donnees personnelles", false),
  src("Legifrss: numerique", "https://legifrss.org/latest?q=num%C3%A9rique", ["actu", "monde-france-actu"], "Contrats IT", false),
  src("Legifrss: IA", "https://legifrss.org/latest?q=intelligence+artificielle", ["actu", "monde-france-actu"], "IA", false),
  src("Conseil d'Etat", "https://www.conseil-etat.fr/outils/flux-rss/actualites-rss", ["actu", "monde-france-actu"], "Contrats IT", true),
  src("FTC", "https://www.ftc.gov/feeds/press-release.xml", ["actu", "monde-usa-actu"], "Plateformes", true),
  src("The Block", "https://www.theblockcrypto.com/rss.xml", ["actu"], "Blockchain", false),
  src("CoinDesk", "https://www.coindesk.com/arc/outboundfeeds/rss/", ["actu"], "Blockchain", false),

  // ── GOOGLE ACTU — dupliques dans actualites + zones geographiques
  src("Google: IA & droit", "https://news.google.com/rss/search?q=intelligence+artificielle+droit&hl=fr&gl=FR&ceid=FR:fr", ["actu", "europe-actu"], "IA", false),
  src("Google: RGPD", "https://news.google.com/rss/search?q=RGPD+donnees+personnelles&hl=fr&gl=FR&ceid=FR:fr", ["actu", "europe-actu", "monde-france-actu"], "Donnees personnelles", false),
  src("Google: cyber juridique", "https://news.google.com/rss/search?q=cybersecurite+juridique&hl=fr&gl=FR&ceid=FR:fr", ["actu", "europe-actu"], "Cybersecurite", false),
  src("Google: blockchain droit", "https://news.google.com/rss/search?q=blockchain+droit+regulation&hl=fr&gl=FR&ceid=FR:fr", ["actu"], "Blockchain", false),
  src("Google: plateformes", "https://news.google.com/rss/search?q=plateformes+numeriques+regulation&hl=fr&gl=FR&ceid=FR:fr", ["actu", "europe-actu"], "Plateformes", false),
  src("Google: EUR-Lex IA", "https://news.google.com/rss/search?q=EUR-Lex+intelligence+artificielle&hl=fr&gl=FR&ceid=FR:fr", ["actu", "europe-actu"], "IA", false),
  src("Google: OCDE IA", "https://news.google.com/rss/search?q=OCDE+intelligence+artificielle+regulation&hl=fr&gl=FR&ceid=FR:fr", ["actu"], "IA", false),
  src("Google: DPC Ireland", "https://news.google.com/rss/search?q=Data+Protection+Commission+Ireland&hl=en&gl=IE&ceid=IE:en", ["actu", "europe-actu"], "Donnees personnelles", false),

  // ── EUROPE DECISIONS (sous-onglet decisions)
  src("Google: CJUE numerique", "https://news.google.com/rss/search?q=CJUE+arret+numerique+donnees&hl=fr&gl=FR&ceid=FR:fr", ["europe-decisions"], "CJUE", false),
  src("Google: CEDH numerique", "https://news.google.com/rss/search?q=CEDH+arret+numerique+vie+privee&hl=fr&gl=FR&ceid=FR:fr", ["europe-decisions"], "CEDH", false),

  // ── MONDE — FRANCE
  src("Google: jurisprudence FR", "https://news.google.com/rss/search?q=jurisprudence+numerique+France&hl=fr&gl=FR&ceid=FR:fr", ["actu", "monde-france-actu"], "Jurisprudence", false),
  src("Google: droit numerique FR", "https://news.google.com/rss/search?q=droit+numerique+France+loi&hl=fr&gl=FR&ceid=FR:fr", ["monde-france-actu"], "Legislation", false),

  // ── MONDE — USA
  src("Google: US digital law", "https://news.google.com/rss/search?q=US+digital+law+regulation+AI&hl=en&gl=US&ceid=US:en", ["actu", "monde-usa-actu"], "Legislation US", false),
  src("Google: US court tech", "https://news.google.com/rss/search?q=US+court+ruling+technology+data&hl=en&gl=US&ceid=US:en", ["monde-usa-actu"], "Jurisprudence US", false),
  src("Google: CCPA CPRA", "https://news.google.com/rss/search?q=CCPA+CPRA+privacy+enforcement&hl=en&gl=US&ceid=US:en", ["monde-usa-actu"], "Donnees personnelles", false),

  // ── MONDE — UK
  src("Google: UK digital law", "https://news.google.com/rss/search?q=UK+digital+law+regulation+AI&hl=en&gl=GB&ceid=GB:en", ["actu", "monde-uk-actu"], "Legislation UK", false),
  src("Google: UK court tech", "https://news.google.com/rss/search?q=UK+court+ruling+technology+data+privacy&hl=en&gl=GB&ceid=GB:en", ["monde-uk-actu"], "Jurisprudence UK", false),
  src("Google: Online Safety Act", "https://news.google.com/rss/search?q=Online+Safety+Act+UK+enforcement&hl=en&gl=GB&ceid=GB:en", ["monde-uk-actu"], "Plateformes UK", false),

  // ── MONDE — ASIE
  src("Google: China AI law", "https://news.google.com/rss/search?q=China+AI+regulation+law+digital&hl=en&gl=US&ceid=US:en", ["monde-asie-actu"], "Chine", false),
  src("Google: Japan digital law", "https://news.google.com/rss/search?q=Japan+digital+law+data+protection&hl=en&gl=US&ceid=US:en", ["monde-asie-actu"], "Japon", false),
  src("Google: Inde DPDP", "https://news.google.com/rss/search?q=India+DPDP+data+protection+digital&hl=en&gl=US&ceid=US:en", ["monde-asie-actu"], "Inde", false),
  src("Google: Singapore tech law", "https://news.google.com/rss/search?q=Singapore+technology+law+AI+regulation&hl=en&gl=US&ceid=US:en", ["monde-asie-actu"], "Singapour", false),

  // ── MONDE — AUTRES PAYS
  src("Google: Canada AI law", "https://news.google.com/rss/search?q=Canada+AI+law+Bill+C27+digital&hl=en&gl=US&ceid=US:en", ["monde-autres-actu"], "Canada", false),
  src("Google: Bresil LGPD", "https://news.google.com/rss/search?q=Bresil+LGPD+donnees+numerique&hl=fr&gl=FR&ceid=FR:fr", ["monde-autres-actu"], "Bresil", false),
  src("Google: Australie privacy", "https://news.google.com/rss/search?q=Australia+Privacy+Act+digital+AI&hl=en&gl=US&ceid=US:en", ["monde-autres-actu"], "Australie", false),
  src("Google: international AI regulation", "https://news.google.com/rss/search?q=international+AI+regulation+global&hl=en&gl=US&ceid=US:en", ["monde-autres-actu"], "International", false),

  // ── TECH
  src("Numerama", "https://www.numerama.com/feed/", ["tech"], "Tech FR", true),
  src("Next INpact", "https://next.ink/feed/", ["tech"], "Tech FR", true),
  src("The Verge", "https://www.theverge.com/rss/index.xml", ["tech"], "Big Tech", true),
  src("Wired", "https://www.wired.com/feed/rss", ["tech"], "Big Tech", true),
  src("MIT Tech Review", "https://www.technologyreview.com/feed/", ["tech"], "IA Innovation", true),
  src("TechCrunch", "https://techcrunch.com/feed/", ["tech"], "Startups", true),
  src("Google: IA tech", "https://news.google.com/rss/search?q=intelligence+artificielle&hl=fr&gl=FR&ceid=FR:fr", ["tech"], "IA Innovation", false),
  src("Google: big tech", "https://news.google.com/rss/search?q=big+tech+google+apple+meta&hl=fr&gl=FR&ceid=FR:fr", ["tech"], "Big Tech", false),
  src("Google: startups FR", "https://news.google.com/rss/search?q=startups+technologie+france&hl=fr&gl=FR&ceid=FR:fr", ["tech"], "Startups", false),

  // ── ARBITRAGE
  src("GAR", "https://globalarbitrationreview.com/rss", ["arbitrage"], "Arbitrage numerique", true),
  src("OMPI actualites", "https://www.wipo.int/pressroom/fr/rss/", ["arbitrage"], "PI numerique", true),
  src("Google: arbitrage numerique", "https://news.google.com/rss/search?q=arbitrage+international+numerique&hl=fr&gl=FR&ceid=FR:fr", ["arbitrage"], "Arbitrage numerique", false),
  src("Google: arbitrage IA", "https://news.google.com/rss/search?q=arbitrage+intelligence+artificielle&hl=fr&gl=FR&ceid=FR:fr", ["arbitrage"], "Arbitrage numerique", false)
);

function fetchWithTimeout(url) {
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() { reject(new Error("Timeout depasse")); }, 8000);
    parser.parseURL(url).then(function(result) {
      clearTimeout(timer); resolve(result);
    }).catch(function(err) {
      clearTimeout(timer); reject(err);
    });
  });
}

async function collect() {
  var articles = [];
  // Deduplication des URLs pour ne pas fetcher la meme URL plusieurs fois
  var urlMap = {};
  SOURCES.forEach(function(s) {
    if (!urlMap[s.url]) urlMap[s.url] = [];
    urlMap[s.url].push(s);
  });

  var urls = Object.keys(urlMap);
  for (var i = 0; i < urls.length; i++) {
    var url = urls[i];
    var sources = urlMap[url];
    try {
      var feed = await fetchWithTimeout(url);
      var items = (feed.items || []).slice(0, 15);
      sources.forEach(function(source) {
        var count = 0;
        items.forEach(function(item) {
          var desc = item.contentSnippet || item.summary || "";
          var article = {
            source: source.name,
            category: source.category,
            tag: source.tag,
            title: (item.title || "").replace(/<[^>]+>/g, "").trim(),
            description: desc.replace(/<[^>]+>/g, "").trim().slice(0, 280),
            link: (item.link || item.guid || "") + "|" + source.category,
            originalLink: item.link || item.guid || "",
            date: item.isoDate || null,
          };
          if (source.filter && !matchesKeywords(article, getKeywords(source.category))) return;
          articles.push(article);
          count++;
        });
        console.log("OK " + source.name + " [" + source.category + "] (" + count + ")");
      });
    } catch(e) {
      console.log("IGNORE " + sources[0].name + ": " + e.message);
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

collect().catch(function(e) { console.error(e); process.exit(1); });
