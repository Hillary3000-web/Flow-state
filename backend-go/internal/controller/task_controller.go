package controller

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/flowstate/backend/internal/controller/middleware"
	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/usecase"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// TaskController handles HTTP requests for tasks.
type TaskController struct {
	taskUsecase usecase.TaskUsecase
}

// NewTaskController constructs a TaskController instance.
func NewTaskController(taskUsecase usecase.TaskUsecase) *TaskController {
	return &TaskController{
		taskUsecase: taskUsecase,
	}
}

type createTaskRequest struct {
	ProjectID        *uuid.UUID `json:"project_id"`
	Title            string     `json:"title" binding:"required"`
	Description      string     `json:"description"`
	Priority         string     `json:"priority"`
	EnergyLevel      string     `json:"energy_level"`
	DueDate          *string    `json:"due_date"`
	EstimatedMinutes *int       `json:"estimated_minutes"`
	IsRecurring      bool       `json:"is_recurring"`
	RecurrenceRule   string     `json:"recurrence_rule"`
}

type updateTaskRequest struct {
	ProjectID        *uuid.UUID `json:"project_id"`
	Title            *string    `json:"title"`
	Description      *string    `json:"description"`
	Priority         *string    `json:"priority"`
	EnergyLevel      *string    `json:"energy_level"`
	Status           *string    `json:"status"`
	DueDate          *string    `json:"due_date"`
	EstimatedMinutes *int       `json:"estimated_minutes"`
	ActualMinutes    *int       `json:"actual_minutes"`
	IsRecurring      *bool      `json:"is_recurring"`
	RecurrenceRule   *string    `json:"recurrence_rule"`
	SortOrder        *int       `json:"sort_order"`
}

type quickCaptureRequest struct {
	RawText  string `json:"raw_text"`
	Text     string `json:"text"`
	Title    string `json:"title"`
	Priority string `json:"priority"`
}

type reorderTasksRequest struct {
	Items []struct {
		ID        uuid.UUID `json:"id"`
		SortOrder int       `json:"sort_order"`
	} `json:"items"`
}

// ListTasks godoc
// GET /api/v1/tasks
func (ctrl *TaskController) ListTasks(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	filter := domain.TaskFilter{}

	if status := c.Query("status"); status != "" && status != "all" {
		st := domain.TaskStatus(status)
		filter.Status = &st
	}
	if priority := c.Query("priority"); priority != "" {
		p := domain.TaskPriority(priority)
		filter.Priority = &p
	}
	if energy := c.Query("energy_level"); energy != "" {
		e := domain.EnergyLevel(energy)
		filter.EnergyLevel = &e
	}
	if pID := c.Query("project_id"); pID != "" {
		if parsed, err := uuid.Parse(pID); err == nil {
			filter.ProjectID = &parsed
		}
	}
	if search := c.Query("search"); search != "" {
		filter.Search = search
	}
	if isRec := c.Query("is_recurring"); isRec != "" {
		val := isRec == "true" || isRec == "1"
		filter.IsRecurring = &val
	}
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			filter.Limit = l
		}
	}
	if offsetStr := c.Query("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			filter.Offset = o
		}
	}

	tasks, err := ctrl.taskUsecase.ListTasks(c.Request.Context(), userID, filter)
	if err != nil {
		respondError(c, err)
		return
	}

	if tasks == nil {
		tasks = []*domain.Task{}
	}

	// Double-envelope for full backwards compatibility with Django DRF (results) and Go (data)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"results": tasks,
		"data":    tasks,
		"count":   len(tasks),
	})
}

// GetTask godoc
// GET /api/v1/tasks/:id
func (ctrl *TaskController) GetTask(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	task, err := ctrl.taskUsecase.GetTask(c.Request.Context(), userID, taskID)
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, task)
}

// CreateTask godoc
// POST /api/v1/tasks
func (ctrl *TaskController) CreateTask(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	var req createTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	dueDate := parseOptionalTime(req.DueDate)

	task, err := ctrl.taskUsecase.CreateTask(c.Request.Context(), usecase.CreateTaskInput{
		UserID:           userID,
		ProjectID:        req.ProjectID,
		Title:            req.Title,
		Description:      req.Description,
		Priority:         domain.TaskPriority(req.Priority),
		EnergyLevel:      domain.EnergyLevel(req.EnergyLevel),
		DueDate:          dueDate,
		EstimatedMinutes: req.EstimatedMinutes,
		IsRecurring:      req.IsRecurring,
		RecurrenceRule:   req.RecurrenceRule,
	})
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusCreated, task)
}

// UpdateTask godoc
// PATCH /api/v1/tasks/:id
func (ctrl *TaskController) UpdateTask(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	var req updateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	input := usecase.UpdateTaskInput{
		ID:               taskID,
		UserID:           userID,
		ProjectID:        req.ProjectID,
		Title:            req.Title,
		Description:      req.Description,
		EstimatedMinutes: req.EstimatedMinutes,
		ActualMinutes:    req.ActualMinutes,
		IsRecurring:      req.IsRecurring,
		RecurrenceRule:   req.RecurrenceRule,
		SortOrder:        req.SortOrder,
	}

	if req.Priority != nil {
		p := domain.TaskPriority(*req.Priority)
		input.Priority = &p
	}
	if req.EnergyLevel != nil {
		e := domain.EnergyLevel(*req.EnergyLevel)
		input.EnergyLevel = &e
	}
	if req.Status != nil {
		s := domain.TaskStatus(*req.Status)
		input.Status = &s
	}
	if req.DueDate != nil {
		input.DueDate = parseOptionalTime(req.DueDate)
	}

	updated, err := ctrl.taskUsecase.UpdateTask(c.Request.Context(), input)
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, updated)
}

// DeleteTask godoc
// DELETE /api/v1/tasks/:id
func (ctrl *TaskController) DeleteTask(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	if err := ctrl.taskUsecase.DeleteTask(c.Request.Context(), userID, taskID); err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, gin.H{"deleted": taskID.String()})
}

// CompleteTask godoc
// POST /api/v1/tasks/:id/complete
func (ctrl *TaskController) CompleteTask(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	taskID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	task, err := ctrl.taskUsecase.MarkComplete(c.Request.Context(), userID, taskID)
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, task)
}

// QuickCapture godoc
// POST /api/v1/tasks/quick-capture
func (ctrl *TaskController) QuickCapture(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	var req quickCaptureRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	text := req.RawText
	if text == "" {
		text = req.Text
	}
	if text == "" {
		text = req.Title
	}

	task, err := ctrl.taskUsecase.QuickCapture(c.Request.Context(), userID, text, domain.TaskPriority(req.Priority))
	if err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusCreated, task)
}

// ReorderTasks godoc
// PATCH /api/v1/tasks/reorder
func (ctrl *TaskController) ReorderTasks(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}

	var req reorderTasksRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}

	items := make([]usecase.ReorderTaskItem, len(req.Items))
	for i, item := range req.Items {
		items[i] = usecase.ReorderTaskItem{
			ID:        item.ID,
			SortOrder: item.SortOrder,
		}
	}

	if err := ctrl.taskUsecase.ReorderTasks(c.Request.Context(), userID, items); err != nil {
		respondError(c, err)
		return
	}

	respondSuccess(c, http.StatusOK, gin.H{"status": "reordered"})
}

func parseOptionalTime(s *string) *time.Time {
	if s == nil || strings.TrimSpace(*s) == "" {
		return nil
	}
	val := strings.TrimSpace(*s)
	formats := []string{
		time.RFC3339,
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02T15:04:05",
		"2006-01-02T15:04",
		"2006-01-02",
	}
	for _, layout := range formats {
		if t, err := time.Parse(layout, val); err == nil {
			return &t
		}
	}
	return nil
}
