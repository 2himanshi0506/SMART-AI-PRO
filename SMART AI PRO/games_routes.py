from flask import Blueprint, app, render_template, request, jsonify
from flask_login import login_required, current_user
from sqlalchemy import func
from models import db, GameScore, User
from datetime import datetime

games_bp = Blueprint('games', __name__)

# ==================== GAMES LISTING PAGE ====================

@games_bp.route('/games')
@login_required
def games():
    game_scores = GameScore.query.filter_by(user_id=current_user.id).all()
    
    total_score = current_user.game_score or 0
    games_played = len(game_scores)
    
    memory_high = 0
    word_escape_high = 0
    puzzle_high = 0
    
    memory_played = 0
    word_escape_played = 0
    puzzle_played = 0
    
    for score in game_scores:
        if score.game == 'memory':
            memory_played += 1
            if score.score > memory_high:
                memory_high = score.score
        elif score.game == 'word_escape':
            word_escape_played += 1
            if score.score > word_escape_high:
                word_escape_high = score.score
        elif score.game == 'logic_puzzle':
            puzzle_played += 1
            if score.score > puzzle_high:
                puzzle_high = score.score
    
    return render_template('games.html', 
                         total_score=total_score,
                         games_played=games_played,
                         memory_high=memory_high,
                         word_escape_high=word_escape_high,
                         puzzle_high=puzzle_high,
                         memory_played=memory_played,
                         word_escape_played=word_escape_played,
                         puzzle_played=puzzle_played)

# ==================== GAME PAGES ====================

@games_bp.route('/memory-game')
@login_required
def memory_game():
    return render_template('memory_game.html')

@games_bp.route('/word-escape')
@login_required
def word_escape():
    return render_template('word_escape.html')

@games_bp.route('/logic-puzzle')
@login_required
def logic_puzzle():
    return render_template('logic_puzzle.html')

# ==================== SAVE GAME SCORE ====================

@games_bp.route('/save-game-score', methods=['POST'])
@login_required
def save_game_score():
    try:
        data = request.json
        game = data.get('game')
        score = data.get('score')
        
        if not game or not score:
            return jsonify({'success': False, 'error': 'Missing data'})
        
        game_score = GameScore(
            user_id=current_user.id,
            game=game,
            score=score,
            timestamp=datetime.utcnow()
        )
        db.session.add(game_score)
        
        if current_user.game_score is None:
            current_user.game_score = 0
        current_user.game_score += score
        
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Score saved!',
            'total_score': current_user.game_score
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

# ==================== GET GAME STATS ====================

@games_bp.route('/get-game-stats')
@login_required
def get_game_stats():
    game_scores = GameScore.query.filter_by(user_id=current_user.id).all()
    
    stats = {
        'total_score': current_user.game_score or 0,
        'games_played': len(game_scores),
        'memory_high': 0,
        'word_escape_high': 0,
        'puzzle_high': 0
    }
    
    for score in game_scores:
        if score.game == 'memory' and score.score > stats['memory_high']:
            stats['memory_high'] = score.score
        elif score.game == 'word_escape' and score.score > stats['word_escape_high']:
            stats['word_escape_high'] = score.score
        elif score.game == 'logic_puzzle' and score.score > stats['puzzle_high']:
            stats['puzzle_high'] = score.score
    
    return jsonify(stats)



@games_bp.route('/dashboard/games')
@login_required
def games_dashboard():
    user_id = current_user.id

    # --- Aggregate queries, all scoped to the logged-in user ---

    # Sum of all scores; returns None if no rows exist
    total_score = db.session.query(
        func.sum(GameScore.score)
    ).filter_by(user_id=user_id).scalar() or 0

    # Count of all game sessions played
    games_played = db.session.query(
        func.count(GameScore.id)
    ).filter_by(user_id=user_id).scalar() or 0

    # Highest single-game score
    high_score = db.session.query(
        func.max(GameScore.score)
    ).filter_by(user_id=user_id).scalar() or 0

    # Achievements: placeholder — replace with your own logic
    achievements = 0

    return render_template(
        'games_dashboard.html',
        total_score=total_score,
        games_played=games_played,
        high_score=high_score,
        achievements=achievements,
    )


@games_bp.route('/games/save-score', methods=['POST'])
@login_required
def save_score():
    data = request.get_json()
    game_name = data.get('game_name')  # e.g. "Memory Game"
    score     = data.get('score', 0)

    new_score = GameScore(
        user_id   = current_user.id,
        game_name = game_name,
        score     = score,
    )
    db.session.add(new_score)
    db.session.commit()

    return {'status': 'ok'}, 201
# ==================== GET LEADERBOARD ====================

@games_bp.route('/get-leaderboard')
@login_required
def get_leaderboard():
    try:
        # Get top 10 scores across all users
        top_scores = GameScore.query.order_by(GameScore.score.desc()).limit(10).all()
        
        leaderboard = []
        for idx, score in enumerate(top_scores):
            user = User.query.get(score.user_id)
            leaderboard.append({
                'rank': idx + 1,
                'username': user.username if user else 'Unknown',
                'score': score.score,
                'game': score.game
            })
        


        
        
        return jsonify({'leaderboard': leaderboard})
    except Exception as e:
        return jsonify({'error': str(e)})