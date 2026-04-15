from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SelectField, DecimalField, DateField, SubmitField
from wtforms.validators import DataRequired, Optional
from database import User

class FarmForm(FlaskForm):
    name = StringField('Farm Name', validators=[DataRequired()])
    location = StringField('Location', validators=[DataRequired()])
    size = DecimalField('Size (acres)', validators=[Optional()])
    manager_id = SelectField('Manager', coerce=int, validators=[Optional()])
    description = TextAreaField('Description')
    established_date = DateField('Established Date', validators=[Optional()])
    submit = SubmitField('Save')
    
    def __init__(self, *args, **kwargs):
        super(FarmForm, self).__init__(*args, **kwargs)
        self.manager_id.choices = [(0, 'Select Manager')] + [
            (u.id, u.full_name) for u in User.query.filter(
                User.role_id.in_([1, 2])  # Admins and Managers
            ).all()
        ]