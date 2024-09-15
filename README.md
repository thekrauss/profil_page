
# Projet de Page de Profil GraphQL

## Vue d'ensemble

L'objectif de ce projet est de créer une page de profil utilisateur avec GraphQL, en récupérant des données spécifiques via une API GraphQL et en visualisant des statistiques sous forme de graphiques SVG.

## Fonctionnalités

- **Connexion** : Authentification avec JWT pour sécuriser l'accès.
- **Requêtes GraphQL** : Interrogation de l'API pour récupérer des informations utilisateur.
- **Graphiques SVG** : Visualisation des statistiques de l'utilisateur.
- **UI Responsive** : Interface adaptative pour mobile et bureau.

## Technologies utilisées

- **Backend** : Golang
- **Frontend** : HTML, CSS, JavaScript
- **API** : GraphQL
- **JWT** : Authentification
- **Docker** : Containerisation

## Instructions d'installation et d'exécution

### Étapes pour cloner et exécuter l'application localement

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/thekrauss/GraphQL-profil-page.git
   cd GraphQL-profil-page
   ```

2. Exécutez l'application en local avec Golang :
   ```bash
   go run .
   ```

3. Ouvrez votre navigateur et accédez à l'application sur `http://localhost:8080`.

### Étapes pour builder et exécuter avec Docker

1. **Construire l'image Docker :**

   Assurez-vous d'avoir Docker installé et configuré sur votre machine.

   Dans le répertoire de votre projet, exécutez la commande suivante pour builder l'image :

   ```bash
   docker build -t graphql-profil-app .
   ```

2. **Exécuter le conteneur Docker :**

   Une fois l'image construite, exécutez cette commande pour lancer l'application :

   ```bash
   docker run -d -p 8080:8080 graphql-profil-app
   ```

3. Ouvrez l'application dans votre navigateur à l'adresse `http://localhost:8080`.

## Licence

Ce projet est sous licence MIT.
