from functools import wraps
from flask import abort, current_app
from flask_login import current_user

def role_required(role_name):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return current_app.login_manager.unauthorized()
            
            if role_name == 'admin' and not current_user.is_admin():
                abort(403)
            elif role_name == 'manager' and not (current_user.is_admin() or current_user.is_manager()):
                abort(403)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def farm_access_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from database import Farm
        farm_id = kwargs.get('farm_id')
        
        if farm_id:
            farm = Farm.query.get_or_404(farm_id)
            if current_user.is_admin():
                return f(*args, **kwargs)
            
            # Check if user has access to this farm
            accessible = False
            if farm.manager_id == current_user.id:
                accessible = True
            
            if not accessible:
                abort(403)
        
        return f(*args, **kwargs)
    return decorated_function