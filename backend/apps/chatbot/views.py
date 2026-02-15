"""
FlowState AI Chatbot — Gemini-powered productivity assistant.
Uses the new google-genai SDK (replacement for deprecated google-generativeai).
"""
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from google import genai
from google.genai import types


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
            client = genai.Client(api_key=api_key)

            # Build conversation contents from history
            contents = []
            history = request.data.get('history', [])
            for msg in history:
                role = 'user' if msg.get('role') == 'user' else 'model'
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=msg.get('content', ''))],
                    )
                )

            # Add the current user message
            contents.append(
                types.Content(
                    role='user',
                    parts=[types.Part.from_text(text=user_message)],
                )
            )

            # Try models in order — fallback if one hits quota
            models_to_try = ['gemini-1.5-flash', 'gemini-2.0-flash']
            last_error = None

            for model_name in models_to_try:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            system_instruction=SYSTEM_PROMPT,
                        ),
                    )
                    return Response({'reply': response.text})

                except Exception as model_err:
                    last_error = model_err
                    continue

            # All models failed
            raise last_error

        except Exception as e:
            error_str = str(e)
            # DEBUG: show raw error temporarily
            return Response(
                {'error': f'DEBUG: {error_str[:300]}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
