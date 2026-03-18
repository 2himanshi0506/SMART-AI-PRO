from flask import Blueprint, request, jsonify, render_template, redirect, url_for
from flask_login import login_required, current_user
from models import db, InterestResult
from collections import defaultdict  # For scoring (HashMap/Dictionary concept)

interest_bp = Blueprint('interest', __name__, url_prefix='/interest_finder')

# Quiz questions (expandable; each option has a category and score)
QUESTIONS = [
    {
        "question": "What excites you most about technology?",
        "options": [
            {"text": "Building apps and solving coding problems", "category": "Programming", "score": 1},
            {"text": "Creating visually appealing designs", "category": "Designing", "score": 1},
            {"text": "Leading teams and managing projects", "category": "Management", "score": 1},
            {"text": "Analyzing data and predicting trends", "category": "AI & Data Science", "score": 1}
        ]
    },
    {
        "question": "How do you prefer to spend your free time?",
        "options": [
            {"text": "Experimenting with code or gadgets", "category": "Programming", "score": 1},
            {"text": "Sketching or editing photos/videos", "category": "Designing", "score": 1},
            {"text": "Organizing events or planning", "category": "Management", "score": 1},
            {"text": "Reading about AI or cybersecurity", "category": "Networking & Security", "score": 1}
        ]
    },
    # Add 8 more questions similarly (total 10 for a balanced quiz)
    {
        "question": "What skill do you want to master?",
        "options": [
            {"text": "Cloud infrastructure and deployment", "category": "Cloud Computing", "score": 1},
            {"text": "UI/UX design principles", "category": "Designing", "score": 1},
            {"text": "Data modeling and machine learning", "category": "AI & Data Science", "score": 1},
            {"text": "Network security protocols", "category": "Networking & Security", "score": 1}
        ]
    },
    # ... (repeat pattern for 10 questions)
]

CATEGORIES = ["Programming", "Designing", "Management", "AI & Data Science", "Networking & Security", "Cloud Computing"]

# Career suggestions based on categories
CAREER_SUGGESTIONS = {
    "Programming": ["Software Developer", "Full-Stack Engineer", "Mobile App Developer"],
    "Designing": ["UI/UX Designer", "Graphic Designer", "Product Designer"],
    "Management": ["Project Manager", "Business Analyst", "Team Lead"],
    "AI & Data Science": ["Data Scientist", "Machine Learning Engineer", "AI Researcher"],
    "Networking & Security": ["Cybersecurity Analyst", "Network Engineer", "IT Security Specialist"],
    "Cloud Computing": ["Cloud Architect", "DevOps Engineer", "Cloud Solutions Engineer"]
}

# Skills suggestions
SKILLS_SUGGESTIONS = {
    "Programming": ["Python", "JavaScript", "Algorithms"],
    "Designing": ["Figma", "Adobe Creative Suite", "Prototyping"],
    "Management": ["Agile/Scrum", "Leadership", "Project Planning"],
    "AI & Data Science": ["Python (Pandas)", "Machine Learning", "Statistics"],
    "Networking & Security": ["Firewalls", "Ethical Hacking", "Network Protocols"],
    "Cloud Computing": ["AWS", "Docker", "Kubernetes"]
}

# AI-enhanced personality traits (keyword mapping)
TRAIT_MAPPING = {
    "Programming": "analytical thinking and problem-solving skills",
    "Designing": "creative and visual thinking",
    "Management": "leadership and organizational abilities",
    "AI & Data Science": "data-driven and innovative mindset",
    "Networking & Security": "detail-oriented and security-conscious approach",
    "Cloud Computing": "scalable and efficient thinking"
}

@interest_bp.route('/')
@login_required
def interest_finder():
    return render_template('interest_finder.html', questions=QUESTIONS)

@interest_bp.route('/submit', methods=['POST'])
@login_required
def submit_quiz():
    data = request.json
    scores = defaultdict(int)  # HashMap for scoring
    
    # Calculate scores
    for answer in data['answers']:
        question_idx = answer['question']
        option_idx = answer['option']
        category = QUESTIONS[question_idx]['options'][option_idx]['category']
        score = QUESTIONS[question_idx]['options'][option_idx]['score']
        scores[category] += score
    
    # Find top 2 categories
    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top = sorted_scores[0][0] if sorted_scores else "None"
    secondary = sorted_scores[1][0] if len(sorted_scores) > 1 else "None"
    
    # Generate results
    result = {
        "top_interest": top,
        "secondary_interest": secondary,
        "careers": CAREER_SUGGESTIONS.get(top, []),
        "skills": SKILLS_SUGGESTIONS.get(top, []),
        "motivational_message": f"Keep exploring! Based on your answers, you have strong {TRAIT_MAPPING.get(top, 'curious')}.",
        "scores": dict(scores)  # Full score breakdown
    }
    
    # Save to DB
    interest_entry = InterestResult(
        user_id=current_user.id,
        interest_result={"top": top, "secondary": secondary},
        score_data=dict(scores)
    )
    db.session.add(interest_entry)
    db.session.commit()
    
    return jsonify(result)

@interest_bp.route('/retake')
@login_required
def retake():
    # Clear previous results (optional) or just redirect
    return redirect(url_for('interest.interest_finder'))