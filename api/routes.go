package api

import (
	"fmt"
	"log"
	"net/http"
)

func (s *MyServer) routes() {
	s.Router.Handle("/front/", http.StripPrefix("/front/", http.FileServer(http.Dir("front"))))
	s.Router.HandleFunc("/", Chain(s.Home(), LogRequestMiddleware))
	s.Router.HandleFunc("/login-form", Chain(s.LoginHandler(), LogRequestMiddleware))
	s.Router.HandleFunc("/profil", Chain(s.GraphQlHander(), LogRequestMiddleware))
	s.Router.HandleFunc("/protected", Chain(s.ProtectedHandler(), LogRequestMiddleware, s.Authenticate))
}

func LogRequestMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[%v], %v", r.Method, r.RequestURI)
		next(w, r)
	}
}

func (s *MyServer) ProtectedHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := r.Context().Value("userID").(int)
		w.Write([]byte(fmt.Sprintf("Hello, user %d", userID)))
	}
}

func Chain(f http.HandlerFunc, middlewares ...func(http.HandlerFunc) http.HandlerFunc) http.HandlerFunc {
	for _, middmiddlewares := range middlewares {
		f = middmiddlewares(f)
	}
	return f
}
