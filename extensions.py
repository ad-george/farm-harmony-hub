from flask_login import LoginManager
from flask_mail import Mail
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_wtf.csrf import CSRFProtect
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

# Initialize SQLAlchemy
class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Initialize other extensions
login_manager = LoginManager()
mail = Mail()
migrate = Migrate()
bcrypt = Bcrypt()
csrf = CSRFProtect()

@login_manager.user_loader
def load_user(user_id):
    # We'll import User inside function to avoid circular imports
    return None  # Temporary - will fix after models are loaded

@login_manager.unauthorized_handler
def unauthorized():
    from flask import redirect, url_for, flash
    flash('Please log in to access this page.', 'warning')
    return redirect(url_for('auth.login'))