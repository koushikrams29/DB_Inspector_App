import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { testConnection, createConnection, getConnectionProfiling } from '../api/dbapi'; // Import getConnectionProfiling
import {
  Container,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  InputAdornment,
  FormHelperText,
  Paper, // Use Paper for the form background
  Typography, // For the heading
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';

// Custom theme for the dark background
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9', // A light blue for primary actions
    },
    secondary: {
      main: '#f48fb1', // A pink for secondary accents
    },
    background: {
      default: '#121212', // Darker background
      paper: '#1e1e1e', // Slightly lighter paper background for contrast
    },
    text: {
      primary: '#fff', // White text
      secondary: '#e0e0e0', // Slightly grey text
    },
    success: {
      light: '#81c784',
      main: '#4caf50',
      dark: '#388e3c',
    },
    error: {
      light: '#e57373',
      main: '#f44336',
      dark: '#d32f2f',
    },
  },
  typography: {
    h2: {
      marginBottom: '1rem',
      color: '#fff', // White heading
    },
  },
});

const StyledContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.default,
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[8], // More pronounced shadow for lift
  width: '100%',
  maxWidth: 600,
}));

const StyledFormControl = styled(FormControl)({
  width: '100%',
  marginBottom: '1.5rem', // Increased margin for better spacing
});

const StyledInputLabel = styled(InputLabel)(({ theme }) => ({
  color: theme.palette.text.secondary,
  '&.Mui-focused': {
    color: theme.palette.primary.main,
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& label': {
    color: theme.palette.text.secondary,
  },
  '& label.Mui-focused': {
    color: theme.palette.primary.main,
  },
  '& .MuiInput-underline:before': {
    borderBottomColor: theme.palette.divider,
  },
  '& .MuiInput-underline:after': {
    borderBottomColor: theme.palette.primary.main,
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: theme.palette.divider,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.light,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '& input': {
      color: theme.palette.text.primary,
    },
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  '& fieldset': {
    borderColor: theme.palette.divider,
  },
  '&:hover fieldset': {
    borderColor: theme.palette.primary.light,
  },
  '&.Mui-focused fieldset': {
    borderColor: theme.palette.primary.main,
  },
  '& .MuiSelect-select': {
    color: theme.palette.text.primary,
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.text.secondary,
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(1.5, 3),
  borderRadius: theme.shape.borderRadius,
  fontWeight: 'bold',
  '&:hover': {
    opacity: 0.9,
  },
}));

const StyledMessage = styled(Box)(({ theme, type }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.9rem',
  color: theme.palette.text.primary,
  ...(type === 'success' && {
    backgroundColor: theme.palette.success.dark,
  }),
  ...(type === 'error' && {
    backgroundColor: theme.palette.error.dark,
  }),
}));

const DBConnection = ({ onConnectionSaved }) => {
  const [supportedDatabaseTypes, setSupportedDatabaseTypes] = useState([]);
  const [testStatus, setTestStatus] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [overviewData, setOverviewData] = useState(null); // State for overview data
  const [isFetchingOverview, setIsFetchingOverview] = useState(false); // Loading state for overview

  useEffect(() => {
    setSupportedDatabaseTypes(['PostgreSQL', 'MySQL', 'SQLite', 'Oracle', 'SQL Server', 'MongoDB']); // Ensure Oracle and SQL Server are included
  }, []);

  const initialValues = {
    name: '',
    description: '',
    databaseType: '',
    hostname: '',
    port: '',
    userId: '',
    password: '',
    databaseName: '', // Add databaseName to initial values
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    description: Yup.string().required('Description is required'),
    databaseType: Yup.string().required('Database Type is required'),
    hostname: Yup.string().required('Hostname is required'),
    port: Yup.string().required('Port is required'),
    userId: Yup.string().required('User ID is required'),
    password: Yup.string().required('Password is required'),
    databaseName: Yup.string().required('Database Name is required'), // Add validation for databaseName
  });

  const handleTestConnection = async (values) => {
    setTestStatus(null);
    try {
      const result = await testConnection(values);
      if (result.status) {
        setTestStatus({ type: 'success', message: result.message });
      } else {
        setTestStatus({ type: 'error', message: result.message });
      }
    } catch (error) {
      console.error('Test connection failed:', error);
      setTestStatus({ type: 'error', message: 'Failed to connect to the database.' });
    }
  };


  const handleSaveConnection = async (values, { resetForm }) => {
    setSaveStatus(null);
    try {
      const saved = await createConnection(values);
      setSaveStatus({ type: 'success', message: 'Connection saved successfully!' });

      if (onConnectionSaved) {
        onConnectionSaved(saved); // return full object
        // Optionally fetch overview immediately after saving
        // fetchOverview(saved.id);
      }

      resetForm();
    } catch (error) {
      console.error('Save connection failed:', error);
      setSaveStatus({ type: 'error', message: 'Failed to save connection.' });
    }
  };

  const fetchOverview = async (connectionId) => {
    setIsFetchingOverview(true);
    setOverviewData(null);
    try {
      const overview = await getConnectionProfiling(connectionId);
      setOverviewData(overview);
    } catch (error) {
      console.error("Error fetching database overview:", error);
      // Optionally set an error message in state
    } finally {
      setIsFetchingOverview(false);
    }
  };


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <StyledContainer>
        <StyledPaper>
          <Typography variant="h3" component="h3" align="center">
            Connect !
          </Typography>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSaveConnection}
          >
            {({ values, isSubmitting }) => (
              <Form>
                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    id="name"
                    name="name"
                    variant="outlined"
                    fullWidth
                    placeholder='Enter Name'
                  />
                  <ErrorMessage name="name" component={FormHelperText} error />
                </StyledFormControl>

                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    id="description"
                    name="description"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={2}
                    placeholder='Enter Description'
                  />
                  <ErrorMessage name="description" component={FormHelperText} error />
                </StyledFormControl>

                <StyledFormControl>
                  <Field
                    as={StyledSelect}
                    labelId="databaseType-label"
                    id="databaseType"
                    name="databaseType"
                    variant="outlined"
                    placeholder='Select Database'
                    fullWidth
                  >
                    <StyledMenuItem value="" sx={{ placeholder: 'Select Database' }}>
                      <em>Select</em>
                    </StyledMenuItem>
                    {supportedDatabaseTypes.map((type) => (
                      <StyledMenuItem key={type} value={type}>
                        {type}
                      </StyledMenuItem>
                    ))}
                  </Field>
                  <ErrorMessage name="databaseType" component={FormHelperText} error />
                </StyledFormControl>

                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    id="hostname"
                    name="hostname"
                    variant="outlined"
                    placeholder='Enter Hostname'
                    fullWidth
                  />
                  <ErrorMessage name="hostname" component={FormHelperText} error />
                </StyledFormControl>

                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    id="port"
                    name="port"
                    variant="outlined"
                    placeholder='Enter Port'
                    fullWidth
                  />
                  <ErrorMessage name="port" component={FormHelperText} error />
                </StyledFormControl>

                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    id="userId"
                    name="userId"
                    variant="outlined"
                    placeholder='Enter User ID'
                    fullWidth
                  />
                  <ErrorMessage name="userId" component={FormHelperText} error />
                </StyledFormControl>

                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    id="password"
                    name="password"
                    variant="outlined"
                    placeholder='Enter Password'
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={togglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <ErrorMessage name="password" component={FormHelperText} error />
                </StyledFormControl>

                {/* New field for Database Name */}
                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    id="databaseName"
                    name="databaseName"
                    variant="outlined"
                    placeholder='Enter Database Name (if applicable)'
                    fullWidth
                  />
                  <ErrorMessage name="databaseName" component={FormHelperText} error />
                </StyledFormControl>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <StyledButton
                    variant="contained"
                    color="primary"
                    onClick={() => handleTestConnection(values)}
                    disabled={isSubmitting}
                  >
                    Test Connection
                  </StyledButton>
                  <StyledButton
                    type="submit"
                    variant="contained"
                    color="secondary" // Using secondary color for save
                    disabled={isSubmitting}
                  >
                    Save Connection
                  </StyledButton>
                  {saveStatus && saveStatus.type === 'success' && (
                    <StyledButton
                      variant="outlined"
                      onClick={() => fetchOverview(saveStatus.savedConnectionId)} // Need to pass the ID after save
                      disabled={isFetchingOverview}
                    >
                      {isFetchingOverview ? 'Fetching Overview...' : 'Get Overview'}
                    </StyledButton>
                  )}
                </Box>

                {testStatus && (
                  <StyledMessage type={testStatus.type}>{testStatus.message}</StyledMessage>
                )}

                {saveStatus && (
                  <StyledMessage type={saveStatus.type}>{saveStatus.message}</StyledMessage>
                )}

                {overviewData && (
                  <Box mt={3} bgcolor="#1e1e1e" p={2} borderRadius={1}>
                    <Typography variant="h6" color="white" mb={1}>Database Overview:</Typography>
                    <pre style={{ color: 'white', overflowX: 'auto' }}>
                      {JSON.stringify(overviewData, null, 2)}
                    </pre>
                  </Box>
                )}
              </Form>
            )}
          </Formik>
        </StyledPaper>
      </StyledContainer>
    </ThemeProvider>
  );
};

export default DBConnection;