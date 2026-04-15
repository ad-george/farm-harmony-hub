from datetime import datetime, timedelta
from database import db, FinancialRecord, Crop, Livestock

def get_financial_chart_data(farm_id=None, days=30):
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)
    
    query = FinancialRecord.query.filter(
        FinancialRecord.transaction_date.between(start_date, end_date)
    )
    
    if farm_id:
        query = query.filter_by(farm_id=farm_id)
    
    records = query.order_by(FinancialRecord.transaction_date).all()
    
    data = {
        'labels': [],
        'income': [],
        'expenses': []
    }
    
    current_date = start_date
    while current_date <= end_date:
        data['labels'].append(current_date.strftime('%Y-%m-%d'))
        daily_income = sum(r.amount for r in records 
                          if r.transaction_date == current_date and r.category.type == 'income')
        daily_expenses = sum(r.amount for r in records 
                            if r.transaction_date == current_date and r.category.type == 'expense')
        
        data['income'].append(float(daily_income))
        data['expenses'].append(float(daily_expenses))
        
        current_date += timedelta(days=1)
    
    return data

def get_crop_status_data(farm_id=None):
    query = Crop.query
    if farm_id:
        query = query.filter_by(farm_id=farm_id)
    
    crops = query.all()
    
    status_counts = {}
    for crop in crops:
        status_counts[crop.status] = status_counts.get(crop.status, 0) + 1
    
    return {
        'labels': list(status_counts.keys()),
        'data': list(status_counts.values())
    }