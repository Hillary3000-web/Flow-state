package controller

import (
	"net/http"
	"strconv"

	"github.com/flowstate/backend/internal/controller/middleware"
	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/usecase"
	"github.com/gin-gonic/gin"
)

// AnalyticsController handles HTTP requests for dashboard metrics and telemetry.
type AnalyticsController struct {
	analyticsUsecase usecase.AnalyticsUsecase
}

// NewAnalyticsController constructs an AnalyticsController.
func NewAnalyticsController(analyticsUsecase usecase.AnalyticsUsecase) *AnalyticsController {
	return &AnalyticsController{analyticsUsecase: analyticsUsecase}
}

func (ctrl *AnalyticsController) GetOverview(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	overview, err := ctrl.analyticsUsecase.GetOverview(c.Request.Context(), userID)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, overview)
}

func (ctrl *AnalyticsController) GetTrends(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	days := 14
	if d := c.Query("days"); d != "" {
		if val, err := strconv.Atoi(d); err == nil && val > 0 {
			days = val
		}
	}
	trends, err := ctrl.analyticsUsecase.GetTrends(c.Request.Context(), userID, days)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, trends)
}

func (ctrl *AnalyticsController) GetBurndown(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	days := 7
	if d := c.Query("days"); d != "" {
		if val, err := strconv.Atoi(d); err == nil && val > 0 {
			days = val
		}
	}
	burndown, err := ctrl.analyticsUsecase.GetBurndown(c.Request.Context(), userID, days)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, burndown)
}

func (ctrl *AnalyticsController) GetTimeAllocation(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	allocation, err := ctrl.analyticsUsecase.GetTimeAllocation(c.Request.Context(), userID)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, allocation)
}

