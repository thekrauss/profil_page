package api

import (
	"encoding/json"
	"net/http"
)

func SendJSONResponse(w http.ResponseWriter, response LoginResponses, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}
