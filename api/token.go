package api

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type Claims struct {
	UserID int   `json:"user_id"`
	Exp    int64 `json:"exp"`
}

var jwtKey = []byte("my_secret_key")

type contextKey string

const userIDKey contextKey = "userID"

func GenerateJWT(userID int) (string, error) {
	header := base64.URLEncoding.EncodeToString([]byte(`{"alg":"HS256","typ":"JWT"}`))

	expirationTime := time.Now().Add(24 * time.Hour).Unix()
	claims := Claims{
		UserID: userID,
		Exp:    expirationTime,
	}
	claimsJSON, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	payload := base64.URLEncoding.EncodeToString(claimsJSON)

	signature := generateHMACSHA256(header + "." + payload)
	token := fmt.Sprintf("%s.%s.%s", header, payload, signature)

	return token, nil
}

func generateHMACSHA256(data string) string {
	h := hmac.New(sha256.New, jwtKey)
	h.Write([]byte(data))
	return base64.URLEncoding.EncodeToString(h.Sum(nil))
}

func VerifyJWT(token string) (*Claims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}

	header := parts[0]
	payload := parts[1]
	signature := parts[2]

	expectedSignature := generateHMACSHA256(header + "." + payload)
	if signature != expectedSignature {
		return nil, fmt.Errorf("invalid token signature")
	}

	payloadData, err := base64.URLEncoding.DecodeString(payload)
	if err != nil {
		return nil, fmt.Errorf("invalid token payload")
	}

	var claims Claims
	err = json.Unmarshal(payloadData, &claims)
	if err != nil {
		return nil, fmt.Errorf("invalid token claims")
	}

	if time.Now().Unix() > claims.Exp {
		return nil, fmt.Errorf("token has expired")
	}

	return &claims, nil
}

func (s *MyServer) Authenticate(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie("token")
		if err != nil {
			if err == http.ErrNoCookie {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		claims, err := VerifyJWT(c.Value)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
