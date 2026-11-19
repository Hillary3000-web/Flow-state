package controller

import (
	"net/http"
	"time"

	"github.com/flowstate/backend/internal/controller/middleware"
	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/usecase"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GoalController handles HTTP requests for goals, projects, and subtasks.
type GoalController struct {
	goalUsecase usecase.GoalUsecase
}

// NewGoalController constructs a GoalController.
func NewGoalController(goalUsecase usecase.GoalUsecase) *GoalController {
	return &GoalController{goalUsecase: goalUsecase}
}

type createGoalRequest struct {
	Title       string  `json:"title" binding:"required"`
	Description string  `json:"description"`
	Status      string  `json:"status"`
	TargetDate  *string `json:"target_date"`
}

type updateGoalRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Status      *string `json:"status"`
	TargetDate  *string `json:"target_date"`
	ProgressPct *int    `json:"progress_pct"`
}

type createProjectRequest struct {
	GoalID      uuid.UUID `json:"goal_id" binding:"required"`
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description"`
	Color       string    `json:"color"`
	Status      string    `json:"status"`
}

type updateProjectRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Color       *string `json:"color"`
	Status      *string `json:"status"`
}

type createSubtaskRequest struct {
	TaskID uuid.UUID `json:"task_id"`
	Title  string    `json:"title" binding:"required"`
}

// Goals endpoints

func (ctrl *GoalController) ListGoals(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	var st *domain.GoalStatus
	if s := c.Query("status"); s != "" {
		status := domain.GoalStatus(s)
		st = &status
	}
	goals, err := ctrl.goalUsecase.ListGoals(c.Request.Context(), userID, st)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, goals)
}

func (ctrl *GoalController) CreateGoal(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	var req createGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	var targetDate *time.Time
	if req.TargetDate != nil && *req.TargetDate != "" {
		if t, err := time.Parse("2006-01-02", *req.TargetDate); err == nil {
			targetDate = &t
		} else if t, err := time.Parse(time.RFC3339, *req.TargetDate); err == nil {
			targetDate = &t
		}
	}
	goal, err := ctrl.goalUsecase.CreateGoal(c.Request.Context(), userID, req.Title, req.Description, targetDate, domain.GoalStatus(req.Status))
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusCreated, goal)
}

func (ctrl *GoalController) GetGoal(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	goal, err := ctrl.goalUsecase.GetGoal(c.Request.Context(), id, userID)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, goal)
}

func (ctrl *GoalController) UpdateGoal(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	var req updateGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	var targetDate *time.Time
	if req.TargetDate != nil && *req.TargetDate != "" {
		if t, err := time.Parse("2006-01-02", *req.TargetDate); err == nil {
			targetDate = &t
		} else if t, err := time.Parse(time.RFC3339, *req.TargetDate); err == nil {
			targetDate = &t
		}
	}
	var st *domain.GoalStatus
	if req.Status != nil {
		s := domain.GoalStatus(*req.Status)
		st = &s
	}
	goal, err := ctrl.goalUsecase.UpdateGoal(c.Request.Context(), id, userID, req.Title, req.Description, targetDate, st, req.ProgressPct)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, goal)
}

func (ctrl *GoalController) DeleteGoal(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	if err := ctrl.goalUsecase.DeleteGoal(c.Request.Context(), id, userID); err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, gin.H{"deleted": true})
}

// Projects endpoints

func (ctrl *GoalController) ListProjects(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	var st *domain.GoalStatus
	if s := c.Query("status"); s != "" {
		status := domain.GoalStatus(s)
		st = &status
	}
	projects, err := ctrl.goalUsecase.ListProjects(c.Request.Context(), userID, st)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, projects)
}

func (ctrl *GoalController) CreateProject(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	var req createProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	project, err := ctrl.goalUsecase.CreateProject(c.Request.Context(), userID, req.GoalID, req.Title, req.Description, req.Color, domain.GoalStatus(req.Status))
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusCreated, project)
}

func (ctrl *GoalController) GetProject(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	project, err := ctrl.goalUsecase.GetProject(c.Request.Context(), id, userID)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, project)
}

func (ctrl *GoalController) UpdateProject(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	var req updateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	var st *domain.GoalStatus
	if req.Status != nil {
		s := domain.GoalStatus(*req.Status)
		st = &s
	}
	project, err := ctrl.goalUsecase.UpdateProject(c.Request.Context(), id, userID, req.Title, req.Description, req.Color, st)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, project)
}

func (ctrl *GoalController) DeleteProject(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	if err := ctrl.goalUsecase.DeleteProject(c.Request.Context(), id, userID); err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, gin.H{"deleted": true})
}

// Subtasks endpoints

func (ctrl *GoalController) CreateSubtask(c *gin.Context) {
	var req createSubtaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	subtask, err := ctrl.goalUsecase.CreateSubtask(c.Request.Context(), req.TaskID, req.Title)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusCreated, subtask)
}

func (ctrl *GoalController) ToggleSubtask(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	subtask, err := ctrl.goalUsecase.ToggleSubtask(c.Request.Context(), id)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, subtask)
}

func (ctrl *GoalController) DeleteSubtask(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	if err := ctrl.goalUsecase.DeleteSubtask(c.Request.Context(), id); err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, gin.H{"deleted": true})
}

