from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, current_user
from models import db, ChatHistory

from google import genai

import spacy
import wikipediaapi
import sympy as sp

import os
from dotenv import load_dotenv

load_dotenv()

chat_bp = Blueprint('chat', __name__, url_prefix='/chat')

# ==================== GEMINI SETUP ====================
# ==================== GEMINI SETUP ====================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

gemini_client = None

if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        print("Gemini initialized successfully")
    except Exception as e:
        print(f"Gemini setup failed: {e}")
        

# ==================== EXISTING NLP SETUP ====================
nlp = spacy.load("en_core_web_sm")
wiki = wikipediaapi.Wikipedia(
    language='en',
    user_agent='SMART-AI-PRO/1.0 (your_email@example.com)'
)

intent_map = {
    'define': ['define', 'what is', 'meaning'],
    'explain': ['explain', 'how does', 'describe'],
    'advantages': ['advantages', 'pros', 'benefits'],
    'disadvantages': ['disadvantages', 'cons', 'drawbacks']
}

def detect_intent(message):
    doc = nlp(message.lower())
    for intent, keywords in intent_map.items():
        if any(keyword in doc.text for keyword in keywords):
            return intent
    return 'general'

def generate_fallback_response(message, intent):
    """Your original response logic — used only if Gemini fails."""
    if intent == 'define':
        try:
            query = message.split('define')[1].strip() if 'define' in message else message
            page = wiki.page(query)
            if page.exists():
                return f"Definition: {page.summary[:200]}... [Read more]({page.fullurl})"
        except:
            pass
        return "I couldn't find a definition. Try rephrasing."
    elif intent == 'explain':
        return f"Explanation: {message} involves... (Smart fallback: Learning from context.)"
    elif 'math' in message.lower() or 'solve' in message.lower():
        try:
            expr = message.split('solve')[1].strip() if 'solve' in message else message
            result = sp.sympify(expr)
            return f"Math result: {result}"
        except:
            return "Invalid math expression."
    else:
        return "AI service temporarily unavailable. Please try again later."
def generate_response(message, intent):

    if gemini_client:
        try:
            system_context = (
                "You are a helpful AI assistant inside a student learning platform. "
                "Help students with programming, study tips, quiz topics, math, "
                "general knowledge, and definitions."
            )

            full_prompt = f"{system_context}\n\nStudent asks: {message}"

            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash",
                contents=full_prompt
            )

            return response.text

        except Exception as e:
            print(f"Gemini error: {e}")
            return generate_fallback_response(message, intent)

    else:
        return generate_fallback_response(message, intent)

# ==================== ROUTES ====================

@chat_bp.route('/')
@login_required
def chat():
    return render_template('chat.html')

@chat_bp.route('/send', methods=['POST'])
@login_required
def send_message():
    data = request.json
    message = data.get('message', '').strip()

    if not message:
        return jsonify({'response': 'Please enter a message.'}), 400

    intent = detect_intent(message)
    response = generate_response(message, intent)

    # Save to DB — your existing ChatHistory model unchanged
    try:
        chat_entry = ChatHistory(
            user_id=current_user.id,
            message=message,
            response=response
        )
        db.session.add(chat_entry)
        current_user.total_chats += 1
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"DB error: {e}")

    return jsonify({'response': response})

@chat_bp.route('/history')
@login_required
def get_history():
    history = ChatHistory.query.filter_by(user_id=current_user.id)\
                .order_by(ChatHistory.timestamp.asc()).all()
    return jsonify([
        {
            'message': h.message,
            'response': h.response,
            'time': str(h.timestamp)
        } for h in history
    ])

@chat_bp.route('/clear_history', methods=['POST'])
@login_required
def clear_history():
    ChatHistory.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    return jsonify({'status': 'cleared'})