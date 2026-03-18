from flask import Blueprint, request, jsonify, render_template
from flask_login import login_required, current_user
from models import db, TimetableTask
from datetime import datetime

timetable_bp = Blueprint('timetable', __name__, url_prefix='/timetable')

@timetable_bp.route('/')
@login_required
def timetable():
    return render_template('timetable.html')

@timetable_bp.route('/tasks')
@login_required
def get_tasks():
    tasks = TimetableTask.query.filter_by(user_id=current_user.id).order_by(TimetableTask.priority.desc()).all()
    return jsonify([{'id': t.id, 'task': t.task, 'priority': t.priority, 'due_date': str(t.due_date), 'completed': t.completed} for t in tasks])

@timetable_bp.route('/add', methods=['POST'])
@login_required
def add_task():
    data = request.json
    task = TimetableTask(
        user_id=current_user.id,
        task=data['task'],
        priority=data['priority'],
        due_date=datetime.fromisoformat(data['due_date'])
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'status': 'added'})

@timetable_bp.route('/edit/<int:task_id>', methods=['PUT'])
@login_required
def edit_task(task_id):
    task = TimetableTask.query.get(task_id)
    if task and task.user_id == current_user.id:
        data = request.json
        task.task = data['task']
        task.priority = data['priority']
        task.due_date = datetime.fromisoformat(data['due_date'])
        db.session.commit()
    return jsonify({'status': 'updated'})

@timetable_bp.route('/delete/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    task = TimetableTask.query.get(task_id)
    if task and task.user_id == current_user.id:
        db.session.delete(task)
        db.session.commit()
    return jsonify({'status': 'deleted'})