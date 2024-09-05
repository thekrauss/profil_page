package api

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type LoginResponses struct {
	Token   string `json:"token,omitempty"`
	Message string `json:"message"`
}

func (s *MyServer) LoginHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {

			var credentials struct {
				Identifier string `json:"identifier"`
				Password   string `json:"password"`
			}
			err := json.NewDecoder(r.Body).Decode(&credentials)
			if err != nil {
				log.Println("Failed to parse JSON body", err)
				http.Error(w, "Invalid request payload", http.StatusBadRequest)
				return
			}

			identifier := r.FormValue("identifier")
			password := r.FormValue("password")

			log.Println("Login attempt with identifier:", identifier)
			log.Println("Password provided:", password)

			if identifier == "" || password == "" {
				log.Println("Identifier or password is empty")
				http.Error(w, "Invalid login credentials", http.StatusUnauthorized)
				return
			}

			authURL := "https://zone01normandie.org/api/auth/signin"
			authPayload := map[string]string{
				"identifier": identifier,
				"password":   password,
			}

			jsonPayload, err := json.Marshal(authPayload)
			if err != nil {
				log.Println("Failed to create request payload", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}

			req, err := http.NewRequest("POST", authURL, bytes.NewBuffer(jsonPayload))
			if err != nil {
				log.Println("Failed to create request to auth API", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}

			req.Header.Set("Content-Type", "application/json")
			client := &http.Client{Timeout: time.Second * 10}
			resp, err := client.Do(req)
			if err != nil || resp.StatusCode != http.StatusOK {
				log.Println("Failed to authenticate with school API", err)
				http.Error(w, "Invalid login credentials", http.StatusUnauthorized)
				return
			}

			defer resp.Body.Close()

			var authResponse struct {
				Token string `json:"token"`
			}

			err = json.NewDecoder(resp.Body).Decode(&authResponse)
			if err != nil {
				log.Println("Failed to parse auth API response", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}

			http.SetCookie(w, &http.Cookie{
				Name:     "token",
				Value:    authResponse.Token,
				Expires:  time.Now().Add(24 * time.Hour),
				HttpOnly: true,
				Secure:   true,
			})

			log.Println("User authentificated successfully")
			SendJSONResponse(w, LoginResponses{Token: authResponse.Token, Message: "Login successful"}, http.StatusOK)

		} else {
			http.NotFound(w, r)
		}
	}
}
