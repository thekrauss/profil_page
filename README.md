
# Projet de Page de Profil GraphQL

## Vue d'ensemble

L'objectif de ce projet est d'apprendre le langage de requête GraphQL en créant une page de profil personnalisée. Le profil affiche des données spécifiques à l'utilisateur récupérées via une API GraphQL et visualise des statistiques clés sous forme de graphiques en SVG. Ce projet couvre divers aspects de la conception d'interface utilisateur, l'authentification, la requête de données et la représentation visuelle interactive.

## Fonctionnalités

- **Page de connexion** : Les utilisateurs peuvent se connecter en utilisant leurs identifiants (nom d'utilisateur:mot de passe ou email:mot de passe) pour obtenir un jeton JWT.
- **Requêtes GraphQL** : L'application interagit avec une API GraphQL pour récupérer des données personnalisées telles que l'XP, les audits de projet, les notes, et plus encore.
- **Statistiques et Graphiques** : Le profil inclut des graphiques dynamiques et interactifs basés sur SVG représentant la progression de l'utilisateur, l'XP gagnée au fil du temps, le taux de réussite des projets, etc.
- **Authentification JWT** : L'authentification basée sur JWT sécurise l'accès aux données de l'utilisateur, garantissant que chaque utilisateur ne peut accéder qu'à ses propres informations.
- **Conception Responsive** : L'interface utilisateur est conçue pour être responsive et fonctionner sur plusieurs types d'appareils.

## Technologies utilisées

- **GraphQL** : Pour interroger les données des utilisateurs depuis l'API.
- **JWT** : Pour l'authentification et l'autorisation des utilisateurs.
- **SVG** : Pour créer des graphiques dynamiques et interactifs.
- **HTML/CSS/JavaScript** : Pour construire le frontend de l'application.
- **Netlify/GitHub Pages** (ou autre) : Pour héberger l'application.

## Instructions

1. **Page de connexion** : 
   - Les utilisateurs peuvent se connecter avec leur nom d'utilisateur et mot de passe ou leur email et mot de passe.
   - Si les identifiants sont incorrects, un message d'erreur approprié sera affiché.
   - Après une connexion réussie, un jeton JWT est généré et stocké pour les futures requêtes.

2. **Requêtes GraphQL** :
   - L'application interroge l'API GraphQL en utilisant le jeton JWT pour l'authentification.
   - Exemple de requête pour obtenir des informations basiques sur l'utilisateur :
     ```graphql
     {
       user {
         id
         login
       }
     }
     ```
   - Les requêtes imbriquées sont également utilisées pour récupérer des données liées, telles que les transactions de l'utilisateur et les résultats :
     ```graphql
     {
       result {
         id
         user {
           id
           login
         }
       }
     }
     ```

3. **Section Statistiques** :
   - Le profil inclut une section de statistiques avec au moins deux graphiques différents basés sur SVG.
   - Exemples de graphiques :
     - **Progression de l'XP dans le temps** : Visualiser l'XP gagnée sur une période sélectionnée.
     - **Taux de réussite des projets** : Afficher le taux de succès de l'utilisateur dans ses projets scolaires.
   - Autres graphiques possibles :
     - **Taux d'audit** : Visualiser le nombre d'audits effectués et leurs résultats.
     - **Statistiques de la Piscine** : Statistiques relatives aux exercices et projets spécifiques.

4. **Interface utilisateur (UI)** :
   - Le design est entièrement personnalisable et suit les meilleures pratiques UI/UX pour assurer une expérience propre et conviviale.
   - L'accent est mis sur une mise en page responsive pour s'adapter à divers écrans, du mobile au bureau.

## Hébergement

Ce projet est hébergé sur [GitHub Pages](https://). N'hésitez pas à explorer et tester les fonctionnalités.

## Exemples de requêtes

Voici quelques exemples de requêtes GraphQL utilisées dans le projet :

- Requête pour obtenir des détails sur l'utilisateur :
  ```graphql
  {
    user {
      id
      login
      xp
    }
  }
  ```

- Requête pour obtenir les transactions d'XP d'un utilisateur :
  ```graphql
  {
    transaction(where: { userId: { _eq: 1 }}) {
      type
      amount
      createdAt
    }
  }
  ```

- Requête imbriquée pour obtenir les résultats avec les données associées à l'utilisateur :
  ```graphql
        query: `{
          xp_per_major_project: transaction(
            where: {
              type: {_eq: "xp"},
              object: {type: {_eq: "project"}}
            },
            order_by: {createdAt: desc},
            limit: 10
          ) {
            amount
            object {
              name
            }
            createdAt
          }
        }`,
  ```

## Comment exécuter

1. Clonez le dépôt :
   ```bash
    https://github.com/thekrauss/GraphQL-profile-page.git
   ```


2. Exécutez le serveur de développement :
   ```bash
   go run .
   ```

5. Ouvrez l'application dans votre navigateur à l'adresse `http://localhost:8080`.

## Améliorations futures

- Ajouter des statistiques plus détaillées et interactives.
- Améliorer l'UI avec des animations et des transitions.
- Étendre les données affichées pour inclure des informations plus granulaires provenant de l'API.

## Licence

Ce projet est sous licence MIT. N'hésitez pas à utiliser, modifier et distribuer ce projet comme bon vous semble.
