"""
FlowState AI Chatbot — Gemini-powered productivity assistant.
"""
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import google.generativeai as genai


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

        api_key = getattr(settings, 'GEMINI_API_KEY', '')
        if not api_key:
            return Response(
                {'error': 'AI service is not configured. Please set GEMINI_API_KEY.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            genai.configure(api_key=api_key)

            # Try models in order — fallback if one hits quota
            models_to_try = ['gemini-1.5-flash', 'gemini-2.0-flash']
            last_error = None

            for model_name in models_to_try:
                try:
                    model = genai.GenerativeModel(
                        model_name,
                        system_instruction=SYSTEM_PROMPT,
                    )

                    # Rebuild conversation history from frontend
                    history = request.data.get('history', [])
                    chat_history = []
                    for msg in history:
                        role = 'user' if msg.get('role') == 'user' else 'model'
                        chat_history.append({'role': role, 'parts': [msg.get('content', '')]})

                    chat = model.start_chat(history=chat_history)
                    response = chat.send_message(user_message)

                    return Response({'reply': response.text})

                except Exception as model_err:
                    last_error = model_err
                    continue  # Try next model

            # All models failed
            raise last_error

        except Exception as e:
            error_str = str(e)
            if '429' in error_str or 'quota' in error_str.lower():
                friendly_error = 'I\'m a bit busy right now! Please try again in about 30 seconds. 🕐'
            elif 'API key' in error_str or 'authentication' in error_str.lower():
                friendly_error = 'AI service is not properly configured. Please check your API key.'
            else:
                friendly_error = 'Something went wrong with the AI service. Please try again.'
            return Response(
                {'error': friendly_error},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
