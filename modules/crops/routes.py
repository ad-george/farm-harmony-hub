from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import logging

from database import db, Crop, CropType, Farm
from utils.helpers import role_required, farm_access_required, format_date, parse_date
from utils.helpers import log_activity

# Create blueprint
crops_bp = Blueprint('crops', __name__, url_prefix='/crops')
logger = logging.getLogger(__name__)

@crops_bp.route('/')
@login_required
def index():
    """List all crops across accessible farms"""
    accessible_farms = current_user.get_accessible_farms()
    farm_ids = [f.id for f in accessible_farms]
    
    # Get filter parameters
    farm_id = request.args.get('farm_id')
    status = request.args.get('status')
    crop_type_id = request.args.get('crop_type_id')
    search_query = request.args.get('search')
    
    # Build query
    query = Crop.query.filter(Crop.farm_id.in_(farm_ids))
    
    if farm_id and farm_id != 'all':
        query = query.filter_by(farm_id=int(farm_id))
    
    if status and status != 'all':
        query = query.filter_by(status=status)
    
    if crop_type_id and crop_type_id != 'all':
        query = query.filter_by(crop_type_id=int(crop_type_id))
    
    if search_query:
        query = query.filter(
            db.or_(
                Crop.variety.ilike(f'%{search_query}%'),
                Crop.notes.ilike(f'%{search_query}%'),
                Crop.crop_type.has(CropType.name.ilike(f'%{search_query}%'))
            )
        )
    
    crops = query.order_by(Crop.planting_date.desc()).all()
    
    # Get filter options
    crop_types = CropType.query.all()
    
    return render_template('crops/index.html',
                         crops=crops,
                         accessible_farms=accessible_farms,
                         crop_types=crop_types,
                         selected_farm=farm_id,
                         selected_status=status,
                         selected_type=crop_type_id,
                         search_query=search_query)

@crops_bp.route('/create', methods=['GET', 'POST'])
@login_required
@role_required('manager')
def create():
    """Create a new crop record"""
    if request.method == 'POST':
        farm_id = request.form.get('farm_id')
        crop_type_id = request.form.get('crop_type_id')
        variety = request.form.get('variety')
        planting_date = request.form.get('planting_date')
        area = request.form.get('area')
        expected_yield = request.form.get('expected_yield')
        soil_type = request.form.get('soil_type')
        fertilizer_schedule = request.form.get('fertilizer_schedule')
        irrigation_schedule = request.form.get('irrigation_schedule')
        notes = request.form.get('notes')
        
        # Validate required fields
        if not all([farm_id, crop_type_id, planting_date]):
            flash('Farm, crop type, and planting date are required.', 'error')
            return redirect(url_for('crops.create'))
        
        try:
            new_crop = Crop(
                farm_id=int(farm_id),
                crop_type_id=int(crop_type_id),
                variety=variety,
                planting_date=parse_date(planting_date),
                area=float(area) if area else None,
                expected_yield=float(expected_yield) if expected_yield else None,
                soil_type=soil_type,
                fertilizer_schedule=fertilizer_schedule,
                irrigation_schedule=irrigation_schedule,
                notes=notes
            )
            
            db.session.add(new_crop)
            db.session.commit()
            
            # Log activity
            farm = Farm.query.get(farm_id)
            crop_type = CropType.query.get(crop_type_id)
            log_activity(current_user.id, farm_id, 'crop_create',
                        f'Added {crop_type.name} crop to {farm.name}')
            
            flash('Crop record created successfully!', 'success')
            return redirect(url_for('crops.view', crop_id=new_crop.id))
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating crop: {str(e)}")
            flash('An error occurred while creating the crop record.', 'error')
    
    # Get accessible farms and crop types
    accessible_farms = current_user.get_accessible_farms()
    crop_types = CropType.query.all()
    
    return render_template('crops/create.html',
                         farms=accessible_farms,
                         crop_types=crop_types)

@crops_bp.route('/<int:crop_id>')
@login_required
def view(crop_id):
    """View crop details"""
    crop = Crop.query.get_or_404(crop_id)
    
    # Check if user has access to this crop's farm
    accessible_farms = current_user.get_accessible_farms()
    if crop.farm not in accessible_farms and not current_user.is_admin():
        flash('You do not have permission to view this crop.', 'error')
        return redirect(url_for('crops.index'))
    
    # Calculate growth information
    days_since_planting = (datetime.now().date() - crop.planting_date).days
    days_to_harvest = crop.days_to_harvest()
    
    # Get related activities
    from database import Activity
    activities = Activity.query.filter_by(
        farm_id=crop.farm_id,
        related_table='crops',
        related_id=crop_id
    ).order_by(db.desc('created_at')).limit(20).all()
    
    return render_template('crops/view.html',
                         crop=crop,
                         days_since_planting=days_since_planting,
                         days_to_harvest=days_to_harvest,
                         activities=activities)

@crops_bp.route('/<int:crop_id>/edit', methods=['GET', 'POST'])
@login_required
@farm_access_required
def edit(crop_id):
    """Edit crop record"""
    crop = Crop.query.get_or_404(crop_id)
    
    if request.method == 'POST':
        crop.crop_type_id = int(request.form.get('crop_type_id'))
        crop.variety = request.form.get('variety')
        crop.planting_date = parse_date(request.form.get('planting_date'))
        crop.harvest_date = parse_date(request.form.get('harvest_date'))
        crop.area = float(request.form.get('area')) if request.form.get('area') else None
        crop.expected_yield = float(request.form.get('expected_yield')) if request.form.get('expected_yield') else None
        crop.actual_yield = float(request.form.get('actual_yield')) if request.form.get('actual_yield') else None
        crop.status = request.form.get('status', 'planted')
        crop.soil_type = request.form.get('soil_type')
        crop.fertilizer_schedule = request.form.get('fertilizer_schedule')
        crop.irrigation_schedule = request.form.get('irrigation_schedule')
        crop.notes = request.form.get('notes')
        
        try:
            db.session.commit()
            
            # Log activity
            log_activity(current_user.id, crop.farm_id, 'crop_update',
                        f'Updated {crop.crop_type.name} crop record')
            
            flash('Crop record updated successfully!', 'success')
            return redirect(url_for('crops.view', crop_id=crop_id))
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating crop: {str(e)}")
            flash('An error occurred while updating the crop record.', 'error')
    
    crop_types = CropType.query.all()
    
    return render_template('crops/edit.html', crop=crop, crop_types=crop_types)

@crops_bp.route('/<int:crop_id>/delete', methods=['POST'])
@login_required
@role_required('manager')
def delete(crop_id):
    """Delete a crop record"""
    crop = Crop.query.get_or_404(crop_id)
    farm_id = crop.farm_id
    
    try:
        # Log activity before deletion
        log_activity(current_user.id, farm_id, 'crop_delete',
                    f'Deleted {crop.crop_type.name} crop record')
        
        db.session.delete(crop)
        db.session.commit()
        
        flash('Crop record deleted successfully!', 'success')
        return redirect(url_for('crops.index'))
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting crop: {str(e)}")
        flash('An error occurred while deleting the crop record.', 'error')
        return redirect(url_for('crops.view', crop_id=crop_id))

@crops_bp.route('/<int:crop_id>/update-status', methods=['POST'])
@login_required
@farm_access_required
def update_status(crop_id):
    """Update crop status via AJAX"""
    crop = Crop.query.get_or_404(crop_id)
    
    new_status = request.form.get('status')
    notes = request.form.get('notes')
    
    if new_status not in ['planted', 'growing', 'flowering', 'harvesting', 'harvested', 'failed']:
        return jsonify({'success': False, 'error': 'Invalid status'})
    
    try:
        old_status = crop.status
        crop.status = new_status
        
        if notes:
            crop.notes = (crop.notes + '\n\n' if crop.notes else '') + f'Status update: {notes}'
        
        db.session.commit()
        
        # Log activity
        log_activity(current_user.id, crop.farm_id, 'crop_status_update',
                    f'Changed crop status from {old_status} to {new_status}')
        
        return jsonify({
            'success': True,
            'status': new_status,
            'message': 'Status updated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating crop status: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@crops_bp.route('/api/calendar')
@login_required
def crop_calendar():
    """API endpoint for crop calendar data"""
    accessible_farms = current_user.get_accessible_farms()
    farm_ids = [f.id for f in accessible_farms]
    
    crops = Crop.query.filter(Crop.farm_id.in_(farm_ids)).all()
    
    events = []
    for crop in crops:
        events.append({
            'id': crop.id,
            'title': f"{crop.crop_type.name} - {crop.farm.name}",
            'start': crop.planting_date.isoformat(),
            'end': crop.harvest_date.isoformat() if crop.harvest_date else None,
            'color': get_status_color(crop.status),
            'extendedProps': {
                'farm': crop.farm.name,
                'status': crop.status,
                'area': float(crop.area) if crop.area else 0,
                'variety': crop.variety
            }
        })
    
    return jsonify(events)

@crops_bp.route('/api/yield-predictions')
@login_required
def yield_predictions():
    """API endpoint for yield prediction data"""
    accessible_farms = current_user.get_accessible_farms()
    farm_ids = [f.id for f in accessible_farms]
    
    # Get crops with expected yields
    crops = Crop.query.filter(
        Crop.farm_id.in_(farm_ids),
        Crop.expected_yield.isnot(None),
        Crop.status.in_(['growing', 'flowering', 'harvesting'])
    ).all()
    
    predictions = []
    for crop in crops:
        if crop.expected_yield and crop.area:
            yield_per_acre = float(crop.expected_yield) / float(crop.area)
            predictions.append({
                'crop_id': crop.id,
                'crop_name': crop.crop_type.name,
                'farm_name': crop.farm.name,
                'variety': crop.variety,
                'area': float(crop.area),
                'expected_yield': float(crop.expected_yield),
                'yield_per_acre': yield_per_acre,
                'status': crop.status,
                'planting_date': crop.planting_date.isoformat()
            })
    
    return jsonify({'success': True, 'predictions': predictions})

def get_status_color(status):
    """Get color for crop status"""
    colors = {
        'planted': '#3498db',      # Blue
        'growing': '#2ecc71',      # Green
        'flowering': '#9b59b6',    # Purple
        'harvesting': '#e74c3c',   # Red
        'harvested': '#f39c12',    # Orange
        'failed': '#95a5a6'        # Gray
    }
    return colors.get(status, '#95a5a6')