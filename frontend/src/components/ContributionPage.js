import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Slider,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

function ContributionPage({ user, onLogout }) {
  const [userData, setUserData] = useState(null);
  const [contributionType, setContributionType] = useState('PERCENTAGE');
  const [contributionValue, setContributionValue] = useState(6);
  const [projectionData, setProjectionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // IRS limits for 2024
  const IRS_LIMIT_2024 = 23000;
  const MAX_PERCENTAGE = 50;
  const MAX_FIXED = 2000;

  useEffect(() => {
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (userData) {
      calculateProjection();
    }
  }, [contributionValue, contributionType, userData]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/${user.id}/`);
      setUserData(response.data);
      if (response.data.contribution_settings) {
        setContributionType(response.data.contribution_settings.contribution_type);
        setContributionValue(parseFloat(response.data.contribution_settings.contribution_value));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const calculateProjection = async () => {
    if (!userData) return;
    
    try {
      const response = await axios.post(`${API_URL}/users/${user.id}/calculate_projection/`, {
        contribution_type: contributionType,
        contribution_value: contributionValue
      });
      
      const formattedData = response.data.projections.map(item => ({
        ...item,
        balance: item.balance / 1000 // Convert to thousands for display
      }));
      setProjectionData(formattedData);
    } catch (error) {
      console.error('Error calculating projection:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/users/${user.id}/update_contribution/`, {
        contribution_type: contributionType,
        contribution_value: contributionValue,
        is_roth: false
      });
      setMessage('Contribution settings saved successfully!');
      fetchUserData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculateAnnualContribution = () => {
    if (!userData) return 0;
    if (contributionType === 'PERCENTAGE') {
      return (contributionValue / 100) * userData.annual_salary;
    } else {
      return contributionValue * 26; // 26 pay periods
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  if (!userData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Error loading user data</Alert>
      </Container>
    );
  }

  const annualContribution = calculateAnnualContribution();
  const percentageOfLimit = (annualContribution / IRS_LIMIT_2024) * 100;

  return (
    <>
      <AppBar position="static" sx={{ mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            401(k) Manager
          </Typography>
          <Chip 
            label={userData.email} 
            color="primary" 
            variant="outlined"
            sx={{ mr: 2, color: 'white', borderColor: 'white' }}
          />
          <IconButton color="inherit" onClick={onLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          401(k) Contribution Settings
        </Typography>

        {message && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column - Settings */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Contribution Type
              </Typography>
              <ToggleButtonGroup
                value={contributionType}
                exclusive
                onChange={(e, newType) => newType && setContributionType(newType)}
                fullWidth
                sx={{ mb: 3 }}
              >
                <ToggleButton value="PERCENTAGE">
                  Percentage of Salary
                </ToggleButton>
                <ToggleButton value="FIXED">
                  Fixed Amount per Paycheck
                </ToggleButton>
              </ToggleButtonGroup>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Contribution Amount
              </Typography>
              
              {contributionType === 'PERCENTAGE' ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h3" color="primary">
                      {contributionValue}%
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      = {formatCurrency(annualContribution)}/year
                    </Typography>
                  </Box>
                  <Slider
                    value={contributionValue}
                    onChange={(e, newValue) => setContributionValue(newValue)}
                    min={0}
                    max={MAX_PERCENTAGE}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 10, label: '10%' },
                      { value: 20, label: '20%' },
                      { value: 30, label: '30%' },
                      { value: 40, label: '40%' },
                      { value: 50, label: '50%' },
                    ]}
                    valueLabelDisplay="auto"
                  />
                </>
              ) : (
                <>
                  <TextField
                    type="number"
                    value={contributionValue}
                    onChange={(e) => setContributionValue(parseFloat(e.target.value) || 0)}
                    InputProps={{
                      startAdornment: '$',
                    }}
                    inputProps={{
                      min: 0,
                      max: MAX_FIXED,
                      step: 50,
                    }}
                    fullWidth
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    Per paycheck (26 pay periods/year)
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    Annual contribution: {formatCurrency(annualContribution)}
                  </Typography>
                </>
              )}

              {/* IRS Limit Progress */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  IRS Contribution Limit Progress
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(percentageOfLimit, 100)} 
                  sx={{ height: 10, borderRadius: 5 }}
                  color={percentageOfLimit > 100 ? "error" : "primary"}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {formatCurrency(annualContribution)} / {formatCurrency(IRS_LIMIT_2024)} 
                  ({percentageOfLimit.toFixed(1)}%)
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={handleSave}
                disabled={saving}
                sx={{ mt: 3 }}
                size="large"
              >
                {saving ? 'Saving...' : 'Save Contribution Settings'}
              </Button>
            </Paper>

            {/* YTD Contributions Card */}
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Year-to-Date Contributions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Your Contributions
                    </Typography>
                    <Typography variant="h5" color="primary">
                      {formatCurrency(userData.ytd_contributions.employee)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Employer Match
                    </Typography>
                    <Typography variant="h5" color="success.main">
                      {formatCurrency(userData.ytd_contributions.employer)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="body2" color="textSecondary">
                        Total YTD
                      </Typography>
                      <Typography variant="h4">
                        {formatCurrency(userData.ytd_contributions.total)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Projections */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Retirement Projection
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Estimated balance by age (includes employer match & 7% annual return)
              </Typography>
              
              {projectionData.length > 0 && (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={projectionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="age" 
                        label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        label={{ value: 'Balance ($k)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value) => `$${(value * 1000).toLocaleString()}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#1976d2" 
                        fill="#1976d2" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.main', borderRadius: 2 }}>
                    <Typography variant="h6" color="white">
                      Retirement at 65
                    </Typography>
                    <Typography variant="h4" color="white">
                      {formatCurrency(projectionData[projectionData.length - 1]?.balance * 1000 || 0)}
                    </Typography>
                    <Typography variant="body2" color="white" sx={{ mt: 1 }}>
                      Contributing {contributionType === 'PERCENTAGE' ? `${contributionValue}%` : formatCurrency(contributionValue)} 
                      {contributionType === 'FIXED' ? ' per paycheck' : ''} over {65 - userData.age} years
                    </Typography>
                  </Box>

                  {/* Impact Analysis */}
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      💡 Increase Impact
                    </Typography>
                    <Typography variant="body2">
                      Increasing your contribution by just 1% could add approximately{' '}
                      <strong>
                        {formatCurrency(
                          (userData.annual_salary * 0.01 * 1.5 * 
                          (((1.07) ** (65 - userData.age) - 1) / 0.07))
                        )}
                      </strong>{' '}
                      to your retirement balance!
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>

            {/* User Info Card */}
            <Card elevation={3} sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Profile Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Name
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {userData.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Chip label={`Age: ${userData.age}`} sx={{ mr: 1 }} />
                    <Chip label={`Salary: ${formatCurrency(userData.annual_salary)}`} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      Years to retirement: {65 - userData.age}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default ContributionPage;