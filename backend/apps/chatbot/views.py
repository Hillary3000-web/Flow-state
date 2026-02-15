"""
FlowState AI Chatbot — Groq-powered productivity assistant.
Uses Groq's free API with Llama models (OpenAI-compatible).
"""
import httpx
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


SYSTEM_PROMPT = (
    "You are FlowState AI, a friendly and knowledgeable personal productivity assistant "
    "embedded inside the FlowState productivity app. Your role is to help users:\n"
    "- Plan and prioritize their tasks effectively\n"
    "- Build better habits and routines\n"
    "- Stay focused and manage their time\n"
    "- Set and achieve meaningful goals\n"
    "- Overcome procrastination and stay motivated\n\n"
    "Keep responses concise (2-4 sentences unless the user asks for detail). "
    "Be encouraging, actionable, and specific. Use emoji sparingly for warmth. "
    "If asked about something unrelated to productivity, gently redirect the conversation."
)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


class ChatView(APIView):
    """
    POST /api/chatbot/
    Body: { "message": "user message", "history": [...] }
    Returns: { "reply": "assistant response" }
    """

    def post(self, request):
        user_message = request.data.get('message', '').strip()
        if not user_message:
            return Response(
                {'error': 'Message is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        api_key = getattr(settings, 'GROQ_API_KEY', '') or getattr(settings, 'GEMINI_API_KEY', '')
        if not api_key:
            return Response(
                {'error': 'AI service is not configured. Please set GROQ_API_KEY.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            # Build messages array
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]

            # Add conversation history
            history = request.data.get('history', [])
            for msg in history:
                role = 'user' if msg.get('role') == 'user' else 'assistant'
                messages.append({"role": role, "content": msg.get('content', '')})

            # Add current message
            messages.append({"role": "user", "content": user_message})

            # Call Groq API
            response = httpx.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 500,
                },
                timeout=30.0,
            )

            if response.status_code != 200:
                error_data = response.json()
                error_msg = error_data.get('error', {}).get('message', 'Unknown error')
                return Response(
                    {'error': f'AI error: {error_msg}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            data = response.json()
            reply = data['choices'][0]['message']['content']
            return Response({'reply': reply})

        except httpx.TimeoutException:
            return Response(
                {'error': 'The AI took too long to respond. Please try again.'},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        except Exception as e:
            return Response(
                {'error': f'Something went wrong: {str(e)[:200]}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
