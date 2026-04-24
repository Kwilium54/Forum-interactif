# Forum Interactif — Nuxt.js

Application de forum interactif réalisée avec Nuxt.js (SSR), Vuetify 3, MySQL 8 et WebSocket temps réel.

## Lancer le projet

### 1. Cloner le dépôt et configurer l'environnement

```bash
cd forum-interactif
cp .env.example .env
```

Éditer `.env` si nécessaire (les valeurs par défaut fonctionnent avec `docker compose`).

### 2. Démarrer avec Docker

```bash
docker compose up --build
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).  
Un compte administrateur `admin` / `admin` est créé automatiquement au premier démarrage.

---

## Fonctionnalités réalisées

- **Authentification** : inscription, connexion, déconnexion, changement de mot de passe
- **Forums** : liste sur la page d'accueil avec nombre de sujets
- **Sujets** : liste paginée (20/page) triée par date du dernier message, création avec premier message
- **Messages** : liste paginée (20/page), réponse, modification (auteur ou admin), suppression (admin)
- **Espace admin** : créer/renommer/supprimer un forum, créer un compte administrateur, supprimer un sujet
- **Temps réel** : WebSocket — la liste des sujets et les messages se mettent à jour automatiquement sans rechargement

## Stack technique

| Élément | Choix |
|---|---|
| Framework | Nuxt 4 (SSR) |
| UI | Vuetify 3 |
| Base de données | MySQL 8 via `mysql2/promise` |
| Auth | `nuxt-auth-utils` (sessions cookiées) |
| Temps réel | WebSocket natif Nitro |
| Déploiement | Docker + docker-compose |

## Authentification : sessions cookiées plutôt que JWT

On aurait pu utiliser du JWT, mais pour un forum web classique ça n'apporte pas grand chose. Le JWT est surtout utile quand une API doit être consommée par des clients mobiles ou des services tiers — ici ce n'est pas le cas. À la place, on utilise `nuxt-auth-utils` qui stocke la session dans un cookie HTTP-only chiffré : le JavaScript de la page n'y a pas accès (protection XSS), ça s'intègre naturellement avec le SSR de Nuxt, et il n'y a rien de plus à configurer.
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
