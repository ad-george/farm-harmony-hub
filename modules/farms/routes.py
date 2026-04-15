from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user
from sqlalchemy import or_
import logging

from database import db, Farm, User, FarmStaff
from utils.helpers import role_required, farm_access_required, format_date, parse_date
from utils.helpers import log_activity

# Create blueprint
farms_bp = Blueprint('farms', __name__, url_prefix='/farms')
logger = logging.getLogger(__name__)

@farms_bp.route('/')
@login_required
def index():
    """List all accessible farms"""
    accessible_farms = current_user.get_accessible_farms()
    
    # Get filter parameters
    status_filter = request.args.get('status')
    search_query = request.args.get('search')
    
    filtered_farms = accessible_farms
    
    if status_filter:
        filtered_farms = [f for f in filtered_farms if f.status == status_filter]
    
    if search_query:
        search_lower = search_query.lower()
        filtered_farms = [
            f for f in filtered_farms 
            if search_lower in f.name.lower() or search_lower in f.location.lower()
        ]
    
    return render_template('farms/index.html', 
                         farms=filtered_farms, 
                         status_filter=status_filter,
                         search_query=search_query)

@farms_bp.route('/create', methods=['GET', 'POST'])
@login_required
@role_required('manager')
def create():
    """Create a new farm"""
    if request.method == 'POST':
        name = request.form.get('name')
        location = request.form.get('location')
        size = request.form.get('size')
        manager_id = request.form.get('manager_id')
        description = request.form.get('description')
        established_date = request.form.get('established_date')
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')
        status = request.form.get('status', 'active')
        
        # Validate required fields
        if not name or not location:
            flash('Farm name and location are required.', 'error')
            return render_template('farms/create.html')
        
        try:
            new_farm = Farm(
                name=name,
                location=location,
                size=float(size) if size else None,
                manager_id=int(manager_id) if manager_id else None,
                description=description,
                established_date=parse_date(established_date),
                latitude=float(latitude) if latitude else None,
                longitude=float(longitude) if longitude else None,
                status=status
            )
            
            db.session.add(new_farm)
            db.session.commit()
            
            # Log activity
            log_activity(current_user.id, new_farm.id, 'farm_create', 
                        f'Created new farm: {new_farm.name}')
            
            flash(f'Farm "{name}" created successfully!', 'success')
            return redirect(url_for('farms.view', farm_id=new_farm.id))
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating farm: {str(e)}")
            flash('An error occurred while creating the farm.', 'error')
    
    # Get available managers for dropdown
    managers = User.query.filter(
        or_(User.role_id == 1, User.role_id == 2)
    ).filter_by(is_active=True).all()
    
    return render_template('farms/create.html', managers=managers)

@farms_bp.route('/<int:farm_id>')
@login_required
@farm_access_required
def view(farm_id):
    """View farm details"""
    farm = Farm.query.get_or_404(farm_id)
    
    # Get farm statistics
    total_crops = len(farm.crops)
    total_livestock = sum(l.quantity for l in farm.livestock)
    total_equipment = len(farm.equipment)
    total_staff = len(farm.staff_assignments) + (1 if farm.manager else 0)
    
    # Get recent financial records
    recent_financials = farm.financial_records.order_by(
        db.desc('transaction_date')
    ).limit(10).all()
    
    # Get recent activities
    recent_activities = farm.activities.order_by(
        db.desc('created_at')
    ).limit(10).all()
    
    # Get assigned staff
    assigned_staff = farm.staff_assignments
    
    return render_template('farms/view.html',
                         farm=farm,
                         total_crops=total_crops,
                         total_livestock=total_livestock,
                         total_equipment=total_equipment,
                         total_staff=total_staff,
                         recent_financials=recent_financials,
                         recent_activities=recent_activities,
                         assigned_staff=assigned_staff)

@farms_bp.route('/<int:farm_id>/edit', methods=['GET', 'POST'])
@login_required
@farm_access_required
def edit(farm_id):
    """Edit farm details"""
    farm = Farm.query.get_or_404(farm_id)
    
    if request.method == 'POST':
        farm.name = request.form.get('name')
        farm.location = request.form.get('location')
        farm.size = float(request.form.get('size')) if request.form.get('size') else None
        farm.manager_id = int(request.form.get('manager_id')) if request.form.get('manager_id') else None
        farm.description = request.form.get('description')
        farm.established_date = parse_date(request.form.get('established_date'))
        farm.latitude = float(request.form.get('latitude')) if request.form.get('latitude') else None
        farm.longitude = float(request.form.get('longitude')) if request.form.get('longitude') else None
        farm.status = request.form.get('status', 'active')
        
        try:
            db.session.commit()
            
            # Log activity
            log_activity(current_user.id, farm_id, 'farm_update', 
                        f'Updated farm details: {farm.name}')
            
            flash('Farm updated successfully!', 'success')
            return redirect(url_for('farms.view', farm_id=farm_id))
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating farm: {str(e)}")
            flash('An error occurred while updating the farm.', 'error')
    
    # Get available managers for dropdown
    managers = User.query.filter(
        or_(User.role_id == 1, User.role_id == 2)
    ).filter_by(is_active=True).all()
    
    return render_template('farms/edit.html', farm=farm, managers=managers)

@farms_bp.route('/<int:farm_id>/delete', methods=['POST'])
@login_required
@role_required('admin')
def delete(farm_id):
    """Delete a farm (admin only)"""
    farm = Farm.query.get_or_404(farm_id)
    
    try:
        # Log activity before deletion
        log_activity(current_user.id, farm_id, 'farm_delete', 
                    f'Deleted farm: {farm.name}')
        
        db.session.delete(farm)
        db.session.commit()
        
        flash(f'Farm "{farm.name}" deleted successfully!', 'success')
        return redirect(url_for('farms.index'))
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting farm: {str(e)}")
        flash('An error occurred while deleting the farm.', 'error')
        return redirect(url_for('farms.view', farm_id=farm_id))

@farms_bp.route('/<int:farm_id>/staff', methods=['GET', 'POST'])
@login_required
@farm_access_required
def manage_staff(farm_id):
    """Manage farm staff assignments"""
    farm = Farm.query.get_or_404(farm_id)
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'assign':
            staff_id = request.form.get('staff_id')
            position = request.form.get('position')
            responsibilities = request.form.get('responsibilities')
            
            # Check if already assigned
            existing = FarmStaff.query.filter_by(
                farm_id=farm_id, staff_id=staff_id
            ).first()
            
            if existing:
                flash('This staff member is already assigned to this farm.', 'warning')
            else:
                new_assignment = FarmStaff(
                    farm_id=farm_id,
                    staff_id=staff_id,
                    assigned_date=datetime.utcnow().date(),
                    position=position,
                    responsibilities=responsibilities
                )
                
                db.session.add(new_assignment)
                db.session.commit()
                
                # Log activity
                staff = User.query.get(staff_id)
                log_activity(current_user.id, farm_id, 'staff_assign', 
                           f'Assigned staff {staff.full_name} to farm')
                
                flash('Staff assigned successfully!', 'success')
        
        elif action == 'remove':
            assignment_id = request.form.get('assignment_id')
            assignment = FarmStaff.query.get_or_404(assignment_id)
            
            # Log activity
            staff = assignment.staff
            log_activity(current_user.id, farm_id, 'staff_remove', 
                       f'Removed staff {staff.full_name} from farm')
            
            assignment.is_active = False
            db.session.commit()
            flash('Staff removed successfully!', 'success')
    
    # Get assigned staff
    assigned_staff = FarmStaff.query.filter_by(farm_id=farm_id, is_active=True).all()
    
    # Get available staff (excluding already assigned and managers/admins)
    assigned_ids = [a.staff_id for a in assigned_staff] + ([farm.manager_id] if farm.manager_id else [])
    available_staff = User.query.filter(
        User.role_id == 3,  # Only staff role
        User.is_active == True,
        ~User.id.in_(assigned_ids)
    ).all()
    
    return render_template('farms/manage_staff.html',
                         farm=farm,
                         assigned_staff=assigned_staff,
                         available_staff=available_staff)

@farms_bp.route('/api/<int:farm_id>/stats')
@login_required
@farm_access_required
def get_farm_stats(farm_id):
    """API endpoint for farm statistics"""
    farm = Farm.query.get_or_404(farm_id)
    
    # Calculate various statistics
    stats = {
        'crops': {
            'total': len(farm.crops),
            'by_status': {},
            'total_area': sum(float(c.area) for c in farm.crops if c.area)
        },
        'livestock': {
            'total': sum(l.quantity for l in farm.livestock),
            'by_type': {},
            'health_distribution': {}
        },
        'financial': {
            'monthly_income': farm.get_total_income(
                datetime.utcnow().replace(day=1).date(),
                datetime.utcnow().date()
            ),
            'monthly_expenses': farm.get_total_expenses(
                datetime.utcnow().replace(day=1).date(),
                datetime.utcnow().date()
            ),
            'ytd_profit': farm.get_profit(
                datetime(datetime.utcnow().year, 1, 1).date(),
                datetime.utcnow().date()
            )
        },
        'equipment': {
            'total': len(farm.equipment),
            'by_status': {},
            'needs_maintenance': sum(1 for e in farm.equipment if e.needs_maintenance())
        },
        'inventory': {
            'total_items': len(farm.inventory),
            'low_stock': sum(1 for i in farm.inventory if i.is_low_stock()),
            'total_value': sum(float(i.current_quantity * (i.unit_price or 0)) for i in farm.inventory)
        }
    }
    
    # Populate breakdowns
    for crop in farm.crops:
        stats['crops']['by_status'][crop.status] = stats['crops']['by_status'].get(crop.status, 0) + 1
    
    for animal in farm.livestock:
        type_name = animal.livestock_type.name if animal.livestock_type else 'Unknown'
        stats['livestock']['by_type'][type_name] = stats['livestock']['by_type'].get(type_name, 0) + animal.quantity
        
        stats['livestock']['health_distribution'][animal.health_status] = \
            stats['livestock']['health_distribution'].get(animal.health_status, 0) + animal.quantity
    
    for equipment in farm.equipment:
        stats['equipment']['by_status'][equipment.status] = \
            stats['equipment']['by_status'].get(equipment.status, 0) + 1
    
    return jsonify({'success': True, 'stats': stats})

@farms_bp.route('/api/<int:farm_id>/financial-overview')
@login_required
@farm_access_required
def get_financial_overview(farm_id):
    """API endpoint for financial overview chart data"""
    farm = Farm.query.get_or_404(farm_id)
    
    # Get data for last 12 months
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=365)
    
    # Query monthly financial data
    monthly_data = []
    for i in range(12):
        month_start = (end_date.replace(day=1) - timedelta(days=30*i)).replace(day=1)
        if i == 0:
            month_end = end_date
        else:
            next_month = month_start.replace(day=28) + timedelta(days=4)
            month_end = next_month - timedelta(days=next_month.day)
        
        month_income = farm.get_total_income(month_start, month_end)
        month_expenses = farm.get_total_expenses(month_start, month_end)
        
        monthly_data.append({
            'month': month_start.strftime('%b %Y'),
            'income': float(month_income),
            'expenses': float(month_expenses),
            'profit': float(month_income - month_expenses)
        })
    
    monthly_data.reverse()
    
    # Get category breakdown for current month
    current_month_start = end_date.replace(day=1)
    income_by_category = {}
    expenses_by_category = {}
    
    records = FinancialRecord.query.filter(
        FinancialRecord.farm_id == farm_id,
        FinancialRecord.transaction_date >= current_month_start,
        FinancialRecord.transaction_date <= end_date
    ).all()
    
    for record in records:
        cat_name = record.category.name
        amount = float(record.amount)
        
        if record.category.type == 'income':
            income_by_category[cat_name] = income_by_category.get(cat_name, 0) + amount
        else:
            expenses_by_category[cat_name] = expenses_by_category.get(cat_name, 0) + amount
    
    return jsonify({
        'success': True,
        'monthly_data': monthly_data,
        'income_by_category': income_by_category,
        'expenses_by_category': expenses_by_category
    })