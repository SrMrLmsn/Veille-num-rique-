# Veille Juridique — Droit du Numérique

Site de veille juridique automatisée, alimenté par des flux RSS officiels (CNIL, EDPB, ANSSI, ARCEP, EUR-Lex…).

## Structure

```
veille-juridique/
├── index.html              ← site web (ouvrir dans un navigateur)
├── collect.js              ← script de collecte RSS
├── package.json
├── data/
│   └── articles.json       ← généré par collect.js (créé automatiquement)
└── .github/
    └── workflows/
        └── collect.yml     ← automatisation GitHub Actions
```

## Démarrage rapide (5 minutes)

### 1. Prérequis

- [Node.js](https://nodejs.org) ≥ 18
- Un compte [GitHub](https://github.com)

### 2. Installation locale

```bash
# Cloner ce dossier ou le déposer dans un repo GitHub
cd veille-juridique

# Installer la dépendance
npm install

# Première collecte
npm run collect

# Ouvrir le site
open index.html
# ou : npx serve . → http://localhost:3000
```

### 3. Déploiement en ligne (GitHub Pages)

1. Créer un repo GitHub (public ou privé)
1. Pousser tous les fichiers :
   
   ```bash
   git init
   git add .
   git commit -m "init: veille juridique"
   git remote add origin https://github.com/TON_USER/veille-juridique.git
   git push -u origin main
   ```
1. Dans les Settings du repo → **Pages** → Source : `main` / `/(root)`
1. Ton site sera accessible sur `https://TON_USER.github.io/veille-juridique/`

### 4. Automatisation (collecte quotidienne)

Le fichier `.github/workflows/collect.yml` déclenche automatiquement `collect.js` chaque matin à 9h (Paris).

> **Aucun abonnement payant requis.** GitHub Actions est gratuit pour les repos publics.

## Ajouter / modifier des sources

Éditer le tableau `SOURCES` dans `collect.js` :

```js
{
  name: 'HATVP',          // affiché dans l'interface
  url: 'https://...',     // URL du flux RSS
  category: 'veille',     // 'veille' ou 'tech'
  tag: 'Transparence'     // étiquette affichée sur la carte
}
```

Sources à explorer :

- CADA : https://www.cada.fr/rss.xml
- HATVP : https://www.hatvp.fr/rss/actualites/
- Sénat (textes adoptés) : https://www.senat.fr/rss/textes_adoptes.rss
- Parlement Européen : https://www.europarl.europa.eu/rss/doc/top-stories/fr.xml

## Personnalisation du site

Tout le site est dans `index.html` (HTML + CSS + JS inline, zéro dépendance externe).

- **Couleurs** : modifier les variables CSS dans `:root { ... }`
- **Textes applicables** : modifier le tableau `TEXTES` dans le `<script>` de `index.html`
- **Titre** : modifier le `<h1>` dans le `<header>`
