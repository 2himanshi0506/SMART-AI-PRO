from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, current_user
from models import db, QuizQuestion, QuizAttempt
from collections import deque  # Queue for questions

quiz_bp = Blueprint('quiz', __name__, url_prefix='/quiz')

# Sample questions (in production, load from DB or file)
questions = {
    'HTML': [
        {'question': 'What does HTML stand for?', 'options': ['HyperText Markup Language', 'Home Tool Markup Language'], 'answer': 'A'},
        # Add more...
    ],
    'CSS': [
        {'question': 'What is CSS?', 'options': ['Cascading Style Sheets', 'Computer Style Sheets'], 'answer': 'A'},
    ],
    'Python': [
        {'question': 'What is Python?', 'options': ['A programming language', 'A snake'], 'answer': 'A'},
    ],
    'DSA': [
        {'question': 'What is a stack?', 'options': ['LIFO structure', 'FIFO structure'], 'answer': 'A'},
    ]
}

@quiz_bp.route('/')
@login_required
def quiz():
    return render_template('quiz.html')

@quiz_bp.route('/start/<topic>', methods=['GET'])
@login_required
def start_quiz(topic):
    if topic not in questions:
        return jsonify({'error': 'Invalid topic'})
    q_queue = deque(questions[topic])  # Queue for serving questions
    session['quiz_queue'] = list(q_queue)
    session['quiz_score'] = 0
    session['quiz_topic'] = topic
    return jsonify({'question': q_queue[0]})

@quiz_bp.route('/answer', methods=['POST'])
@login_required
def answer_quiz():
    data = request.json
    answer = data['answer']
    q_queue = deque(session['quiz_queue'])
    current_q = q_queue.popleft()
    if answer == current_q['answer']:
        session['quiz_score'] += 1
    session['quiz_queue'] = list(q_queue)
    if not q_queue:
        # Save attempt
        attempt = QuizAttempt(user_id=current_user.id, topic=session['quiz_topic'], score=session['quiz_score'])
        db.session.add(attempt)
        db.session.commit()
        return jsonify({'finished': True, 'score': session['quiz_score']})
    return jsonify({'question': q_queue[0]})

@quiz_bp.route('/leaderboard')
@login_required
def leaderboard():
    attempts = QuizAttempt.query.all()
    scores = {}
    for a in attempts:
        if a.topic not in scores:
            scores[a.topic] = []
        scores[a.topic].append(a.score)
    return jsonify(scores)