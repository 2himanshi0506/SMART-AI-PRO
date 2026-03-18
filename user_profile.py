from flask import Blueprint, render_template
from flask_login import login_required, current_user
from models import QuizAttempt, GameScore

profile_bp = Blueprint('profile', __name__, url_prefix='/profile')

@profile_bp.route('/')
@login_required
def profile():
    quiz_summary = {}
    attempts = QuizAttempt.query.filter_by(user_id=current_user.id).all()
    for a in attempts:
        if a.topic not in quiz_summary:
            quiz_summary[a.topic] = []
        quiz_summary[a.topic].append(a.score)
    
    game_summary = {}
    scores = GameScore.query.filter_by(user_id=current_user.id).all()
    for s in scores:
        if s.game not in game_summary:
            game_summary[s.game] = []
        game_summary[s.game].append(s.score)
    
    return render_template('profile.html', user=current_user, quiz_summary=quiz_summary, game_summary=game_summary)