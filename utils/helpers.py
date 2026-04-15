import os
from datetime import datetime
from flask import current_app

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def format_currency(value):
    if value is None:
        return "$0.00"
    return f"${float(value):,.2f}"

def format_date(value, format='%Y-%m-%d'):
    if isinstance(value, str):
        try:
            value = datetime.strptime(value, '%Y-%m-%d')
        except:
            return value
    if isinstance(value, datetime):
        return value.strftime(format)
    return value

def log_activity(user_id, farm_id, activity_type, description):
    from database import db, Activity
    activity = Activity(
        user_id=user_id,
        farm_id=farm_id,
        activity_type=activity_type,
        description=description
    )
    db.session.add(activity)
    db.session.commit()