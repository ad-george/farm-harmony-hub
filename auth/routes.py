from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.urls import url_parse
from datetime import datetime
import logging

from database import db, User
from extensions import bcrypt
from utils.helpers import role_required

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
logger = logging.getLogger(__name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = request.form.get('remember', False)
        
        # Validate input
        if not username or not password:
            flash('Please provide both username and password.', 'error')
            return render_template('auth/login.html')
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if user and user.check_password(password):
            if not user.is_active:
                flash('Your account is deactivated. Please contact administrator.', 'error')
                return render_template('auth/login.html')
            
            # Update last login
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Log the activity
            from utils.helpers import log_activity
            log_activity(user.id, None, 'login', f'User {user.username} logged in')
            
            login_user(user, remember=remember)
            flash(f'Welcome back, {user.full_name}!', 'success')
            
            # Redirect to next page if specified
            next_page = request.args.get('next')
            if not next_page or url_parse(next_page).netloc != '':
                next_page = url_for('dashboard.index')
            return redirect(next_page)
        else:
            flash('Invalid username or password.', 'error')
    
    return render_template('auth/login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    # Log the activity
    from utils.helpers import log_activity
    log_activity(current_user.id, None, 'logout', f'User {current_user.username} logged out')
    
    logout_user()
    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('auth.login'))

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        full_name = request.form.get('full_name')
        phone = request.form.get('phone')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Validate input
        errors = []
        
        if not all([username, email, full_name, password, confirm_password]):
            errors.append('All fields are required.')
        
        if password != confirm_password:
            errors.append('Passwords do not match.')
        
        if len(password) < 8:
            errors.append('Password must be at least 8 characters long.')
        
        # Check if username or email already exists
        if User.query.filter_by(username=username).first():
            errors.append('Username already taken.')
        
        if User.query.filter_by(email=email).first():
            errors.append('Email already registered.')
        
        if errors:
            for error in errors:
                flash(error, 'error')
            return render_template('auth/register.html')
        
        # Create new user (default role: Staff)
        try:
            new_user = User(
                username=username,
                email=email,
                full_name=full_name,
                phone=phone,
                role_id=3  # Default: Staff
            )
            new_user.set_password(password)
            
            db.session.add(new_user)
            db.session.commit()
            
            # Log the activity
            from utils.helpers import log_activity
            log_activity(new_user.id, None, 'registration', f'New user registered: {username}')
            
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('auth.login'))
        
        except Exception as e:
            db.session.rollback()
            logger.error(f"Registration error: {str(e)}")
            flash('An error occurred during registration. Please try again.', 'error')
    
    return render_template('auth/register.html')

@auth_bp.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'update_profile':
            full_name = request.form.get('full_name')
            phone = request.form.get('phone')
            email = request.form.get('email')
            
            # Validate email uniqueness
            if email != current_user.email:
                existing_user = User.query.filter_by(email=email).first()
                if existing_user:
                    flash('Email already in use by another account.', 'error')
                    return redirect(url_for('auth.profile'))
            
            current_user.full_name = full_name
            current_user.phone = phone
            current_user.email = email
            
            # Handle profile picture upload
            if 'profile_image' in request.files:
                file = request.files['profile_image']
                if file and file.filename:
                    from utils.helpers import save_uploaded_file
                    filepath = save_uploaded_file(file, 'profile_images')
                    if filepath:
                        current_user.profile_image = filepath
            
            db.session.commit()
            
            # Log the activity
            from utils.helpers import log_activity
            log_activity(current_user.id, None, 'profile_update', 'Updated profile information')
            
            flash('Profile updated successfully!', 'success')
            return redirect(url_for('auth.profile'))
        
        elif action == 'change_password':
            current_password = request.form.get('current_password')
            new_password = request.form.get('new_password')
            confirm_password = request.form.get('confirm_password')
            
            if not current_user.check_password(current_password):
                flash('Current password is incorrect.', 'error')
                return redirect(url_for('auth.profile'))
            
            if new_password != confirm_password:
                flash('New passwords do not match.', 'error')
                return redirect(url_for('auth.profile'))
            
            if len(new_password) < 8:
                flash('Password must be at least 8 characters long.', 'error')
                return redirect(url_for('auth.profile'))
            
            current_user.set_password(new_password)
            db.session.commit()
            
            # Log the activity
            from utils.helpers import log_activity
            log_activity(current_user.id, None, 'password_change', 'Changed password')
            
            flash('Password changed successfully!', 'success')
            return redirect(url_for('auth.profile'))
    
    return render_template('auth/profile.html')

@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        
        if not email:
            flash('Please enter your email address.', 'error')
            return render_template('auth/forgot_password.html')
        
        user = User.query.filter_by(email=email).first()
        
        if user:
            # Generate password reset token (simplified version)
            # In production, use proper token generation and email sending
            from itsdangerous import URLSafeTimedSerializer
            from flask import current_app
            
            serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
            token = serializer.dumps(email, salt='password-reset-salt')
            
            # Send email with reset link
            reset_link = url_for('auth.reset_password', token=token, _external=True)
            
            # Log the activity (email would be sent in production)
            from utils.helpers import log_activity
            log_activity(user.id, None, 'password_reset_request', 'Requested password reset')
            
            flash('Password reset instructions have been sent to your email.', 'info')
        else:
            flash('If an account exists with that email, reset instructions will be sent.', 'info')
        
        return redirect(url_for('auth.login'))
    
    return render_template('auth/forgot_password.html')

@auth_bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))
    
    try:
        from itsdangerous import URLSafeTimedSerializer
        from flask import current_app
        
        serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
        email = serializer.loads(token, salt='password-reset-salt', max_age=3600)  # 1 hour expiration
    except:
        flash('The password reset link is invalid or has expired.', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    user = User.query.filter_by(email=email).first()
    
    if not user:
        flash('Invalid reset request.', 'error')
        return redirect(url_for('auth.forgot_password'))
    
    if request.method == 'POST':
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('auth/reset_password.html', token=token)
        
        if len(password) < 8:
            flash('Password must be at least 8 characters long.', 'error')
            return render_template('auth/reset_password.html', token=token)
        
        user.set_password(password)
        db.session.commit()
        
        # Log the activity
        from utils.helpers import log_activity
        log_activity(user.id, None, 'password_reset', 'Reset password via email')
        
        flash('Your password has been reset successfully! Please log in.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('auth/reset_password.html', token=token)

@auth_bp.route('/api/check-username/<username>')
def check_username(username):
    """API endpoint to check if username is available"""
    user = User.query.filter_by(username=username).first()
    return jsonify({'available': user is None})

@auth_bp.route('/api/check-email/<email>')
def check_email(email):
    """API endpoint to check if email is available"""
    user = User.query.filter_by(email=email).first()
    return jsonify({'available': user is None})