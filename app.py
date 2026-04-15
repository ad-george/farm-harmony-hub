from flask import Flask, render_template, redirect, url_for, flash, request
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os



# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///farm.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# ==================== MODELS ====================
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    role_name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    role = db.relationship('Role', backref='users')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def is_admin(self):
        return self.role_id == 1
    
    def is_manager(self):
        return self.role_id == 2
    
    def is_staff(self):
        return self.role_id == 3

class Farm(db.Model):
    __tablename__ = 'farms'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(500), nullable=False)
    size = db.Column(db.Numeric(10, 2))
    manager_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ==================== INITIALIZE DATABASE ====================
with app.app_context():
    db.create_all()
    
    if not Role.query.first():
        roles = [
            Role(role_name='Admin', description='Full system access'),
            Role(role_name='Manager', description='Farm management access'),
            Role(role_name='Staff', description='Limited access')
        ]
        db.session.add_all(roles)
        db.session.commit()
        print("✓ Created default roles")
    
    if not User.query.filter_by(username='admin').first():
        admin = User(
            username='admin',
            email='admin@farm.com',
            full_name='System Administrator',
            role_id=1,
            is_active=True
        )
        admin.set_password('Admin123!')
        db.session.add(admin)
        db.session.commit()
        print("✓ Created admin user")

# ==================== ROUTES ====================
@app.route('/')
def index():
    """Home page - FIXED: Uses direct login/register routes"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page - FIXED: endpoint is 'login' not 'auth.login'"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = 'remember' in request.form
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            if user.is_active:
                login_user(user, remember=remember)
                user.last_login = datetime.utcnow()
                db.session.commit()
                flash(f'Welcome back, {user.full_name}!', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Your account is deactivated.', 'error')
        else:
            flash('Invalid username or password.', 'error')
    
    return render_template('auth/login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """Registration page - FIXED: endpoint is 'register'"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        full_name = request.form.get('full_name')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        errors = []
        if User.query.filter_by(username=username).first():
            errors.append('Username already exists.')
        if User.query.filter_by(email=email).first():
            errors.append('Email already registered.')
        if password != confirm_password:
            errors.append('Passwords do not match.')
        if len(password) < 8:
            errors.append('Password must be at least 8 characters.')
        
        if errors:
            for error in errors:
                flash(error, 'error')
        else:
            user = User(
                username=username,
                email=email,
                full_name=full_name,
                role_id=3,
                is_active=True
            )
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
    
    return render_template('auth/register.html')

@app.route('/logout')
@login_required
def logout():
    """Logout page - FIXED: endpoint is 'logout'"""
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    """Dashboard page"""
    total_farms = Farm.query.count()
    total_users = User.query.count()
    
    if current_user.is_admin():
        farms = Farm.query.all()
    elif current_user.is_manager():
        farms = Farm.query.filter_by(manager_id=current_user.id).all()
    else:
        farms = []
    
    return render_template('dashboard/index.html',
                         total_farms=total_farms,
                         total_users=total_users,
                         farms=farms)

@app.route('/farms')
@login_required
def farms():
    """Farms listing"""
    if current_user.is_admin():
        farms_list = Farm.query.all()
    elif current_user.is_manager():
        farms_list = Farm.query.filter_by(manager_id=current_user.id).all()
    else:
        farms_list = []
        flash('No permission to view farms.', 'error')
    
    return render_template('farms/index.html', farms=farms_list)

@app.route('/profile')
@login_required
def profile():
    """User profile"""
    return render_template('auth/profile.html')

# ==================== ERROR HANDLERS ====================
@app.errorhandler(404)
def page_not_found(error):
    return render_template('errors/404.html'), 404

@app.errorhandler(500)
def internal_server_error(error):
    return render_template('errors/500.html'), 500

# ==================== RUN APPLICATION ====================
if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚜 FARM MANAGEMENT SYSTEM")
    print("="*50)
    print("🌐 Access: http://localhost:5000")
    print("🔑 Admin login: admin / Admin123!")
    print("📁 Database: farm.db (SQLite)")
    print("="*50 + "\n")
    
    # Create directories
    os.makedirs('templates/auth', exist_ok=True)
    os.makedirs('templates/dashboard', exist_ok=True)
    os.makedirs('templates/farms', exist_ok=True)
    os.makedirs('templates/errors', exist_ok=True)
    
    app.run(host='0.0.0.0', port=5000, debug=True)