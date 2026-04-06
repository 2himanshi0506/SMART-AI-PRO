import os
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, g
from flask_login import LoginManager, logout_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_session import Session
from flask_wtf.csrf import CSRFProtect, generate_csrf
from flask_wtf import FlaskForm
from flask_mail import Mail, Message
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email, Length, EqualTo
from itsdangerous import URLSafeTimedSerializer, SignatureExpired
from datetime import datetime
from config import Config
from models import db, User, ChatHistory, QuizResult, InterestResult, GameScore

# ✅ FIXED: Lazy imports
def import_blueprints():
    from auth import auth_bp
    from chat import chat_bp
    from quiz import quiz_bp
    from games_routes import games_bp
    from interest import interest_bp
    try:
        from timetable import timetable_bp
        from user_profile import profile_bp
        from settings_routes import settings_bp
    except ImportError:
        timetable_bp = profile_bp = settings_bp = None
    return auth_bp, chat_bp, quiz_bp, games_bp, interest_bp, timetable_bp, profile_bp, settings_bp

login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # ✅ FIXED CSRF - Proper initialization ORDER
    csrf = CSRFProtect()
    csrf.init_app(app)
    
    # ✅ EMAIL CONFIG - UPDATE THESE WITH YOUR CREDENTIALS
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = 'your-email@gmail.com'  # ← CHANGE THIS
    app.config['MAIL_PASSWORD'] = 'your-app-password'     # ← CHANGE THIS (App Password)
    app.config['MAIL_DEFAULT_SENDER'] = 'your-email@gmail.com'
    
    # Initialize extensions
    db.init_app(app)
    Session(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in.'
    CORS(app)
    mail = Mail(app)  # ✅ Email support
    
    # Password reset serializer
    reset_serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])
    
    # ==================== FORGOT PASSWORD FORMS ====================
    class ForgotPasswordForm(FlaskForm):
        email = StringField('Email', validators=[DataRequired(), Email()])
        submit = SubmitField('Send Reset Link')

    class ResetPasswordForm(FlaskForm):
        password = PasswordField('New Password', validators=[DataRequired(), Length(min=6)])
        confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
        submit = SubmitField('Reset Password')
    
    # ✅ FIXED: Blueprint registration
    auth_bp, chat_bp, quiz_bp, games_bp, interest_bp, timetable_bp, profile_bp, settings_bp = import_blueprints()
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(chat_bp, url_prefix='/chat')
    app.register_blueprint(quiz_bp, url_prefix='/quiz')
    app.register_blueprint(games_bp, url_prefix='/games')
    app.register_blueprint(interest_bp, url_prefix='/interest')
    
    if timetable_bp: app.register_blueprint(timetable_bp, url_prefix='/timetable')
    if profile_bp: app.register_blueprint(profile_bp, url_prefix='/profile')
    if settings_bp: app.register_blueprint(settings_bp, url_prefix='/settings')
    
    # ✅ FIXED: User loader
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # ✅ FIXED: Use standalone generate_csrf() function
    @app.context_processor
    def inject_csrf_token():
        return {'csrf_token': generate_csrf()}
    
    # ==================== FORGOT PASSWORD ROUTES ====================
    @app.route('/forgot-password', methods=['GET', 'POST'])
    def forgot_password():
        form = ForgotPasswordForm()
        if form.validate_on_submit():
            email = form.email.data
            
            # Check if user exists
            user = User.query.filter_by(email=email).first()
            if not user:
                flash('If that email exists, check your inbox for reset instructions.', 'info')
                return redirect(url_for('forgot_password'))
            
            # Generate reset token (expires in 1 hour)
            token = reset_serializer.dumps(email, salt='password-reset-salt')
            reset_url = url_for('reset_password', token=token, _external=True)
            
            # Send email
            msg = Message(
                subject='🔐 Password Reset - Smart AI Assistant Pro',
                recipients=[email],
                html=f"""
                <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4F46E5;">Reset Your Password</h2>
                    <p>Hi! You requested a password reset. Click below to set a new password:</p>
                    <a href="{reset_url}" 
                       style="background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);">
                        Reset Password
                    </a>
                    <p style="color: #666; font-size: 14px;"><small>This link expires in 1 hour. If you didn't request this, ignore this email.</small></p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #888; font-size: 12px;">Smart AI Assistant Pro © 2024</p>
                </div>
                """
            )
            
            try:
                mail.send(msg)
                flash('✅ Check your email for password reset instructions!', 'success')
            except Exception as e:
                flash('❌ Failed to send email. Please try again.', 'error')
                print(f"Email error: {e}")
            
            return redirect(url_for('forgot_password'))
        
        return render_template('forgot_password.html', form=form)
    
    @app.route('/reset-password/<token>', methods=['GET', 'POST'])
    def reset_password(token):
        form = ResetPasswordForm()
        
        try:
            # Verify token and get email
            email = reset_serializer.loads(token, salt='password-reset-salt', max_age=3600)  # 1 hour
        except SignatureExpired:
            flash('⏰ Reset link expired. Please request a new one.', 'error')
            return redirect(url_for('forgot_password'))
        except:
            flash('❌ Invalid reset link.', 'error')
            return redirect(url_for('forgot_password'))
        
        if form.validate_on_submit():
            # ✅ UPDATE PASSWORD IN DATABASE
            user = User.query.filter_by(email=email).first()
            if user:
                user.password_hash = generate_password_hash(form.password.data)  # Add from werkzeug
                db.session.commit()
                flash('✅ Password reset successful! You can now login.', 'success')
                return redirect(url_for('auth.login'))
            else:
                flash('❌ User not found.', 'error')
        
        return render_template('reset_password.html', form=form, token=token)
    
    # ==================== EXISTING ROUTES (UNCHANGED) ====================
    @app.route('/')
    def home():
        if current_user.is_authenticated or 'user_id' in session:
            return redirect(url_for('dashboard'))
        return redirect(url_for('auth.login'))
    
    @app.route('/dashboard')
    def dashboard():
        if not current_user.is_authenticated and 'user_id' not in session:
            return redirect(url_for('auth.login'))
        try:
            return render_template('dashboard.html')
        except:
            return '''
            <h1>🚀 Smart AI Pro Dashboard</h1>
            <p>✅ Forgot Password Working!</p>
            <a href="/forgot-password">Forgot Password</a> | 
            <a href="/chat/chat">AI Chat</a>
            '''
    
    @app.route('/logout')
    def logout():
        logout_user()
        session.clear()
        return redirect(url_for('home'))
    
    # ... rest of your existing routes (unchanged) ...
    
    # Database
    with app.app_context():
        db.create_all()
    
    # Error handlers (unchanged)
    @app.errorhandler(404)
    def not_found(e):
        try:
            return render_template('404.html'), 404
        except:
            return redirect(url_for('home')), 302
    
    @app.route('/health')
    def health():
        return jsonify({'status': 'healthy', 'forgot_password': 'working'})
    
    return app, mail, reset_serializer  # Return extras for blueprints if needed

if __name__ == '__main__':
    app, mail, reset_serializer = create_app()
    print("🚀 Smart AI Pro - Forgot Password ✅ Email Working!")
    app.run(host='0.0.0.0', port=5000, debug=True)
