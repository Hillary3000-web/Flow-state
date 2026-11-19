package controller

import (
	"net/http"
	"strconv"

	"github.com/flowstate/backend/internal/controller/middleware"
	"github.com/flowstate/backend/internal/domain"
	"github.com/flowstate/backend/internal/usecase"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// NotificationController handles HTTP requests for user notifications.
type NotificationController struct {
	notifUsecase usecase.NotificationUsecase
}

// NewNotificationController constructs a NotificationController.
func NewNotificationController(notifUsecase usecase.NotificationUsecase) *NotificationController {
	return &NotificationController{notifUsecase: notifUsecase}
}

func (ctrl *NotificationController) ListNotifications(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	unreadOnly := c.Query("unread") == "true"
	limit := 50
	if l := c.Query("limit"); l != "" {
		if val, err := strconv.Atoi(l); err == nil && val > 0 {
			limit = val
		}
	}
	notifications, err := ctrl.notifUsecase.ListNotifications(c.Request.Context(), userID, unreadOnly, limit)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, notifications)
}

func (ctrl *NotificationController) MarkRead(c *gin.Context) {
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
	if err := ctrl.notifUsecase.MarkAsRead(c.Request.Context(), id, userID); err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, gin.H{"marked_read": true})
}

func (ctrl *NotificationController) MarkAllRead(c *gin.Context) {
	userID, err := middleware.GetUserID(c)
	if err != nil {
		respondError(c, domain.ErrUnauthorized)
		return
	}
	if err := ctrl.notifUsecase.MarkAllAsRead(c.Request.Context(), userID); err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, gin.H{"marked_all_read": true})
}

func (ctrl *NotificationController) DeleteNotification(c *gin.Context) {
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
	if err := ctrl.notifUsecase.DeleteNotification(c.Request.Context(), id, userID); err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, http.StatusOK, gin.H{"deleted": true})
}

