from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal
from .models import User, ContributionSettings
from .serializers import UserSerializer, ContributionSettingsSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    @action(detail=False, methods=['post'])
    def check_user(self, request):
        """Check if user exists by email"""
        email = request.data.get('email')
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            serializer = self.get_serializer(user)
            return Response({
                'exists': True,
                'user': serializer.data
            })
        except User.DoesNotExist:
            return Response({
                'exists': False
            })
    
    @action(detail=False, methods=['post'])
    def create_user(self, request):
        """Create a new user with full details"""
        email = request.data.get('email')
        name = request.data.get('name', 'User')
        age = request.data.get('age', 30)
        annual_salary = request.data.get('annual_salary', 75000)
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({'error': 'User with this email already exists'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Create new user
        user = User.objects.create(
            email=email,
            name=name,
            age=age,
            annual_salary=annual_salary
        )
        
        # Create default contribution settings
        ContributionSettings.objects.create(
            user=user,
            contribution_type='PERCENTAGE',
            contribution_value=Decimal('6.00')
        )
        
        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """Legacy login endpoint - kept for backward compatibility"""
        email = request.data.get('email')
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            # For backward compatibility, create user if doesn't exist
            name = request.data.get('name', 'User')
            age = request.data.get('age', 30)
            annual_salary = request.data.get('annual_salary', 75000)
            
            user = User.objects.create(
                email=email,
                name=name,
                age=age,
                annual_salary=annual_salary
            )
            
            ContributionSettings.objects.create(
                user=user,
                contribution_type='PERCENTAGE',
                contribution_value=Decimal('6.00')
            )
            
            serializer = self.get_serializer(user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def update_contribution(self, request, pk=None):
        """Update contribution settings for a specific user"""
        user = self.get_object()
        settings, created = ContributionSettings.objects.get_or_create(
            user=user
        )
        
        serializer = ContributionSettingsSerializer(settings, data=request.data)
        if serializer.is_valid():
            serializer.save()
            user_serializer = UserSerializer(user)
            return Response(user_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def calculate_projection(self, request, pk=None):
        """Calculate retirement projection for different contribution rates"""
        user = self.get_object()
        contribution_type = request.data.get('contribution_type', 'PERCENTAGE')
        contribution_value = float(request.data.get('contribution_value', 0))
        
        retirement_age = 65
        years_to_retirement = retirement_age - user.age
        
        if contribution_type == 'PERCENTAGE':
            annual_contribution = (contribution_value / 100) * float(user.annual_salary)
        else:
            annual_contribution = contribution_value * 26
        
        projections = []
        for year in range(1, years_to_retirement + 1, 5):
            rate = 0.07
            future_value = annual_contribution * (((1 + rate) ** year - 1) / rate)
            future_value *= 1.5  # Include employer match
            projections.append({
                'year': year,
                'age': user.age + year,
                'balance': round(future_value, 2)
            })
        
        # Add final year if not included
        if years_to_retirement > 0 and (years_to_retirement % 5 != 0):
            rate = 0.07
            future_value = annual_contribution * (((1 + rate) ** years_to_retirement - 1) / rate)
            future_value *= 1.5
            projections.append({
                'year': years_to_retirement,
                'age': retirement_age,
                'balance': round(future_value, 2)
            })
        
        return Response({
            'current_age': user.age,
            'retirement_age': retirement_age,
            'annual_contribution': annual_contribution,
            'projections': projections
        })