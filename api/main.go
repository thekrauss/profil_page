

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"profile-app-backend/api"
	"syscall"
	"time"
)

func main() {
	if err := run(); err != nil {
		log.Printf("Error to Run : %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	srv := api.NewServer()

	fs := http.FileServer(http.Dir("front"))
	http.Handle("/front/", http.StripPrefix("/front/", fs))

	signalChan := make(chan os.Signal, 1)
	done := make(chan struct{})
	signal.Notify(signalChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-signalChan
		log.Println("Stopping the server...")

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			log.Fatalf("Server shutdown error: %v", err)
		}
		close(done)
	}()

	if err := srv.Server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return fmt.Errorf("error when starting server : %w", err)
	}

	<-done
	log.Println("Server gracefully stopped")
	return nil
}
