
# Mon Profil GraphQL

Ce projet permet aux utilisateurs de créer leur propre page de profil personnalisée en utilisant GraphQL pour interroger leurs données. L'interface affiche des informations personnalisées, avec des sections graphiques pour visualiser les progrès de l'utilisateur au fil du temps.

## Objectifs

- Apprendre et maîtriser le langage de requête GraphQL.
- Créer une page de profil utilisateur avec des données récupérées via GraphQL.
- Afficher des graphiques statistiques en SVG.
- Gérer l'authentification avec JWT pour sécuriser l'accès aux données utilisateur.
- Héberger le projet en ligne.

## Fonctionnalités

- **Connexion et Authentification :** Une page de connexion permet aux utilisateurs de se connecter avec leurs identifiants pour récupérer un jeton JWT.
- **Affichage du Profil :** La page de profil affiche des informations personnelles comme :
  - Identification de base de l'utilisateur
  - Quantité d'XP
  - Compétences et scores d'audit
- **Graphiques Statistiques :** Deux graphiques différents affichent des statistiques sur les progrès et réussites de l'utilisateur, créés en SVG.
- **Déconnexion :** Option de déconnexion pour sécuriser la session.

## Prérequis

- **Node.js** et **npm** : Pour gérer les dépendances.
- **GraphQL API Endpoint** : Utilisez l’API fournie par `https://zone01normandie.org/api/graphql-engine/v1/graphql`.
- **JWT** : Obtenu via l'endpoint d'authentification `https://zone01normandie.org/api/auth/signin`.

## Installation

1. **Clonez le projet :**
   ```bash
   git clone https://github.com/username/mon-profil-graphql.git
   cd mon-profil-graphql
   ```

2. **Installez les dépendances :**
   ```bash
   npm install
   ```

3. **Configurez les variables d’environnement :**
   - Créez un fichier `.env` dans le dossier racine.
   - Ajoutez-y les configurations nécessaires, comme l'URL de l'API et le jeton JWT (qui sera généré lors de la connexion).

4. **Lancez l’application :**
   ```bash
   npm start
   ```
   - L'application sera accessible sur `http://localhost:3000`.

## Utilisation

1. **Connexion :**
   - Rendez-vous sur la page de connexion.
   - Entrez votre nom d'utilisateur ou votre email avec votre mot de passe.
   - En cas de succès, vous recevrez un JWT qui sera utilisé pour authentifier vos requêtes GraphQL.

2. **Affichage du Profil :**
   - Une fois connecté, accédez à votre page de profil pour voir vos informations personnelles et vos statistiques.

3. **Graphiques :**
   - Consultez la section des graphiques pour visualiser des statistiques sur votre progression et vos réussites.

4. **Déconnexion :**
   - Utilisez le bouton de déconnexion pour terminer votre session.

## Exemples de Requêtes GraphQL

### Récupérer des informations utilisateur

```graphql
{
  user {
    id
    login
  }
}
```

### Statistiques par Projet

```graphql
{
  transaction(where: { userId: { _eq: 1 } }) {
    amount
    type
    createdAt
  }
}
```

### Progrès par Exercice

```graphql
{
  progress(where: { userId: { _eq: 1 } }) {
    grade
    path
    createdAt
  }
}
```

## Hébergement

Le projet est hébergé sur (https://thekrauss.github.io/profil_page/).

## Technologies Utilisées

- **GraphQL** : Pour la récupération des données.
- **JWT** : Pour la gestion des sessions et de la sécurité.
- **SVG** : Pour créer des graphiques interactifs et animés.
- **HTML/CSS/JavaScript** : Pour la création de l'interface utilisateur.

## Auteurs

- [krauss VESSET](https://thekrauss.fr) - Développeur Full Stack en formation
