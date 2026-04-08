const RSSParser = require("rss-parser");
const fs = require("fs");
const parser = new RSSParser({ timeout: 8000 });

// ── MOTS-CLES GENERAUX (droit du numerique)
const KEYWORDS_GENERAL = [
  // Droit & regulation
  "law", "legal", "legislation", "regulation", "directive", "ruling", "decision",
  "judgment", "court", "tribunal", "sanction", "fine", "penalty", "compliance",
  "enforcement", "liability", "rights", "gdpr", "rgpd", "dma", "dsa", "ai act",
  "dora", "ccpa", "nis2", "cyber resilience",
  // Donnees & vie privee
  "data", "personal data", "donnees", "privacy", "vie privee", "surveillance",
  "tracking", "consent", "consentement", "breach", "violation", "cookies",
  "biometric", "biometrie", "facial recognition", "reconnaissance faciale",
  // Intelligence artificielle
  "artificial intelligence", "intelligence artificielle", "machine learning",
  "deep learning", "algorithm", "algorithme", "llm", "gpt", "generative ai",
  "ia generative", "chatgpt", "openai", "autonomous system", "deepfake",
  // Cybersecurite
  "cybersecurity", "cybersecurite", "cyber attack", "cyberattaque", "ransomware",
  "malware", "hacking", "vulnerability", "vulnerabilite", "incident", "data breach",
  "critical infrastructure",
  // Plateformes & numerique
  "platform", "plateforme", "digital", "numerique", "online", "internet",
  "social media", "reseaux sociaux", "content moderation", "moderation",
  "marketplace", "e-commerce", "app store", "cloud", "hosting", "hebergement",
  // Blockchain & crypto
  "blockchain", "crypto", "cryptocurrency", "cryptomonnaie", "token", "nft",
  "defi", "smart contract", "bitcoin", "ethereum", "stablecoin", "web3", "dao"
];

// ── MOTS-CLES ARBITRAGE (double condition)
const KEYWORDS_ARB_ARBITRAGE = [
  "arbitration", "arbitrage", "icsid", "lcia", "icc arbitration", "siac",
  "wipo arbitration", "ompi arbitrage", "mediation", "odr", "online dispute"
];

const KEYWORDS_ARB_NUMERIQUE = [
  "data", "digital", "numerique", "ai", "artificial intelligence",
  "cyber", "platform", "plateforme", "blockchain", "crypto", "software",
  "logiciel", "intellectual property", "propriete intellectuelle", "patent",
  "brevet", "tech", "internet", "algorithm", "deepfake", "cloud"
];

// ── MOTS-CLES TECH
const KEYWORDS_TECH = [
  "artificial intelligence", "intelligence artificielle", "ai ", "gpt", "llm",
  "machine learning", "deep learning", "robot", "automation", "tech", "startup",
  "big tech", "google", "apple", "meta", "microsoft", "amazon", "openai",
  "anthropic", "nvidia", "chip", "semiconductor", "cloud", "quantum",
  "blockchain", "crypto", "algorithm", "deepfake", "autonomous"
];

// ── TAGGING AUTOMATIQUE PAR CONTENU
const TAG_RULES = [
  {
    tag: "Blockchain",
    keywords: [
      "blockchain", "crypto", "cryptocurrency", "cryptomonnaie", "bitcoin", "ethereum",
      "nft", "token", "defi", "smart contract", "web3", "dao", "stablecoin", "coinbase",
      "binance", "wallet", "mining", "proof of stake", "proof of work"
    ]
  },
  {
    tag: "IA",
    keywords: [
      "artificial intelligence", "intelligence artificielle", "machine learning", "deep learning",
      "llm", "gpt", "chatgpt", "openai", "anthropic", "gemini", "deepfake", "autonomous system",
      "systeme autonome", "algorithme", "algorithm", "generative ai", "ia generative",
      "ai act", "foundation model", "neural network", "reseau de neurones"
    ]
  },
  {
    tag: "Cybersecurite",
    keywords: [
      "cybersecurity", "cybersecurite", "ransomware", "malware", "hacking", "hack",
      "vulnerability", "vulnerabilite", "data breach", "violation de donnees", "cyberattaque",
      "cyber attack", "phishing", "ddos", "zero day", "intrusion", "anssi", "enisa",
      "nis2", "dora", "critical infrastructure", "infrastructure critique"
    ]
  },
  {
    tag: "Contrats IT",
    keywords: [
      "smart contract", "contrat informatique", "contrat it", "contrat logiciel",
      "contrat saas", "software agreement", "it contract", "licence logiciel",
      "software licence", "software license", "contrat cloud", "cloud agreement",
      "contrat d'hebergement", "hosting agreement", "contrat de maintenance",
      "infogérance", "infogerance", "outsourcing it", "contrat numerique",
      "digital contract", "contrat de developpement", "contrat d'integration",
      "contrat ia", "ai contract", "contrat de donnees", "data agreement",
      "data sharing agreement", "contrat de sous-traitance informatique"
    ]
  },
  {
    tag: "Plateformes",
    keywords: [
      "platform", "plateforme", "social media", "reseaux sociaux", "content moderation",
      "moderation de contenu", "marketplace", "app store", "google play", "dma",
      "dsa", "gatekeeper", "very large platform", "vlop", "tiktok", "meta", "youtube",
      "twitter", "x.com", "instagram", "facebook", "linkedin", "apple", "google",
      "amazon", "interoperabilite", "interoperability"
    ]
  },
  {
    tag: "Donnees personnelles",
    keywords: [
      "personal data", "donnees personnelles", "privacy", "vie privee", "rgpd", "gdpr",
      "consent", "consentement", "cookies", "surveillance", "biometric", "biometrie",
      "facial recognition", "reconnaissance faciale", "data protection", "protection des donnees",
      "dpo", "cnil", "edpb", "ico", "right to erasure", "droit a l'effacement",
      "data subject", "personne concernee", "profiling", "profilage"
    ]
  }
];

function autoTag(article) {
  var text = ((article.title || "") + " " + (article.description || "")).toLowerCase();
  for (var i = 0; i < TAG_RULES.length; i++) {
    var rule = TAG_RULES[i];
    for (var j = 0; j < rule.keywords.length; j++) {
      if (text.indexOf(rule.keywords[j]) !== -1) {
        return rule.tag;
      }
    }
  }
  return "Numerique"; // tag par defaut
}

function containsAny(text, keywords) {
  var t = text.toLowerCase();
  for (var i = 0; i < keywords.length; i++) {
    if (t.indexOf(keywords[i]) !== -1) return true;
  }
  return false;
}

function shouldKeep(article, category) {
  var text = (article.title || "") + " " + (article.description || "");
  if (category === "arbitrage") {
    return containsAny(text, KEYWORDS_ARB_ARBITRAGE) && containsAny(text, KEYWORDS_ARB_NUMERIQUE);
  }
  if (category === "tech") {
    return containsAny(text, KEYWORDS_TECH);
  }
  return containsAny(text, KEYWORDS_GENERAL);
}

function src(name, url, categories, tag, filter) {
  return categories.map(function(cat) {
    return { name: name, url: url, category: cat, tag: tag, filter: filter || false };
  });
}

var SOURCES = [].concat(
  // ACTUALITES + EUROPE ACTU
  src("CNIL", "https://www.cnil.fr/fr/rss.xml", ["actu", "europe-actu"], "Donnees personnelles", false),
  src("Google: CNIL", "https://news.google.com/rss/search?q=CNIL+donnees+personnelles&hl=fr&gl=FR&ceid=FR:fr", ["actu", "europe-actu"], "Donnees personnelles", false),
  src("ANSSI", "https://www.cert.ssi.gouv.fr/feed/", ["actu", "europe-actu"], "Cybersecurite", false),
  src("ARCEP", "https://en.arcep.fr/news/follow-regulatory-news/newswire/rss.xml", ["actu", "europe-actu"], "Plateformes", false),
  src("ARCOM", "https://www.arcom.fr/rss/actualites.xml", ["actu", "europe-actu"], "Plateformes", false),
  src("ENISA", "https://www.enisa.europa.eu/rss.xml", ["actu", "europe-actu"], "Cybersecurite", false),
  src("EDPB", "https://www.edpb.europa.eu/feed/news_en", ["actu", "europe-actu"], "RGPD", false),
  src("Parlement EU", "https://www.europarl.europa.eu/rss/doc/top-stories/fr.xml", ["actu", "europe-actu"], "Parlement", true),
  src("Legalis", "https://www.legalis.net/feed/", ["actu", "monde-france-actu"], "Donnees personnelles", false),
  src("Conseil d'Etat", "https://www.conseil-etat.fr/outils/flux-rss/actualites-rss", ["actu", "monde-france-actu"], "Contrats IT", true),
  src("FTC", "https://www.ftc.gov/feeds/press-release.xml", ["actu", "monde-usa-actu"], "Plateformes", true),
  src("The Block", "https://www.theblockcrypto.com/rss.xml", ["actu"], "Blockchain", false),
  src("CoinDesk", "https://www.coindesk.com/arc/outboundfeeds/rss/", ["actu"], "Blockchain", false),

  // GOOGLE ACTU
  src("Google: IA & droit", "https://news.google.com/rss/search?q=intelligence+artificielle+droit&hl=fr&gl=FR&ceid=FR:fr", ["actu", "europe-actu"], "IA", false),
  src("Google: AI law", "https://news.google.com/rss/search?q=artificial+intelligence+law+regulation&hl=en&gl=US&ceid=US:en", ["actu", "europe-actu"], "IA", false),
  src("Google: RGPD", "https://news.google.com/rss/search?q=RGPD+donnees+personnelles&hl=fr&gl=FR&ceid=FR:fr", ["actu", "europe-actu", "monde-france-actu"], "Donnees personnelles", false),
  src("Google: GDPR", "https://news.google.com/rss/search?q=GDPR+personal+data+enforcement&hl=en&gl=US&ceid=US:en", ["actu", "europe-actu"], "Donnees personnelles", false),
  src("Google: cyber juridique", "https://news.google.com/rss/search?q=cybersecurite+juridique&hl=fr&gl=FR&ceid=FR:fr", ["actu", "europe-actu"], "Cybersecurite", false),
  src("Google: cyber law", "https://news.google.com/rss/search?q=cybersecurity+law+regulation&hl=en&gl=US&ceid=US:en", ["actu", "europe-actu"], "Cybersecurite", false),
  src("Google: blockchain droit", "https://news.google.com/rss/search?q=blockchain+droit+regulation&hl=fr&gl=FR&ceid=FR:fr", ["actu"], "Blockchain", false),
  src("Google: blockchain law", "https://news.google.com/rss/search?q=blockchain+crypto+regulation+law&hl=en&gl=US&ceid=US:en", ["actu"], "Blockchain", false),
  src("Google: plateformes", "https://news.google.com/rss/search?q=plateformes+numeriques+regulation&hl=fr&gl=FR&ceid=FR:fr", ["actu", "europe-actu"], "Plateformes", false),
  src("Google: platform law", "https://news.google.com/rss/search?q=digital+platform+regulation+enforcement&hl=en&gl=US&ceid=US:en", ["actu", "europe-actu"], "Plateformes", false),
  src("Google: EUR-Lex IA", "https://news.google.com/rss/search?q=EUR-Lex+intelligence+artificielle&hl=fr&gl=FR&ceid=FR:fr", ["actu", "europe-actu"], "IA", false),
  src("Google: OCDE IA", "https://news.google.com/rss/search?q=OCDE+intelligence+artificielle+regulation&hl=fr&gl=FR&ceid=FR:fr", ["actu"], "IA", false),
  src("Google: DPC Ireland", "https://news.google.com/rss/search?q=Data+Protection+Commission+Ireland+GDPR&hl=en&gl=IE&ceid=IE:en", ["actu", "europe-actu"], "Donnees personnelles", false),

  // EUROPE DECISIONS
  src("Google: CJUE numerique", "https://news.google.com/rss/search?q=CJUE+arret+numerique+donnees&hl=fr&gl=FR&ceid=FR:fr", ["europe-decisions"], "CJUE", false),
  src("Google: CJEU digital", "https://news.google.com/rss/search?q=CJEU+ruling+digital+data+privacy&hl=en&gl=US&ceid=US:en", ["europe-decisions"], "CJUE", false),
  src("Google: CEDH numerique", "https://news.google.com/rss/search?q=CEDH+arret+numerique+vie+privee&hl=fr&gl=FR&ceid=FR:fr", ["europe-decisions"], "CEDH", false),
  src("Google: ECHR digital", "https://news.google.com/rss/search?q=ECHR+ruling+digital+privacy+surveillance&hl=en&gl=US&ceid=US:en", ["europe-decisions"], "CEDH", false),

  // MONDE FRANCE
  src("Google: jurisprudence FR", "https://news.google.com/rss/search?q=jurisprudence+numerique+France&hl=fr&gl=FR&ceid=FR:fr", ["actu", "monde-france-actu"], "Jurisprudence", false),
  src("Google: droit numerique FR", "https://news.google.com/rss/search?q=droit+numerique+France+loi&hl=fr&gl=FR&ceid=FR:fr", ["monde-france-actu"], "Legislation", false),

  // MONDE USA
  src("Google: US digital law", "https://news.google.com/rss/search?q=US+digital+law+regulation+AI&hl=en&gl=US&ceid=US:en", ["actu", "monde-usa-actu"], "Legislation US", false),
  src("Google: US court tech", "https://news.google.com/rss/search?q=US+court+ruling+technology+data+privacy&hl=en&gl=US&ceid=US:en", ["monde-usa-actu"], "Jurisprudence US", false),
  src("Google: CCPA CPRA", "https://news.google.com/rss/search?q=CCPA+CPRA+privacy+enforcement&hl=en&gl=US&ceid=US:en", ["monde-usa-actu"], "Donnees personnelles", false),

  // MONDE UK
  src("Google: UK digital law", "https://news.google.com/rss/search?q=UK+digital+law+regulation+AI&hl=en&gl=GB&ceid=GB:en", ["actu", "monde-uk-actu"], "Legislation UK", false),
  src("Google: UK court tech", "https://news.google.com/rss/search?q=UK+court+ruling+technology+data+privacy&hl=en&gl=GB&ceid=GB:en", ["monde-uk-actu"], "Jurisprudence UK", false),
  src("Google: Online Safety Act", "https://news.google.com/rss/search?q=Online+Safety+Act+UK+enforcement&hl=en&gl=GB&ceid=GB:en", ["monde-uk-actu"], "Plateformes UK", false),

  // MONDE ASIE
  src("Google: China AI law", "https://news.google.com/rss/search?q=China+AI+regulation+law+digital&hl=en&gl=US&ceid=US:en", ["monde-asie-actu"], "Chine", false),
  src("Google: Japan digital law", "https://news.google.com/rss/search?q=Japan+digital+law+data+protection&hl=en&gl=US&ceid=US:en", ["monde-asie-actu"], "Japon", false),
  src("Google: India DPDP", "https://news.google.com/rss/search?q=India+DPDP+data+protection+digital&hl=en&gl=US&ceid=US:en", ["monde-asie-actu"], "Inde", false),
  src("Google: Singapore tech law", "https://news.google.com/rss/search?q=Singapore+technology+law+AI+regulation&hl=en&gl=US&ceid=US:en", ["monde-asie-actu"], "Singapour", false),

  // MONDE AUTRES
  src("Google: Canada AI law", "https://news.google.com/rss/search?q=Canada+AI+law+Bill+C27+digital&hl=en&gl=US&ceid=US:en", ["monde-autres-actu"], "Canada", false),
  src("Google: Brazil LGPD", "https://news.google.com/rss/search?q=Brazil+LGPD+data+protection+digital&hl=en&gl=US&ceid=US:en", ["monde-autres-actu"], "Bresil", false),
  src("Google: Australia privacy", "https://news.google.com/rss/search?q=Australia+Privacy+Act+digital+AI&hl=en&gl=US&ceid=US:en", ["monde-autres-actu"], "Australie", false),
  src("Google: international AI", "https://news.google.com/rss/search?q=international+AI+regulation+global+digital+law&hl=en&gl=US&ceid=US:en", ["monde-autres-actu"], "International", false),

  // TECH
  src("Numerama", "https://www.numerama.com/feed/", ["tech"], "Tech FR", true),
  src("Next INpact", "https://next.ink/feed/", ["tech"], "Tech FR", true),
  src("The Verge", "https://www.theverge.com/rss/index.xml", ["tech"], "Big Tech", true),
  src("Wired", "https://www.wired.com/feed/rss", ["tech"], "Big Tech", true),
  src("MIT Tech Review", "https://www.technologyreview.com/feed/", ["tech"], "IA Innovation", true),
  src("TechCrunch", "https://techcrunch.com/feed/", ["tech"], "Startups", true),
  src("Google: IA tech", "https://news.google.com/rss/search?q=intelligence+artificielle&hl=fr&gl=FR&ceid=FR:fr", ["tech"], "IA Innovation", false),
  src("Google: big tech", "https://news.google.com/rss/search?q=big+tech+google+apple+meta&hl=fr&gl=FR&ceid=FR:fr", ["tech"], "Big Tech", false),
  src("Google: startups FR", "https://news.google.com/rss/search?q=startups+technologie+france&hl=fr&gl=FR&ceid=FR:fr", ["tech"], "Startups", false),

  // ARBITRAGE (double condition : arbitrage + numerique)
  src("GAR", "https://globalarbitrationreview.com/rss", ["arbitrage"], "Arbitrage numerique", true),
  src("OMPI actualites", "https://www.wipo.int/pressroom/fr/rss/", ["arbitrage"], "PI numerique", true),
  src("Google: arbitrage numerique", "https://news.google.com/rss/search?q=arbitrage+international+numerique&hl=fr&gl=FR&ceid=FR:fr", ["arbitrage"], "Arbitrage numerique", false),
  src("Google: arbitrage IA", "https://news.google.com/rss/search?q=arbitrage+intelligence+artificielle&hl=fr&gl=FR&ceid=FR:fr", ["arbitrage"], "Arbitrage numerique", false),
  src("Google: AI arbitration", "https://news.google.com/rss/search?q=AI+arbitration+digital+dispute&hl=en&gl=US&ceid=US:en", ["arbitrage"], "Arbitrage numerique", false),
  src("Google: tech arbitration", "https://news.google.com/rss/search?q=technology+arbitration+data+cyber&hl=en&gl=US&ceid=US:en", ["arbitrage"], "Arbitrage numerique", false)
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
          // Filtre universel : TOUS les articles sont filtres
          if (!shouldKeep(article, source.category)) return;
          // Auto-tagging par contenu (sauf pour tech et arbitrage)
          if (source.category !== "tech" && source.category !== "arbitrage") {
            article.tag = autoTag(article);
          }
          articles.push(article);
          count++;
        });
        if (count > 0) console.log("OK " + source.name + " [" + source.category + "] (" + count + ")");
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
