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

// ScheduleController handles HTTP requests for schedule time blocks.
type ScheduleController struct {
	scheduleUsecase usecase.ScheduleUsecase
}

// NewScheduleController constructs a ScheduleController.
func NewScheduleController(scheduleUsecase usecase.ScheduleUsecase) *ScheduleController {
	return &ScheduleController{scheduleUsecase: scheduleUsecase}
}

type createBlockRequest struct {
	TaskID    *uuid.UUID `json:"task_id"`
	Title     string     `json:"title" binding:"required"`
	BlockDate string     `json:"block_date" binding:"required"`
	StartTime string     `json:"start_time"`
	EndTime   string     `json:"end_time"`
	BlockType string     `json:"block_type"`
}

type updateBlockRequest struct {
	Title       *string `json:"title"`
	StartTime   *string `json:"start_time"`
	EndTime     *string `json:"end_time"`
	BlockType   *string `json:"block_type"`
	IsCompleted *bool   `json:"is_completed"`
}

type reorderBlocksRequest struct {
	Items []usecase.ReorderBlockItem `json:"items" binding:"required"`
}

func (ctrl *ScheduleController) ListBlocks(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	dateStr := c.Query("date")
	targetDate := time.Now().UTC()
	if dateStr != "" {
		if t, err := time.Parse("2006-01-02", dateStr); err == nil {
			targetDate = t
		}
	}
	blocks, err := ctrl.scheduleUsecase.ListBlocksByDate(c.Request.Context(), userID, targetDate)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, blocks)
}

func (ctrl *ScheduleController) CreateBlock(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	var req createBlockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	blockDate, err := time.Parse("2006-01-02", req.BlockDate)
	if err != nil {
		blockDate = time.Now().UTC()
	}
	block, err := ctrl.scheduleUsecase.CreateBlock(
		c.Request.Context(),
		userID,
		req.TaskID,
		req.Title,
		blockDate,
		req.StartTime,
		req.EndTime,
		domain.BlockType(req.BlockType),
	)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusCreated, block)
}

func (ctrl *ScheduleController) GetBlock(c *gin.Context) {
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
	block, err := ctrl.scheduleUsecase.GetBlock(c.Request.Context(), id, userID)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, block)
}

func (ctrl *ScheduleController) UpdateBlock(c *gin.Context) {
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
	var req updateBlockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	var bt *domain.BlockType
	if req.BlockType != nil {
		b := domain.BlockType(*req.BlockType)
		bt = &b
	}
	block, err := ctrl.scheduleUsecase.UpdateBlock(c.Request.Context(), id, userID, req.Title, req.StartTime, req.EndTime, bt, req.IsCompleted)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, block)
}

func (ctrl *ScheduleController) DeleteBlock(c *gin.Context) {
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
	if err := ctrl.scheduleUsecase.DeleteBlock(c.Request.Context(), id, userID); err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, gin.H{"deleted": true})
}

func (ctrl *ScheduleController) ReorderBlocks(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	var req reorderBlocksRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondError(c, domain.ErrInvalidInput)
		return
	}
	if err := ctrl.scheduleUsecase.ReorderBlocks(c.Request.Context(), userID, req.Items); err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, gin.H{"reordered": true})
}

func (ctrl *ScheduleController) GetWeekly(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	startStr := c.Query("start_date")
	startDate := time.Now().UTC()
	if startStr != "" {
		if t, err := time.Parse("2006-01-02", startStr); err == nil {
			startDate = t
		}
	}
	blocks, err := ctrl.scheduleUsecase.ListWeeklyBlocks(c.Request.Context(), userID, startDate)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, blocks)
}

func (ctrl *ScheduleController) GetRisks(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	overdue, atRisk, err := ctrl.scheduleUsecase.GetRisks(c.Request.Context(), userID)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, gin.H{
		"overdue": overdue,
		"at_risk": atRisk,
	})
}

