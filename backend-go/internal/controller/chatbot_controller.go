package controller

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// ChatbotController handles AI chatbot requests via Groq API (OpenAI-compatible).
type ChatbotController struct {
	groqAPIKey string
}

// NewChatbotController constructs a ChatbotController.
func NewChatbotController() *ChatbotController {
	return &ChatbotController{
		groqAPIKey: os.Getenv("GROQ_API_KEY"),
	}
}

// ---- incoming request types ----

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Message string        `json:"message" binding:"required"`
	History []chatMessage `json:"history"`
}

// ---- Groq / OpenAI-compatible request & response types ----

type groqRequest struct {
	Model       string        `json:"model"`
	Messages    []chatMessage `json:"messages"`
	Temperature float64       `json:"temperature"`
	MaxTokens   int           `json:"max_tokens"`
}

type groqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

const systemPrompt = `You are FlowState AI, a productivity assistant embedded in the FlowState app — a deep work, habit tracking, and goal execution platform.

Your personality: sharp, encouraging, and data-oriented. You speak like a high-performance coach.
Your knowledge: productivity science, habit formation, time management, deep work, goal setting, mental models.

Guidelines:
- Keep responses concise (2-4 paragraphs max unless a detailed breakdown is requested)
- Use bullet points and headers when listing multiple tips or steps
- Reference FlowState features (habits, focus sessions, tasks, goals, checkins) where relevant
- Be direct and action-oriented — avoid vague platitudes
- Do not make up specific statistics unless they are widely established
`

const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions"
const groqModel = "llama-3.3-70b-versatile"

// Chat handles POST /api/v1/chatbot
func (ctrl *ChatbotController) Chat(c *gin.Context) {
	var req chatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{Success: false, Error: "message is required"})
		return
	}

	// No API key — return smart static fallback
	if ctrl.groqAPIKey == "" {
		reply := generateFallbackReply(req.Message)
		c.JSON(http.StatusOK, Response{
			Success: true,
			Data:    gin.H{"reply": reply},
		})
		return
	}

	// Build messages: system prompt + history + current message
	messages := []chatMessage{
		{Role: "system", Content: systemPrompt},
	}
	for _, msg := range req.History {
		if msg.Role == "user" || msg.Role == "assistant" {
			messages = append(messages, msg)
		}
	}
	messages = append(messages, chatMessage{Role: "user", Content: req.Message})

	payload := groqRequest{
		Model:       groqModel,
		Messages:    messages,
		Temperature: 0.7,
		MaxTokens:   1024,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{Success: false, Error: "chatbot service error"})
		return
	}

	httpReq, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, groqEndpoint, bytes.NewReader(body))
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{Success: false, Error: "chatbot service error"})
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+ctrl.groqAPIKey)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, Response{Success: false, Error: "AI service unavailable"})
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{Success: false, Error: "chatbot service error"})
		return
	}

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusBadGateway, Response{
			Success: false,
			Error:   "AI service temporarily unavailable",
		})
		return
	}

	var groqResp groqResponse
	if err := json.Unmarshal(respBody, &groqResp); err != nil || len(groqResp.Choices) == 0 {
		c.JSON(http.StatusInternalServerError, Response{Success: false, Error: "chatbot service error"})
		return
	}

	reply := groqResp.Choices[0].Message.Content

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    gin.H{"reply": reply},
	})
}

// generateFallbackReply returns a canned reply when no GROQ_API_KEY is configured.
func generateFallbackReply(message string) string {
	msg := strings.ToLower(message)
	switch {
	case strings.Contains(msg, "focus") || strings.Contains(msg, "concentrate"):
		return "**Deep Work Protocol:**\n\n- Block 90-minute focused sessions using the Flow State timer\n- Silence all notifications before starting\n- Work on your single most important task first\n- Track your focus sessions to spot your peak productivity hours\n\nThe brain's prefrontal cortex performs best in the first 2 hours after waking — schedule your hardest work then."
	case strings.Contains(msg, "habit") || strings.Contains(msg, "routine"):
		return "**Habit Architecture Principles:**\n\n- **Identity first**: Decide who you want to be, then act accordingly\n- **Habit stacking**: Attach new habits to existing anchors\n- **2-minute rule**: Start with a version so small it's laughable\n- **Track your streaks** in FlowState — consistency compounds\n\nAim for 80% consistency rather than 100% perfection."
	case strings.Contains(msg, "priorit") || strings.Contains(msg, "task"):
		return "**Task Prioritization Framework:**\n\n1. **P1 (Urgent + Important)**: Do first — these are crises\n2. **P2 (Not Urgent + Important)**: Schedule — this is where growth happens\n3. **P3 (Urgent + Not Important)**: Delegate if possible\n4. **P4**: Eliminate\n\nIn FlowState, use the priority field to tag tasks. Review your P2 tasks every morning."
	case strings.Contains(msg, "morning"):
		return "**Optimized Morning Stack:**\n\n- **0-30 min**: Sunlight exposure + movement (sets circadian rhythm)\n- **30-60 min**: No phone/email — protect your best cognitive window\n- **60-90 min**: Tackle your most important single task\n- **90+ min**: Check communications and plan the rest of the day\n\nLog your morning energy level in FlowState's daily checkin to track what works."
	default:
		return "**FlowState AI is ready to help!**\n\nI can assist with:\n- **Productivity systems** — deep work, time blocking, task prioritization\n- **Habit formation** — building routines that stick\n- **Goal achievement** — breaking big goals into executable projects\n- **Focus optimization** — managing energy and attention\n\nTry asking: *\"How do I prioritize my tasks?\"* or *\"Tips for building a morning routine\"*\n\n> **Note**: Set your `GROQ_API_KEY` environment variable to unlock full AI responses."
	}
}
