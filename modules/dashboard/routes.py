from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required
from datetime import datetime, timedelta
from sqlalchemy import func, extract
import calendar

from database import db, User, Farm, Crop, Livestock, FinancialRecord, Task, Equipment
from utils.helpers import role_required, farm_access_required, get_current_financial_year

# Create blueprint
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
@login_required
def index():
    """Main dashboard page"""
    user = User.query.get(current_user.id)
    
    # Get accessible farms
    accessible_farms = user.get_accessible_farms()
    
    # Calculate totals
    total_farms = len(accessible_farms)
    total_crops = sum(len(farm.crops) for farm in accessible_farms)
    total_livestock = sum(sum(l.quantity for l in farm.livestock) for farm in accessible_farms)
    
    # Get recent activities
    from database import Activity
    recent_activities = Activity.query.filter(
        Activity.farm_id.in_([f.id for f in accessible_farms])
    ).order_by(Activity.created_at.desc()).limit(10).all()
    
    # Get pending tasks
    pending_tasks = Task.query.filter(
        Task.farm_id.in_([f.id for f in accessible_farms]),
        Task.status.in_(['pending', 'in_progress'])
    ).order_by(Task.due_date).limit(5).all()
    
    # Get equipment needing maintenance
    maintenance_needed = Equipment.query.filter(
        Equipment.farm_id.in_([f.id for f in accessible_farms]),
        Equipment.status == 'maintenance'
    ).limit(5).all()
    
    # Get financial summary for current month
    current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    next_month_start = (current_month_start + timedelta(days=32)).replace(day=1)
    
    income_records = FinancialRecord.query.filter(
        FinancialRecord.farm_id.in_([f.id for f in accessible_farms]),
        FinancialRecord.transaction_date >= current_month_start,
        FinancialRecord.transaction_date < next_month_start,
        FinancialRecord.category.has(type='income')
    ).all()
    
    expense_records = FinancialRecord.query.filter(
        FinancialRecord.farm_id.in_([f.id for f in accessible_farms]),
        FinancialRecord.transaction_date >= current_month_start,
        FinancialRecord.transaction_date < next_month_start,
        FinancialRecord.category.has(type='expense')
    ).all()
    
    monthly_income = sum(float(r.amount) for r in income_records)
    monthly_expenses = sum(float(r.amount) for r in expense_records)
    
    return render_template('dashboard/index.html',
                         total_farms=total_farms,
                         total_crops=total_crops,
                         total_livestock=total_livestock,
                         monthly_income=monthly_income,
                         monthly_expenses=monthly_expenses,
                         recent_activities=recent_activities,
                         pending_tasks=pending_tasks,
                         maintenance_needed=maintenance_needed,
                         accessible_farms=accessible_farms)

@dashboard_bp.route('/farm/<int:farm_id>')
@login_required
@farm_access_required
def farm_dashboard(farm_id):
    """Dashboard for a specific farm"""
    farm = Farm.query.get_or_404(farm_id)
    
    # Get farm statistics
    crops = Crop.query.filter_by(farm_id=farm_id).all()
    livestock = Livestock.query.filter_by(farm_id=farm_id).all()
    equipment = Equipment.query.filter_by(farm_id=farm_id).all()
    
    # Financial data for last 6 months
    six_months_ago = datetime.now() - timedelta(days=180)
    financial_data = FinancialRecord.query.filter(
        FinancialRecord.farm_id == farm_id,
        FinancialRecord.transaction_date >= six_months_ago
    ).order_by(FinancialRecord.transaction_date).all()
    
    # Group by month
    monthly_data = {}
    for record in financial_data:
        month_key = record.transaction_date.strftime('%Y-%m')
        if month_key not in monthly_data:
            monthly_data[month_key] = {'income': 0, 'expenses': 0}
        
        if record.category.type == 'income':
            monthly_data[month_key]['income'] += float(record.amount)
        else:
            monthly_data[month_key]['expenses'] += float(record.amount)
    
    # Crop status distribution
    crop_status = {}
    for crop in crops:
        crop_status[crop.status] = crop_status.get(crop.status, 0) + 1
    
    # Livestock health distribution
    livestock_health = {}
    for animal in livestock:
        livestock_health[animal.health_status] = livestock_health.get(animal.health_status, 0) + animal.quantity
    
    # Tasks summary
    tasks = Task.query.filter_by(farm_id=farm_id).all()
    task_status = {}
    for task in tasks:
        task_status[task.status] = task_status.get(task.status, 0) + 1
    
    # Equipment status
    equipment_status = {}
    for equip in equipment:
        equipment_status[equip.status] = equipment_status.get(equip.status, 0) + 1
    
    return render_template('dashboard/farm_dashboard.html',
                         farm=farm,
                         crops=crops,
                         livestock=livestock,
                         equipment=equipment,
                         monthly_data=monthly_data,
                         crop_status=crop_status,
                         livestock_health=livestock_health,
                         task_status=task_status,
                         equipment_status=equipment_status)

@dashboard_bp.route('/api/stats')
@login_required
def get_stats():
    """API endpoint for dashboard statistics"""
    user = User.query.get(current_user.id)
    accessible_farms = user.get_accessible_farms()
    farm_ids = [f.id for f in accessible_farms]
    
    # Year-to-date financials
    current_year = datetime.now().year
    ytd_start = datetime(current_year, 1, 1)
    
    ytd_income = db.session.query(func.sum(FinancialRecord.amount)).filter(
        FinancialRecord.farm_id.in_(farm_ids),
        FinancialRecord.transaction_date >= ytd_start,
        FinancialRecord.category.has(type='income')
    ).scalar() or 0
    
    ytd_expenses = db.session.query(func.sum(FinancialRecord.amount)).filter(
        FinancialRecord.farm_id.in_(farm_ids),
        FinancialRecord.transaction_date >= ytd_start,
        FinancialRecord.category.has(type='expense')
    ).scalar() or 0
    
    # Monthly trend data for charts
    monthly_trend = []
    for i in range(6):
        month_date = datetime.now().replace(day=1) - timedelta(days=30*i)
        month_start = month_date.replace(day=1)
        if i == 0:
            month_end = datetime.now()
        else:
            next_month = month_date.replace(day=28) + timedelta(days=4)
            month_end = next_month - timedelta(days=next_month.day)
        
        month_income = db.session.query(func.sum(FinancialRecord.amount)).filter(
            FinancialRecord.farm_id.in_(farm_ids),
            FinancialRecord.transaction_date >= month_start,
            FinancialRecord.transaction_date <= month_end,
            FinancialRecord.category.has(type='income')
        ).scalar() or 0
        
        month_expenses = db.session.query(func.sum(FinancialRecord.amount)).filter(
            FinancialRecord.farm_id.in_(farm_ids),
            FinancialRecord.transaction_date >= month_start,
            FinancialRecord.transaction_date <= month_end,
            FinancialRecord.category.has(type='expense')
        ).scalar() or 0
        
        monthly_trend.append({
            'month': month_date.strftime('%b %Y'),
            'income': float(month_income),
            'expenses': float(month_expenses)
        })
    
    monthly_trend.reverse()
    
    # Crop distribution
    crops = Crop.query.filter(Crop.farm_id.in_(farm_ids)).all()
    crop_distribution = {}
    for crop in crops:
        crop_name = crop.crop_type.name if crop.crop_type else 'Unknown'
        crop_distribution[crop_name] = crop_distribution.get(crop_name, 0) + 1
    
    # Livestock distribution
    livestock = Livestock.query.filter(Livestock.farm_id.in_(farm_ids)).all()
    livestock_distribution = {}
    for animal in livestock:
        animal_type = animal.livestock_type.name if animal.livestock_type else 'Unknown'
        livestock_distribution[animal_type] = livestock_distribution.get(animal_type, 0) + animal.quantity
    
    return jsonify({
        'success': True,
        'stats': {
            'total_farms': len(accessible_farms),
            'ytd_income': float(ytd_income),
            'ytd_expenses': float(ytd_expenses),
            'ytd_profit': float(ytd_income - ytd_expenses),
            'monthly_trend': monthly_trend,
            'crop_distribution': crop_distribution,
            'livestock_distribution': livestock_distribution
        }
    })

@dashboard_bp.route('/api/activities')
@login_required
def get_recent_activities():
    """API endpoint for recent activities"""
    user = User.query.get(current_user.id)
    accessible_farms = user.get_accessible_farms()
    farm_ids = [f.id for f in accessible_farms]
    
    activities = Activity.query.filter(
        Activity.farm_id.in_(farm_ids)
    ).order_by(Activity.created_at.desc()).limit(20).all()
    
    activity_list = []
    for activity in activities:
        activity_list.append({
            'id': activity.id,
            'farm_name': activity.farm.name if activity.farm else 'System',
            'user_name': activity.user.full_name,
            'activity_type': activity.activity_type,
            'description': activity.description,
            'time_ago': get_time_ago(activity.created_at),
            'created_at': activity.created_at.isoformat()
        })
    
    return jsonify({'success': True, 'activities': activity_list})

@dashboard_bp.route('/api/tasks/overdue')
@login_required
def get_overdue_tasks():
    """API endpoint for overdue tasks"""
    user = User.query.get(current_user.id)
    accessible_farms = user.get_accessible_farms()
    farm_ids = [f.id for f in accessible_farms]
    
    overdue_tasks = Task.query.filter(
        Task.farm_id.in_(farm_ids),
        Task.due_date < datetime.now().date(),
        Task.status.in_(['pending', 'in_progress'])
    ).order_by(Task.due_date).limit(10).all()
    
    task_list = []
    for task in overdue_tasks:
        task_list.append({
            'id': task.id,
            'title': task.title,
            'farm_name': task.farm.name,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'days_overdue': (datetime.now().date() - task.due_date).days if task.due_date else 0,
            'priority': task.priority
        })
    
    return jsonify({'success': True, 'tasks': task_list})

def get_time_ago(dt):
    """Calculate human-readable time ago"""
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days > 365:
        years = diff.days // 365
        return f'{years} year{"s" if years > 1 else ""} ago'
    elif diff.days > 30:
        months = diff.days // 30
        return f'{months} month{"s" if months > 1 else ""} ago'
    elif diff.days > 0:
        return f'{diff.days} day{"s" if diff.days > 1 else ""} ago'
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f'{hours} hour{"s" if hours > 1 else ""} ago'
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f'{minutes} minute{"s" if minutes > 1 else ""} ago'
    else:
        return 'Just now'