import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Container,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Divider
} from '@mui/material';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState(30);
  const [salary, setSalary] = useState(75000);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // First, try to login with just email
      const response = await fetch('http://localhost:8000/api/users/check_user/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.exists) {
          // Existing user - log them in
          localStorage.setItem('userId', data.user.id);
          localStorage.setItem('userEmail', data.user.email);
          onLogin(data.user);
        } else {
          // New user - show signup form
          setIsNewUser(true);
        }
      } else {
        setError(data.error || 'An error occurred');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/users/create_user/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name || 'User',
          age,
          annual_salary: salary
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('userId', data.id);
        localStorage.setItem('userEmail', data.email);
        onLogin(data);
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo users for quick access
  const handleDemoUser = (demoEmail) => {
    setEmail(demoEmail);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom align="center">
            401(k) Manager
          </Typography>
          
          {!isNewUser ? (
            <>
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
                Enter your email to access your 401(k) settings
              </Typography>
              
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              
              <form onSubmit={handleEmailSubmit}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  required
                  autoFocus
                  autoComplete="email"
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  size="large"
                  disabled={loading}
                >
                  {loading ? 'Checking...' : 'Continue'}
                </Button>
              </form>

              <Divider sx={{ my: 3 }}>OR</Divider>
              
              <Typography variant="body2" color="textSecondary" align="center" gutterBottom>
                Try with a demo account:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button 
                  size="small" 
                  onClick={() => handleDemoUser('john.doe@example.com')}
                >
                  John Doe
                </Button>
                <Button 
                  size="small" 
                  onClick={() => handleDemoUser('jane.smith@example.com')}
                >
                  Jane Smith
                </Button>
                <Button 
                  size="small" 
                  onClick={() => handleDemoUser('new.user@example.com')}
                >
                  New User
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom align="center">
                Welcome! Let's set up your account
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
                We need a few details to personalize your retirement projections
              </Typography>
              
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              
              <form onSubmit={handleSignup}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  disabled
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  margin="normal"
                  required
                  autoFocus
                />
                <TextField
                  fullWidth
                  label="Age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 30)}
                  margin="normal"
                  required
                  inputProps={{ min: 18, max: 100 }}
                  helperText="Used to calculate years until retirement"
                />
                <TextField
                  fullWidth
                  label="Annual Salary"
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: '$',
                  }}
                  helperText="Used to calculate contribution percentages"
                />
                
                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setIsNewUser(false)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </Box>
              </form>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;