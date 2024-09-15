
# Utiliser l'image Golang officielle pour builder l'application
FROM golang:1.20 AS builder

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers go.mod et go.sum dans le répertoire de travail
COPY go.mod go.sum ./

# Télécharger les dépendances
RUN go mod download

# Copier le reste des fichiers de l'application
COPY . .

# Builder l'application
RUN go build -o profil-app

# Utiliser une image alpine pour une exécution plus légère
FROM alpine:latest

# Installer les dépendances nécessaires pour exécuter l'application
RUN apk --no-cache add ca-certificates

# Définir le répertoire de travail
WORKDIR /root/

# Copier l'application depuis le conteneur de build
COPY --from=builder /app/profil-app .

# Copier les fichiers front-end (HTML, CSS, JS) dans le conteneur
COPY --from=builder /app/static /root/static

# Exposer le port sur lequel l'application écoute
EXPOSE 8080

# Commande d'exécution de l'application
CMD ["./profil-app"]
