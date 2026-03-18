from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, make_response
from flask_login import login_required, current_user
from models import db, ActivityLog
from werkzeug.security import generate_password_hash
from datetime import datetime
import csv
from io import StringIO

settings_bp = Blueprint('settings', __name__, url_prefix='/settings')

@settings_bp.route('')
@login_required
def settings():
    activities = ActivityLog.query.filter_by(user_id=current_user.id)\
        .order_by(ActivityLog.timestamp.desc()).limit(10).all()
    return render_template('settings.html', activities=activities)

@settings_bp.route('/update-password', methods=['POST'])
@login_required
def update_password():
    password = request.form.get('password')
    confirm_password = request.form.get('confirm_password')
    
    if password != confirm_password:
        flash('Passwords do not match!', 'error')
        return redirect(url_for('settings.settings'))
    
    if len(password) < 6:
        flash('Password must be at least 6 characters!', 'error')
        return redirect(url_for('settings.settings'))
    
    current_user.password_hash = generate_password_hash(password)
    db.session.commit()
    
    if current_user.activity_log:
        activity = ActivityLog(
            user_id=current_user.id,
            action='password_updated',
            description='Password updated successfully'
        )
        db.session.add(activity)
        db.session.commit()
    
    flash('Password updated successfully!', 'success')
    return redirect(url_for('settings.settings'))

@settings_bp.route('/update-settings', methods=['POST'])
@login_required
def update_settings():
    data = request.json
    setting_type = data.get('setting_type')
    value = data.get('value')
    
    if setting_type == 'theme':
        current_user.theme_preference = value
        description = f'Theme changed to {value}'
    elif setting_type == 'email_notifications':
        current_user.email_notifications = value
        description = f'Email notifications {"enabled" if value else "disabled"}'
    elif setting_type == 'push_notifications':
        current_user.push_notifications = value
        description = f'Push notifications {"enabled" if value else "disabled"}'
    elif setting_type == 'activity_log':
        current_user.activity_log = value
        description = f'Activity log {"enabled" if value else "disabled"}'
    elif setting_type == 'two_factor':
        current_user.two_factor = value
        description = f'Two-factor authentication {"enabled" if value else "disabled"}'
    else:
        return jsonify({'success': False, 'error': 'Invalid setting type'})
    
    current_user.updated_at = datetime.utcnow()
    db.session.commit()
    
    if current_user.activity_log:
        activity = ActivityLog(
            user_id=current_user.id,
            action=setting_type,
            description=description
        )
        db.session.add(activity)
        db.session.commit()
    
    return jsonify({'success': True})

@settings_bp.route('/get-activities')
@login_required
def get_activities():
    activities = ActivityLog.query.filter_by(user_id=current_user.id)\
        .order_by(ActivityLog.timestamp.desc()).limit(10).all()
    
    return jsonify([{
        'id': a.id,
        'action': a.action,
        'description': a.description,
        'timestamp': a.timestamp.strftime('%Y-%m-%d %H:%M')
    } for a in activities])

@settings_bp.route('/download-activity-log')
@login_required
def download_activity_log():
    activities = ActivityLog.query.filter_by(user_id=current_user.id)\
        .order_by(ActivityLog.timestamp.desc()).all()
    
    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['S.No', 'Date', 'Time', 'Action', 'Description'])
    
    for i, activity in enumerate(activities, 1):
        date = activity.timestamp.strftime('%Y-%m-%d')
        time = activity.timestamp.strftime('%H:%M:%S')
        cw.writerow([i, date, time, activity.action, activity.description])
    
    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=activity_log.csv"
    output.headers["Content-type"] = "text/csv"
    
    return output