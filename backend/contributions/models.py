from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

class User(models.Model):
    """Simple user model for the demo"""
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100)
    age = models.IntegerField(default=30)
    annual_salary = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=75000.00
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.email

class ContributionSettings(models.Model):
    CONTRIBUTION_TYPE_CHOICES = [
        ('PERCENTAGE', 'Percentage'),
        ('FIXED', 'Fixed Amount'),
    ]
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='contribution_settings'
    )
    contribution_type = models.CharField(
        max_length=10, 
        choices=CONTRIBUTION_TYPE_CHOICES,
        default='PERCENTAGE'
    )
    contribution_value = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('6.00')
    )
    is_roth = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)
    
    def get_annual_contribution(self):
        if self.contribution_type == 'PERCENTAGE':
            return (self.contribution_value / 100) * self.user.annual_salary
        else:
            # Fixed amount per paycheck, assuming 26 pay periods
            return self.contribution_value * 26

class ContributionHistory(models.Model):
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='contribution_history'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    contribution_date = models.DateField()
    is_employer_match = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-contribution_date']