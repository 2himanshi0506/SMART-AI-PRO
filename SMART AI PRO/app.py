from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, make_response
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, ActivityLog
from auth import auth_bp
from chat import chat_bp
from quiz import quiz_bp
from games_routes import games_bp
from timetable import timetable_bp
from user_profile import profile_bp
from settings_routes import settings_bp
from interest import interest_bp
from flask_wtf import CSRFProtect
import config
from datetime import datetime
import csv
from io import StringIO

app = Flask(__name__)
app.secret_key = "your-secret-key"

csrf = CSRFProtect(app)
app.config.from_object(config.Config)
db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ==================== REGISTER BLUEPRINTS ====================
# (SIRF EK BAAR REGISTER KAREIN)

app.register_blueprint(auth_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(quiz_bp)
app.register_blueprint(games_bp)
app.register_blueprint(timetable_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(settings_bp)
app.register_blueprint(interest_bp)

# ==================== MAIN ROUTES ====================

@app.route('/')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))

# ==================== INTEREST RESULT ROUTES ====================

@app.route('/interest/result', methods=['POST'])
def interest_result_post():
    session['interest_results'] = request.json
    return redirect(url_for('interest_result'))

@app.route('/interest/result')
@login_required
def interest_result():
    result = session.get('interest_results', {
        'personality_type': 'Strategic Thinker',
        'personality_title': 'The Strategic Thinker',
        'personality_description': 'You have a natural ability to process complex information.',
        'strengths': ['Problem Solving', 'Critical Thinking', 'Data Analysis'],
        'skills': ['Data Analysis', 'Research Methods', 'Statistical Thinking'],
        'courses': [
            {'title': 'Data Science Fundamentals', 'level': 'Beginner', 'description': 'Learn the basics.'},
            {'title': 'Advanced Statistics', 'level': 'Advanced', 'description': 'Master statistical methods.'}
        ],
        'careers': [
            {'icon': 'fas fa-chart-bar', 'title': 'Data Analyst', 'description': 'Analyze data.', 'growth': 'High Growth', 'salary': '$65K - $95K'},
            {'icon': 'fas fa-microscope', 'title': 'Research Scientist', 'description': 'Conduct research.', 'growth': 'Stable', 'salary': '$70K - $110K'}
        ]
    })
    return render_template('interest_result.html', result=result)

# ==================== DATABASE SETUP ====================

@app.route('/word-wheel-pro')
def word_wheel_pro():
    return render_template('word_wheel_pro.html')

@app.route('/api/wordwheel/leaderboard')
def wordwheel_leaderboard():
    # Your existing SQLite leaderboard logic
    return jsonify({"top_players": []})

@app.route('/api/wordwheel/save_score', methods=['POST'])
def save_wordwheel_score():
    # Your existing SQLite save score logic
    data = request.json
    # Save to database
    return jsonify({"success": True})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)