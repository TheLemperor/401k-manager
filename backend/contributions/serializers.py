from rest_framework import serializers
from .models import User, ContributionSettings
from decimal import Decimal
from datetime import datetime

class ContributionSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContributionSettings
        fields = ['contribution_type', 'contribution_value', 'is_roth']

class UserSerializer(serializers.ModelSerializer):
    contribution_settings = ContributionSettingsSerializer(read_only=True)
    ytd_contributions = serializers.SerializerMethodField()
    projected_retirement_balance = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'age', 'annual_salary', 
                 'contribution_settings', 'ytd_contributions', 
                 'projected_retirement_balance']
    
    def get_ytd_contributions(self, obj):
        current_year = datetime.now().year
        months_passed = datetime.now().month
        
        if hasattr(obj, 'contribution_settings'):
            monthly_contribution = obj.contribution_settings.get_annual_contribution() / 12
            employee_ytd = monthly_contribution * months_passed
            employer_ytd = employee_ytd * Decimal('0.5')  # 50% match
        else:
            # Default mock data if no settings exist
            employee_ytd = Decimal('3500.00')
            employer_ytd = Decimal('1750.00')
        
        return {
            'employee': float(employee_ytd),
            'employer': float(employer_ytd),
            'total': float(employee_ytd + employer_ytd)
        }
    
    def get_projected_retirement_balance(self, obj):
        retirement_age = 65
        years_to_retirement = retirement_age - obj.age
        
        if hasattr(obj, 'contribution_settings'):
            annual_contribution = obj.contribution_settings.get_annual_contribution()
        else:
            annual_contribution = Decimal('5000')
        
        # Assuming 7% annual return
        rate = 0.07
        if years_to_retirement > 0:
            future_value = float(annual_contribution) * (((1 + rate) ** years_to_retirement - 1) / rate)
            future_value *= 1.5  # Add employer match
        else:
            future_value = 0
        
        return round(future_value, 2)