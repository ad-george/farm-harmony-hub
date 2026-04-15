from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, DateField, DecimalField, TextAreaField, SubmitField
from wtforms.validators import DataRequired, Optional
from database import Farm, CropType

class CropForm(FlaskForm):
    farm_id = SelectField('Farm', coerce=int, validators=[DataRequired()])
    crop_type_id = SelectField('Crop Type', coerce=int, validators=[DataRequired()])
    variety = StringField('Variety', validators=[Optional()])
    planting_date = DateField('Planting Date', validators=[DataRequired()])
    area = DecimalField('Area (acres)', validators=[Optional()])
    expected_yield = DecimalField('Expected Yield', validators=[Optional()])
    notes = TextAreaField('Notes')
    submit = SubmitField('Save')
    
    def __init__(self, *args, **kwargs):
        super(CropForm, self).__init__(*args, **kwargs)
        self.farm_id.choices = [(f.id, f.name) for f in Farm.query.all()]
        self.crop_type_id.choices = [(ct.id, ct.name) for ct in CropType.query.all()]