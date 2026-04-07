const RSSParser = require("rss-parser");
const fs = require("fs");
const parser = new RSSParser({ timeout: 8000 });

const SOURCES = [
  // DROIT — sources officielles
  { name: "CNIL", url: "https://www.cnil.fr/fr/rss.xml", category: "droit", tag: "Donnees personnelles" },
  { name: "ANSSI", url: "https://www.cert.ssi.gouv.fr/feed/", category: "droit", tag: "Cybersecurite" },
  { name: "ARCEP", url: "https://en.arcep.fr/news/follow-regulatory-news/newswire/rss.xml", category: "droit", tag: "Plateformes" },
  { name: "EDPB", url: "https://www.edpb.europa.eu/feed/news_en", category: "droit", tag: "Donnees personnelles" },
  { name: "Parlement EU", url: "https://www.europarl.europa.eu/rss/doc/top-stories/fr.xml", category: "droit", tag: "Contrats IT" },
  { name: "ENISA", url: "https://www.enisa.europa.eu/rss.xml", category: "droit", tag: "Cybersecurite" },
  { name: "Legalis", url: "https://www.legalis.net/feed/", category: "droit", tag: "Donnees personnelles" },
  { name: "Conseil d'Etat", url: "https://www.conseil-etat.fr/outils/flux-rss/actualites-rss", category: "droit", tag: "Contrats IT" },
  { name: "Conseil d'Etat avis", url: "https://www.conseil-etat.fr/outils/flux-rss/avis-rss", category: "droit", tag: "Contrats IT" },
  { name: "Google: DPC Ireland", url: "https://news.google.com/rss/search?q=Data+Protection+Commission+Ireland&hl=en&gl=IE&ceid=IE:en", category: "droit", tag: "Donnees personnelles" },
  { name: "Google: droit.org", url: "https://news.google.com/rss/search?q=jurisprudence+numerique+France&hl=fr&gl=FR&ceid=FR:fr", category: "droit", tag: "Donnees personnelles" },
  { name: "Google: EUR-Lex IA", url: "https://news.google.com/rss/search?q=EUR-Lex+intelligence+artificielle&hl=fr&gl=FR&ceid=FR:fr", category: "droit", tag: "IA" },
  { name: "Legifrss: numerique", url: "https://legifrss.org/latest?q=num%C3%A9rique", category: "droit", tag: "Contrats IT" },
  { name: "Legifrss: IA", url: "https://legifrss.org/latest?q=intelligence+artificielle", category: "droit", tag: "IA" },


  { name: "Google: arbitrage IA", url: "https://news.google.com/rss/search?q=arbitrage+intelligence+artificielle&hl=fr&gl=FR&ceid=FR:fr", category: "arbitrage", tag: "Arbitrage" },
  { name: "FTC", url: "https://www.ftc.gov/feeds/press-release.xml", category: "droit", tag: "Plateformes" },
  { name: "Google: OCDE IA", url: "https://news.google.com/rss/search?q=OCDE+intelligence+artificielle+regulation&hl=fr&gl=FR&ceid=FR:fr", category: "droit", tag: "IA" },
  { name: "The Block", url: "https://www.theblockcrypto.com/rss.xml", category: "droit", tag: "Blockchain" },
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "droit", tag: "Blockchain" },

  // DROIT — Google Actualités par mots-clés
  { name: "Google: IA & droit", url: "https://news.google.com/rss/search?q=intelligence+artificielle+droit&hl=fr&gl=FR&ceid=FR:fr", category: "droit", tag: "IA" },
  { name: "Google: RGPD", url: "https://news.google.com/rss/search?q=RGPD+donnees+personnelles&hl=fr&gl=FR&ceid=FR:fr", category: "droit", tag: "Donnees personnelles" },
  { name: "Google: cyber juridique", url: "https://news.google.com/rss/search?q=cybersecurite+juridique&hl=fr&gl=FR&ceid=FR:fr", category: "droit", tag: "Cybersecurite" },
  { name: "Google: blockchain droit", url: "https://news.google.com/rss/search?q=blockchain+droit+regulation&hl=fr&gl=FR&ceid=FR:fr", category: "droit", tag: "Blockchain" },
  { name: "Google: plateformes", url: "https://news.google.com/rss/search?q=plateformes+numeriques+regulation&hl=fr&gl=FR&ceid=FR:fr", category: "droit", tag: "Plateformes" },

  // TECH — sources officielles
  { name: "Numerama", url: "https://www.numerama.com/feed/", category: "tech", tag: "Tech FR" },
  { name: "Next INpact", url: "https://next.ink/feed/", category: "tech", tag: "Tech FR" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", category: "tech", tag: "Big Tech" },
  { name: "Wired", url: "https://www.wired.com/feed/rss", category: "tech", tag: "Big Tech" },
  { name: "MIT Tech Review", url: "https://www.technologyreview.com/feed/", category: "tech", tag: "IA Innovation" },
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "tech", tag: "Startups" },

  // TECH — Google Actualités par mots-clés
  { name: "Google: IA tech", url: "https://news.google.com/rss/search?q=intelligence+artificielle&hl=fr&gl=FR&ceid=FR:fr", category: "tech", tag: "IA Innovation" },
  { name: "Google: big tech", url: "https://news.google.com/rss/search?q=big+tech+google+apple+meta&hl=fr&gl=FR&ceid=FR:fr", category: "tech", tag: "Big Tech" },
  { name: "Google: startups FR", url: "https://news.google.com/rss/search?q=startups+technologie+france&hl=fr&gl=FR&ceid=FR:fr", category: "tech", tag: "Startups" },

  // ARBITRAGE
  { name: "GAR", url: "https://globalarbitrationreview.com/rss", category: "arbitrage", tag: "Arbitrage" },
  { name: "Google: arbitrage IA", url: "https://news.google.com/rss/search?q=arbitrage+intelligence+artificielle&hl=fr&gl=FR&ceid=FR:fr", category: "arbitrage", tag: "Arbitrage" },
  { name: "OMPI actualites", url: "https://www.wipo.int/pressroom/fr/rss/", category: "arbitrage", tag: "PI numerique" },
  { name: "Google: arbitrage numerique", url: "https://news.google.com/rss/search?q=arbitrage+international+numerique&hl=fr&gl=FR&ceid=FR:fr", category: "arbitrage", tag: "Arbitrage" },
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
