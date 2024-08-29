package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func SendJSONResponse(w http.ResponseWriter, response LoginResponses, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}

func GetUserIDbyEmail(db *sql.DB, email string) (int, error) {
	var userID int
	err := db.QueryRow("SELECT id FROM users WHERE email = ?", email).Scan(&userID)
	if err != nil {
		return 0, err
	}
	return userID, nil
}

func GetPasswordByEmail(db *sql.DB, email string) (string, error) {
	var passW string
	err := db.QueryRow("SELECT password FROM users WHERE email = ?", email).Scan(&passW)
	if err != nil {
		return "", err
	}
	return passW, nil
}

func GetUserIDbyUsername(db *sql.DB, username string) (int, error) {
	var userID int
	err := db.QueryRow("SELECT id FROM users WHERE username = ?", username).Scan(&userID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Println("No user found with username:", username)
		}
		return 0, fmt.Errorf("failed to get user ID by username: %w", err)
	}
	return userID, nil
}

func GetUsernameByEmail(db *sql.DB, email string) (string, error) {
	var username string
	err := db.QueryRow("SELECT username FROM users WHERE email = ?", email).Scan(&username)
	if err != nil {
		return "", err
	}
	return username, nil
}

func GetPasswordByUsername(db *sql.DB, username string) (string, error) {
	var password string
	query := "SELECT password FROM users WHERE username = ?"
	err := db.QueryRow(query, username).Scan(&password)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Println("No password found for username:", username)
		}
		return "", fmt.Errorf("failed to get password by username: %w", err)
	}
	return password, nil
}
