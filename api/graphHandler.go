package api

import (
	"bytes"
	"io"
	"log"
	"net/http"
	"time"
)

func (s *MyServer) GraphQlHander() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenCookie, err := r.Cookie("token")
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			log.Println("Unauthorized", err)
			return
		}

		token := tokenCookie.Value

		query := `{"query": "{ user { id login transactions { amount } progress { grade } results { grade } } }"}`
		req, err := http.NewRequest("POST", "https://zone01normandie.org/api/graphql-engine/v1/graphql", bytes.NewBuffer([]byte(query)))
		if err != nil {
			http.Error(w, "Failed to create request", http.StatusInternalServerError)
			log.Println("Failed to create request", err)
			return
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		client := &http.Client{Timeout: time.Second * 10}
		resp, err := client.Do(req)
		if err != nil || resp.StatusCode != http.StatusOK {
			http.Error(w, "Failed to query GraphQL API", http.StatusInternalServerError)
			log.Println("Failed to query GraphQL API", err)
			return
		}
		defer resp.Body.Close()

		body, err := io.ReadAll(resp.Body)
		log.Println("Response Body:", string(body))

		if err != nil {
			http.Error(w, "Failed to read response body", http.StatusInternalServerError)
			log.Println("Failed to read response body", err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
	}
}
