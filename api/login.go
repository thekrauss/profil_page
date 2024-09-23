package api

import (
	"encoding/base64"
	"encoding/json"
	"io"
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
		if r.Method != http.MethodPost {
			http.NotFound(w, r)
			return
		}

		var credentials struct {
			Identifier string `json:"identifier"`
			Password   string `json:"password"`
		}
		if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil {
			log.Println("Failed to parse JSON body:", err)
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}

		if credentials.Identifier == "" || credentials.Password == "" {
			log.Println("Identifier or password is empty")
			http.Error(w, "Invalid login credentials", http.StatusUnauthorized)
			return
		}

		auth := credentials.Identifier + ":" + credentials.Password
		encodedAuth := base64.StdEncoding.EncodeToString([]byte(auth))

		authURL := "https://zone01normandie.org/api/auth/signin"
		req, err := http.NewRequest("POST", authURL, nil)
		if err != nil {
			log.Println("Failed to create request to auth API:", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		req.Header.Set("Authorization", "Basic "+encodedAuth)
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: time.Second * 10}
		resp, err := client.Do(req)
		if err != nil {
			log.Println("Failed to communicate with auth API:", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		respBody, _ := io.ReadAll(resp.Body)
		log.Println("Raw API Response:", string(respBody))

		if resp.StatusCode != http.StatusOK {
			log.Printf("Auth API responded with status: %d, body: %s\n", resp.StatusCode, string(respBody))
			http.Error(w, "Invalid login credentials", http.StatusUnauthorized)
			return
		}

		jwtToken := string(respBody)

		http.SetCookie(w, &http.Cookie{
			Name:     "token",
			Value:    jwtToken,
			Expires:  time.Now().Add(24 * time.Hour),
			HttpOnly: true,
			Secure:   true,
		})

		log.Println("User authenticated successfully")
		response := LoginResponses{Token: jwtToken, Message: "Login successful"}
		json.NewEncoder(w).Encode(response)
	}
}
