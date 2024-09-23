package api

import "net/http"

func (s *MyServer) Home() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "front/index.html")
	}
}
