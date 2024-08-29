package api

import (
	"context"
	"fmt"
	"net/http"
	"profile-app-backend/db"
	"time"
)

const (
	ColorGreen = "\033[32m"
	ColorBlue  = "\033[34m"
	ColorReset = "\033[0m"
	port       = ":8079"
)

type MyServer struct {
	Router *http.ServeMux
	Server *http.Server
	Store  db.Store
}

func NewServer(store db.Store) *MyServer {
	router := http.NewServeMux()
	server := &MyServer{
		Store:  store,
		Router: router,
	}
	server.routes()

	fmt.Println(ColorBlue, "(http://localhost:8079) - Server started on port", port, ColorReset)
	fmt.Println(ColorGreen, "[SERVER_INFO] : To stop the server : Ctrl + c", ColorReset)

	srv := &http.Server{
		Addr:              "localhost:8079",
		Handler:           router,
		ReadHeaderTimeout: 15 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       30 * time.Second,
	}

	server.Server = srv

	return server
}

func (s *MyServer) Shutdown(ctx context.Context) error {
	return s.Server.Shutdown(ctx)
}
