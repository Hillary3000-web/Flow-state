package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/flowstate/backend/internal/controller"
	"github.com/flowstate/backend/internal/controller/middleware"
	"github.com/flowstate/backend/internal/repository"
	"github.com/flowstate/backend/internal/repository/db"
	"github.com/flowstate/backend/internal/usecase"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	loadEnvFile(".env")

	// 1. Environment Configurations
	port := getEnv("PORT", "8080")
	dbURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/flowstate?sslmode=disable")
	jwtSecret := getEnv("JWT_SECRET", "flowstate-super-secret-key-change-in-production-min32bytes")
	corsRaw := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
	corsOrigins := strings.Split(corsRaw, ",")

	log.Println("Starting FlowState API...")

	// 2. Database Connection (PostgreSQL with pgxpool)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	poolConfig, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatalf("Failed to parse database configuration: %v", err)
	}
	poolConfig.MaxConns = 25
	poolConfig.MinConns = 5
	poolConfig.MaxConnLifetime = 1 * time.Hour
	poolConfig.MaxConnIdleTime = 30 * time.Minute

	dbPool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer dbPool.Close()

	if err := dbPool.Ping(ctx); err != nil {
		log.Printf("Warning: Database ping failed (%v). Ensure PostgreSQL is running.", err)
	} else {
		log.Println("Database connection pool established successfully.")
	}

	// 3. Dependency Injection
	queries := db.New(dbPool)

	// Repositories
	userRepo := repository.NewUserRepository(queries)
	habitRepo := repository.NewHabitRepository(queries)
	taskRepo := repository.NewTaskRepository(queries)
	goalRepo := repository.NewGoalRepository(queries)
	projectRepo := repository.NewProjectRepository(queries)
	subtaskRepo := repository.NewSubtaskRepository(queries)
	focusRepo := repository.NewFocusRepository(queries)
	scheduleRepo := repository.NewScheduleRepository(queries)
	notifRepo := repository.NewNotificationRepository(queries)

	// JWT Manager & Usecases
	jwtMgr := usecase.NewJWTManager(jwtSecret, 60*time.Minute, 7*24*time.Hour)
	authUsecase := usecase.NewAuthUsecase(userRepo, jwtMgr)
	habitUsecase := usecase.NewHabitUsecase(habitRepo, taskRepo)
	taskUsecase := usecase.NewTaskUsecase(taskRepo)
	goalUsecase := usecase.NewGoalUsecase(goalRepo, projectRepo, subtaskRepo)
	focusUsecase := usecase.NewFocusUsecase(focusRepo)
	scheduleUsecase := usecase.NewScheduleUsecase(scheduleRepo, taskRepo)
	analyticsUsecase := usecase.NewAnalyticsUsecase(taskRepo, focusRepo, scheduleRepo)
	notifUsecase := usecase.NewNotificationUsecase(notifRepo)

	// Controllers
	userCtrl := controller.NewUserController(authUsecase)
	habitCtrl := controller.NewHabitController(habitUsecase)
	taskCtrl := controller.NewTaskController(taskUsecase)
	goalCtrl := controller.NewGoalController(goalUsecase)
	focusCtrl := controller.NewFocusController(focusUsecase)
	scheduleCtrl := controller.NewScheduleController(scheduleUsecase)
	analyticsCtrl := controller.NewAnalyticsController(analyticsUsecase)
	notifCtrl := controller.NewNotificationController(notifUsecase)
	chatbotCtrl := controller.NewChatbotController()

	// 4. Gin Router Setup
	router := gin.Default()

	// Global Middleware
	router.Use(middleware.CORSMiddleware(corsOrigins))

	// Health Check / Readiness Probe
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "FlowState API (Go/Clean Architecture)",
			"time":    time.Now().UTC(),
		})
	})

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
		})
	})

	// 5. API v1 Routing
	v1 := router.Group("/api/v1")
	{
		// Auth Routes
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/register", userCtrl.Register)
			authGroup.POST("/register/", userCtrl.Register)
			authGroup.POST("/login", userCtrl.Login)
			authGroup.POST("/login/", userCtrl.Login)
			authGroup.POST("/refresh", userCtrl.RefreshToken)
			authGroup.POST("/refresh/", userCtrl.RefreshToken)

			// Protected user profile routes
			protectedAuth := authGroup.Group("", middleware.JWTAuthMiddleware(jwtMgr))
			{
				protectedAuth.GET("/me", userCtrl.GetMe)
				protectedAuth.GET("/me/", userCtrl.GetMe)
				protectedAuth.PATCH("/me", userCtrl.UpdateProfile)
				protectedAuth.PATCH("/me/", userCtrl.UpdateProfile)
				protectedAuth.POST("/change-password", userCtrl.ChangePassword)
				protectedAuth.POST("/change-password/", userCtrl.ChangePassword)
				protectedAuth.POST("/password/change", userCtrl.ChangePassword)
				protectedAuth.POST("/password/change/", userCtrl.ChangePassword)
			}
		}

		// Habits & Streaks (Protected)
		habitsGroup := v1.Group("/habits", middleware.JWTAuthMiddleware(jwtMgr))
		{
			habitsGroup.POST("", habitCtrl.CreateHabit)
			habitsGroup.POST("/", habitCtrl.CreateHabit)
			habitsGroup.GET("", habitCtrl.ListHabits)
			habitsGroup.GET("/", habitCtrl.ListHabits)
			habitsGroup.DELETE("/:id", habitCtrl.DeleteHabit)
			habitsGroup.DELETE("/:id/", habitCtrl.DeleteHabit)
			habitsGroup.POST("/:id/checkin", habitCtrl.CheckinHabit)
			habitsGroup.POST("/:id/checkin/", habitCtrl.CheckinHabit)
			habitsGroup.GET("/:id/streaks", habitCtrl.GetStreakHistory)
			habitsGroup.GET("/:id/streaks/", habitCtrl.GetStreakHistory)
			habitsGroup.GET("/progress", habitCtrl.GetHabitProgress)
			habitsGroup.GET("/progress/", habitCtrl.GetHabitProgress)

			// Daily Checkins
			habitsGroup.POST("/checkins", habitCtrl.CreateDailyCheckin)
			habitsGroup.POST("/checkins/", habitCtrl.CreateDailyCheckin)
			habitsGroup.GET("/checkins/today", habitCtrl.GetDailyCheckin)
			habitsGroup.GET("/checkins/today/", habitCtrl.GetDailyCheckin)
			habitsGroup.GET("/checkins", habitCtrl.ListDailyCheckins)
			habitsGroup.GET("/checkins/", habitCtrl.ListDailyCheckins)
		}

		// Tasks (Protected)
		tasksGroup := v1.Group("/tasks", middleware.JWTAuthMiddleware(jwtMgr))
		{
			tasksGroup.GET("", taskCtrl.ListTasks)
			tasksGroup.GET("/", taskCtrl.ListTasks)
			tasksGroup.POST("", taskCtrl.CreateTask)
			tasksGroup.POST("/", taskCtrl.CreateTask)
			tasksGroup.GET("/:id", taskCtrl.GetTask)
			tasksGroup.GET("/:id/", taskCtrl.GetTask)
			tasksGroup.PATCH("/:id", taskCtrl.UpdateTask)
			tasksGroup.PATCH("/:id/", taskCtrl.UpdateTask)
			tasksGroup.PUT("/:id", taskCtrl.UpdateTask)
			tasksGroup.PUT("/:id/", taskCtrl.UpdateTask)
			tasksGroup.DELETE("/:id", taskCtrl.DeleteTask)
			tasksGroup.DELETE("/:id/", taskCtrl.DeleteTask)
			tasksGroup.POST("/:id/complete", taskCtrl.CompleteTask)
			tasksGroup.POST("/:id/complete/", taskCtrl.CompleteTask)
			tasksGroup.POST("/quick-capture", taskCtrl.QuickCapture)
			tasksGroup.POST("/quick-capture/", taskCtrl.QuickCapture)
			tasksGroup.PATCH("/reorder", taskCtrl.ReorderTasks)
			tasksGroup.PATCH("/reorder/", taskCtrl.ReorderTasks)
		}

		// Goals (Protected)
		goalsGroup := v1.Group("/goals", middleware.JWTAuthMiddleware(jwtMgr))
		{
			goalsGroup.GET("", goalCtrl.ListGoals)
			goalsGroup.GET("/", goalCtrl.ListGoals)
			goalsGroup.POST("", goalCtrl.CreateGoal)
			goalsGroup.POST("/", goalCtrl.CreateGoal)
			goalsGroup.GET("/:id", goalCtrl.GetGoal)
			goalsGroup.GET("/:id/", goalCtrl.GetGoal)
			goalsGroup.PATCH("/:id", goalCtrl.UpdateGoal)
			goalsGroup.PATCH("/:id/", goalCtrl.UpdateGoal)
			goalsGroup.PUT("/:id", goalCtrl.UpdateGoal)
			goalsGroup.PUT("/:id/", goalCtrl.UpdateGoal)
			goalsGroup.DELETE("/:id", goalCtrl.DeleteGoal)
			goalsGroup.DELETE("/:id/", goalCtrl.DeleteGoal)
		}

		// Projects (Protected)
		projectsGroup := v1.Group("/projects", middleware.JWTAuthMiddleware(jwtMgr))
		{
			projectsGroup.GET("", goalCtrl.ListProjects)
			projectsGroup.GET("/", goalCtrl.ListProjects)
			projectsGroup.POST("", goalCtrl.CreateProject)
			projectsGroup.POST("/", goalCtrl.CreateProject)
			projectsGroup.GET("/:id", goalCtrl.GetProject)
			projectsGroup.GET("/:id/", goalCtrl.GetProject)
			projectsGroup.PATCH("/:id", goalCtrl.UpdateProject)
			projectsGroup.PATCH("/:id/", goalCtrl.UpdateProject)
			projectsGroup.PUT("/:id", goalCtrl.UpdateProject)
			projectsGroup.PUT("/:id/", goalCtrl.UpdateProject)
			projectsGroup.DELETE("/:id", goalCtrl.DeleteProject)
			projectsGroup.DELETE("/:id/", goalCtrl.DeleteProject)
		}

		// Subtasks (Protected)
		subtasksGroup := v1.Group("/subtasks", middleware.JWTAuthMiddleware(jwtMgr))
		{
			subtasksGroup.POST("", goalCtrl.CreateSubtask)
			subtasksGroup.POST("/", goalCtrl.CreateSubtask)
			subtasksGroup.POST("/:id/toggle", goalCtrl.ToggleSubtask)
			subtasksGroup.POST("/:id/toggle/", goalCtrl.ToggleSubtask)
			subtasksGroup.DELETE("/:id", goalCtrl.DeleteSubtask)
			subtasksGroup.DELETE("/:id/", goalCtrl.DeleteSubtask)
		}

		// Focus (Protected)
		focusGroup := v1.Group("/focus", middleware.JWTAuthMiddleware(jwtMgr))
		{
			focusGroup.GET("/sessions", focusCtrl.ListSessions)
			focusGroup.GET("/sessions/", focusCtrl.ListSessions)
			focusGroup.POST("/sessions", focusCtrl.CreateSession)
			focusGroup.POST("/sessions/", focusCtrl.CreateSession)
			focusGroup.GET("/sessions/:id", focusCtrl.GetSession)
			focusGroup.GET("/sessions/:id/", focusCtrl.GetSession)
			focusGroup.PATCH("/sessions/:id", focusCtrl.UpdateSession)
			focusGroup.PATCH("/sessions/:id/", focusCtrl.UpdateSession)
			focusGroup.GET("/stats", focusCtrl.GetStats)
			focusGroup.GET("/stats/", focusCtrl.GetStats)
		}

		// Schedule (Protected)
		scheduleGroup := v1.Group("/schedule", middleware.JWTAuthMiddleware(jwtMgr))
		{
			scheduleGroup.GET("/blocks", scheduleCtrl.ListBlocks)
			scheduleGroup.GET("/blocks/", scheduleCtrl.ListBlocks)
			scheduleGroup.POST("/blocks", scheduleCtrl.CreateBlock)
			scheduleGroup.POST("/blocks/", scheduleCtrl.CreateBlock)
			scheduleGroup.GET("/blocks/:id", scheduleCtrl.GetBlock)
			scheduleGroup.GET("/blocks/:id/", scheduleCtrl.GetBlock)
			scheduleGroup.PATCH("/blocks/:id", scheduleCtrl.UpdateBlock)
			scheduleGroup.PATCH("/blocks/:id/", scheduleCtrl.UpdateBlock)
			scheduleGroup.DELETE("/blocks/:id", scheduleCtrl.DeleteBlock)
			scheduleGroup.DELETE("/blocks/:id/", scheduleCtrl.DeleteBlock)
			scheduleGroup.PATCH("/blocks/reorder", scheduleCtrl.ReorderBlocks)
			scheduleGroup.PATCH("/blocks/reorder/", scheduleCtrl.ReorderBlocks)
			scheduleGroup.GET("/weekly", scheduleCtrl.GetWeekly)
			scheduleGroup.GET("/weekly/", scheduleCtrl.GetWeekly)
			scheduleGroup.GET("/risks", scheduleCtrl.GetRisks)
			scheduleGroup.GET("/risks/", scheduleCtrl.GetRisks)
		}

		// Analytics (Protected)
		analyticsGroup := v1.Group("/analytics", middleware.JWTAuthMiddleware(jwtMgr))
		{
			analyticsGroup.GET("/overview", analyticsCtrl.GetOverview)
			analyticsGroup.GET("/overview/", analyticsCtrl.GetOverview)
			analyticsGroup.GET("/trends", analyticsCtrl.GetTrends)
			analyticsGroup.GET("/trends/", analyticsCtrl.GetTrends)
			analyticsGroup.GET("/burndown", analyticsCtrl.GetBurndown)
			analyticsGroup.GET("/burndown/", analyticsCtrl.GetBurndown)
			analyticsGroup.GET("/time-allocation", analyticsCtrl.GetTimeAllocation)
			analyticsGroup.GET("/time-allocation/", analyticsCtrl.GetTimeAllocation)
		}

		// Notifications (Protected)
		notifGroup := v1.Group("/notifications", middleware.JWTAuthMiddleware(jwtMgr))
		{
			notifGroup.GET("", notifCtrl.ListNotifications)
			notifGroup.GET("/", notifCtrl.ListNotifications)
			notifGroup.PATCH("/:id/read", notifCtrl.MarkRead)
			notifGroup.PATCH("/:id/read/", notifCtrl.MarkRead)
			notifGroup.POST("/read-all", notifCtrl.MarkAllRead)
			notifGroup.POST("/read-all/", notifCtrl.MarkAllRead)
			notifGroup.DELETE("/:id", notifCtrl.DeleteNotification)
			notifGroup.DELETE("/:id/", notifCtrl.DeleteNotification)
		}

		// Chatbot (public — no auth required so visitors can try it)
		v1.POST("/chatbot", chatbotCtrl.Chat)
		v1.POST("/chatbot/", chatbotCtrl.Chat)
	}

	// 6. Graceful Server Execution
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("FlowState API server listening on http://0.0.0.0:%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shut down
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down FlowState API server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server gracefully stopped.")
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func loadEnvFile(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}
	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			k := strings.TrimSpace(parts[0])
			v := strings.Trim(strings.TrimSpace(parts[1]), "\"'")
			if os.Getenv(k) == "" {
				os.Setenv(k, v)
			}
		}
	}
}
