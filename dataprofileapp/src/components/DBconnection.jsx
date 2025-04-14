import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import {testConnection, createConnection } from '../api/dbapi';
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

  useEffect(() => {
    setSupportedDatabaseTypes(['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite']);
  }, []);

  const initialValues = {
    name: '',
    description: '',
    databaseType: '',
    hostname: '',
    port: '',
    userId: '',
    password: '',
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    description: Yup.string().required('Description is required'),
    databaseType: Yup.string().required('Database Type is required'),
    hostname: Yup.string().required('Hostname is required'),
    port: Yup.number().required('Port is required').typeError('Port must be a number'),
    userId: Yup.string().required('User ID is required'),
    password: Yup.string().required('Password is required'),
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
      }
      
  
      resetForm();
    } catch (error) {
      console.error('Save connection failed:', error);
      setSaveStatus({ type: 'error', message: 'Failed to save connection.' });
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
                  {/* <StyledInputLabel htmlFor="name">Name</StyledInputLabel> */}
                  
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
                  {/* <StyledInputLabel htmlFor="description">Description</StyledInputLabel> */}
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
                   {/* <label id="databaseType-label">Database Type</label> */}
                  <Field
                    as={StyledSelect}
                    labelId="databaseType-label"
                    id="databaseType"
                    name="databaseType"
                    variant="outlined"
                    placeholder='Select Database'
                    fullWidth
                  >
                    <StyledMenuItem value="" sx={{placeholder: 'Select Database'}}>
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
                  {/* <StyledInputLabel htmlFor="hostname">DB Hostname</StyledInputLabel> */}
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
                  {/* <StyledInputLabel htmlFor="port">Port</StyledInputLabel> */}
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
                  {/* <StyledInputLabel htmlFor="userId">User ID</StyledInputLabel> */}
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
                  {/* <StyledInputLabel htmlFor="password">Password</StyledInputLabel> */}
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
                </Box>

                {testStatus && (
                  <StyledMessage type={testStatus.type}>{testStatus.message}</StyledMessage>
                )}

                {saveStatus && (
                  <StyledMessage type={saveStatus.type}>{saveStatus.message}</StyledMessage>
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