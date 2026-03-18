from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models import db, User
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta  # ✅ FIXED: Added timedelta
import secrets

auth_bp = Blueprint('auth', __name__)

# ==================== LOGIN ROUTES ====================

@auth_bp.route('/login')
def login():
    return render_template('login.html')
@auth_bp.route('/login', methods=['POST'])
def login_post():
    username = request.form.get('username')  # ✅ Correct - checking username
    password = request.form.get('password')
    
    user = User.query.filter_by(username=username).first()  # ✅ Correct - filtering by username
    
    if user and check_password_hash(user.password_hash, password):
        login_user(user)
        return redirect(url_for('dashboard'))
    else:
        flash('Invalid username or password', 'error')  # ✅ Correct message
        return redirect(url_for('auth.login'))
# ==================== REGISTER ROUTES ====================

@auth_bp.route('/signup')
def signup():
    return render_template('signup.html')

@auth_bp.route('/signup', methods=['POST'])
def signup_post():
    username = request.form.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    
    if User.query.filter_by(email=email).first():
        flash('Email already registered!', 'error')
        return redirect(url_for('auth.signup'))
    
    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password)
    )
    
    db.session.add(user)
    db.session.commit()
    
    flash('Registration successful! Please login.', 'success')
    return redirect(url_for('auth.login'))

# ==================== FORGOT PASSWORD ROUTES ====================

@auth_bp.route('/forgot-password')
def forgot_password():
    return render_template('forgot_password.html')

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password_post():
    email = request.form.get('email')
    
    user = User.query.filter_by(email=email).first()
    
    if user:
        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.session.commit()
        
        flash(f'Reset token: {reset_token} (Save this!)', 'success')
        return redirect(url_for('auth.reset_password', token=reset_token))
    else:
        flash('Email not found!', 'error')
        return redirect(url_for('auth.forgot_password'))

@auth_bp.route('/reset-password/<token>')
def reset_password(token):
    user = User.query.filter_by(reset_token=token).first()
    
    if not user or user.reset_token_expires < datetime.utcnow():
        flash('Invalid or expired reset token!', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    return render_template('reset_password.html', token=token)

@auth_bp.route('/reset-password/<token>', methods=['POST'])
def reset_password_post(token):
    user = User.query.filter_by(reset_token=token).first()
    
    if not user or user.reset_token_expires < datetime.utcnow():
        flash('Invalid or expired reset token!', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    new_password = request.form.get('password')
    confirm_password = request.form.get('confirm_password')
    
    if new_password != confirm_password:
        flash('Passwords do not match!', 'error')
        return redirect(url_for('auth.reset_password', token=token))
    
    if len(new_password) < 6:
        flash('Password must be at least 6 characters!', 'error')
        return redirect(url_for('auth.reset_password', token=token))
    
    user.password_hash = generate_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()
    
    flash('Password reset successful! Please login.', 'success')
    return redirect(url_for('auth.login'))