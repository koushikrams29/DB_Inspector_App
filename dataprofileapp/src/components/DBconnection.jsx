import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { testConnection, createConnection, getConnectionProfiling } from '../api/dbapi'; // Import API functions
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
  Paper,
  Typography,
  CircularProgress, // Added for loading indicator
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
    h3: { // Changed from h2 to h3 as in your component
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
  // Note: The Literal in TestConnectionRequest is slightly different from the Pydantic SUPPORTED_DB_TYPES
  // Using the literal from TestConnectionRequest for the dropdown options
  const [supportedDatabaseTypes, setSupportedDatabaseTypes] = useState([
    "PostgreSQL", "MSSQL", "Oracle", "SQL Server", "Snowflake", "Redshift"
  ]);
  const [testStatus, setTestStatus] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [isFetchingOverview, setIsFetchingOverview] = useState(false);
  const [savedConnectionData, setSavedConnectionData] = useState(null); // To store the saved connection data

  // Updated initial values to match the new Pydantic model field names
  const initialValues = {
    project_code: '', // Added project_code
    connection_name: '', // Renamed from 'name'
    connection_description: '', // Renamed from 'description'
    sql_flavor: '', // Renamed from 'databaseType'
    project_host: '', // Renamed from 'hostname'
    project_port: '', // Renamed from 'port' - Note: This is string now
    project_user: '', // Renamed from 'userId'
    password: '',
    project_db: '', // Renamed from 'databaseName'
    // Add other optional fields if you want to include them in the form:
    // max_threads: 4,
    // max_query_chars: undefined,
    // url: '',
    // connect_by_url: false,
    // connect_by_key: false,
    // private_key: undefined,
    // private_key_passphrase: undefined,
    // http_path: undefined,
  };

  // Updated validation schema to match the new field names
  const validationSchema = Yup.object({
    project_code: Yup.string().required('Project Code is required'), // Added validation for project_code
    connection_name: Yup.string().required('Connection Name is required'), // Renamed
    connection_description: Yup.string(), // Description is optional in SQL schema
    sql_flavor: Yup.string().required('Database Type is required'), // Renamed
    project_host: Yup.string().required('Hostname is required'), // Renamed
    project_port: Yup.string().required('Port is required'), // Renamed - Note: Validating as string
    project_user: Yup.string().required('User ID is required'), // Renamed
    password: Yup.string().required('Password is required'),
    project_db: Yup.string(), // Database Name is optional in SQL schema
  });

  const handleTestConnection = async (values) => {
    setTestStatus(null);
    try {
      // Map form values to TestConnectionRequest Pydantic model structure
      const testPayload = {
        sql_flavor: values.sql_flavor, // Matches Pydantic
        db_hostname: values.project_host, // Maps from form to Pydantic
        db_port: parseInt(values.project_port, 10), // Maps from form (str) to Pydantic (int)
        user_id: values.project_user, // Maps from form to Pydantic
        password: values.password, // Matches Pydantic
        database: values.project_db, // Maps from form to Pydantic
      };
      const result = await testConnection(testPayload);
      if (result.status) {
        setTestStatus({ type: 'success', message: result.message });
      } else {
        setTestStatus({ type: 'error', message: result.message || 'Connection test failed.' });
      }
    } catch (error) {
      console.error('Test connection failed:', error);
      setTestStatus({ type: 'error', message: `Failed to connect to the database: ${error.message || 'Unknown error'}` });
    }
  };


  const handleSaveConnection = async (values, { resetForm }) => {
    setSaveStatus(null);
    try {
      // Map form values to DBConnectionCreate Pydantic model structure
      const savePayload = {
        project_code: values.project_code,
        connection_name: values.connection_name,
        connection_description: values.connection_description || null, // Send null if empty
        sql_flavor: values.sql_flavor,
        project_host: values.project_host,
        project_port: values.project_port, // Keep as string for Pydantic
        project_user: values.project_user,
        password: values.password, // Password input (will be encrypted by backend)
        project_db: values.project_db || null, // Send null if empty
        // Include other optional fields if added to initialValues and form
        // max_threads: values.max_threads,
        // ...
      };
      const saved = await createConnection(savePayload);
      // The 'saved' object here is the DBConnectionOut model returned by the backend.
      // It should contain 'connection_name'.
      setSaveStatus({ type: 'success', message: 'Connection saved successfully!', savedConnectionId: saved.connection_id });
      setSavedConnectionData(saved); // Store the saved connection data
      if (onConnectionSaved) {
        // Pass the full saved object (DBConnectionOut) to the parent
        onConnectionSaved(saved);
      }

      resetForm();
      setTestStatus(null); // Clear test status after saving
      setOverviewData(null); // Clear overview data
    } catch (error) {
      console.error('Save connection failed:', error);
      // Attempt to get a more specific error message from the backend response
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save connection.';
      setSaveStatus({ type: 'error', message: errorMessage });
    }
  };

  const fetchOverview = async (connectionId) => {
    if (!connectionId) {
      console.error("No connection ID provided for overview.");
      return;
    }
    setIsFetchingOverview(true);
    setOverviewData(null);
    try {
      // Re-fetch connection data by ID to build the profiling payload
      const connectionDetails = await getConnectionById(connectionId);

      const profilingPayload = {
        sql_flavor: connectionDetails.sql_flavor,
        db_hostname: connectionDetails.project_host,
        db_port: parseInt(connectionDetails.project_port, 10),
        user_id: connectionDetails.project_user,
        password: connectionDetails.password, // Ensure you have access to this.  It's a security risk to store it in frontend, but backend needs it for profiling.
        database: connectionDetails.project_db || null,
      };

      const overview = await getConnectionProfiling(connectionId, profilingPayload); // Need profilingPayload
      setOverviewData(overview);

    } catch (error) {
      console.error("Error fetching database overview:", error);
      setOverviewData({ status: "failed", message: `Failed to fetch overview: ${error.message || 'Unknown error'}` });
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
            {({ values, isSubmitting, handleSubmit }) => ( // Added handleSubmit
              <Form onSubmit={handleSubmit}>
                {/* Project Code Field */}
                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    id="project_code"
                    name="project_code"
                    variant="outlined"
                    fullWidth
                    placeholder='Enter Project Code'
                  />
                  <ErrorMessage name="project_code" component={FormHelperText} error />
                </StyledFormControl>

                {/* Connection Name Field */}
                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    id="connection_name" // Updated ID
                    name="connection_name" // Updated Name
                    variant="outlined"
                    fullWidth
                    placeholder='Enter Connection Name' // Updated placeholder
                  />
                  <ErrorMessage name="connection_name" component={FormHelperText} error /> {/* Updated ErrorMessage name */}
                </StyledFormControl>

                {/* Description Field */}
                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    id="connection_description" // Updated ID
                    name="connection_description" // Updated Name
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={2}
                    placeholder='Enter Description'
                  />
                  <ErrorMessage name="connection_description" component={FormHelperText} error /> {/* Updated ErrorMessage name */}
                </StyledFormControl>

                {/* Database Type Select */}
                <StyledFormControl>
                  {/* Removed InputLabel as placeholder is used */}
                  <Field
                    as={StyledSelect}
                    id="sql_flavor" // Updated ID
                    name="sql_flavor" // Updated Name
                    variant="outlined"
                    displayEmpty // Allows placeholder to show
                    fullWidth
                  >
                    <StyledMenuItem value="" disabled> {/* Use disabled for placeholder */}
                      Select Database Type
                    </StyledMenuItem>
                    {supportedDatabaseTypes.map((type) => (
                      <StyledMenuItem key={type} value={type}>
                        {type}
                      </StyledMenuItem>
                    ))}
                  </Field>
                  <ErrorMessage name="sql_flavor" component={FormHelperText} error /> {/* Updated ErrorMessage name */}
                </StyledFormControl>

                {/* Hostname Field */}
                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    id="project_host" // Updated ID
                    name="project_host" // Updated Name
                    variant="outlined"
                    placeholder='Enter Hostname'
                    fullWidth
                  />
                  <ErrorMessage name="project_host" component={FormHelperText} error /> {/* Updated ErrorMessage name */}
                </StyledFormControl>

                {/* Port Field */}
                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    id="project_port" // Updated ID
                    name="project_port" // Updated Name
                    variant="outlined"
                    placeholder='Enter Port'
                    fullWidth
                    // type="number" // Keep as text input because SQL column is VARCHAR(5)
                  />
                  <ErrorMessage name="project_port" component={FormHelperText} error /> {/* Updated ErrorMessage name */}
                </StyledFormControl>

                {/* User ID Field */}
                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    id="project_user" // Updated ID
                    name="project_user" // Updated Name
                    variant="outlined"
                    placeholder='Enter User ID'
                    fullWidth
                  />
                  <ErrorMessage name="project_user" component={FormHelperText} error /> {/* Updated ErrorMessage name */}
                </StyledFormControl>

                {/* Password Field */}
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

                {/* Database Name Field */}
                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    id="project_db" // Updated ID
                    name="project_db" // Updated Name
                    variant="outlined"
                    placeholder='Enter Database Name (if applicable)' // Updated placeholder
                    fullWidth
                  />
                  <ErrorMessage name="project_db" component={FormHelperText} error /> {/* Updated ErrorMessage name */}
                </StyledFormControl>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}> {/* Added flexWrap */}
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
                    color="secondary"
                    disabled={isSubmitting}
                  >
                    Save Connection
                  </StyledButton>
                  {/* {savedConnectionData && ( // Only show after a successful save
                    <StyledButton
                      variant="contained"
                      onClick={() => fetchOverview(savedConnectionData.connection_id)} // Pass connection_id
                      disabled={isSubmitting || isFetchingOverview} // disable during submit or fetch
                    >
                      {isFetchingOverview ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Fetching...
                        </>
                      ) : (
                        "Get Overview"
                      )}
                    </StyledButton>
                  )} */}
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
                    {overviewData.status === 'failed' ? (
                      <Typography color="error">{overviewData.message}</Typography>
                    ) : (
                      <pre style={{ color: 'white', overflowX: 'auto' }}>
                        {JSON.stringify(overviewData, null, 2)}
                      </pre>
                    )}
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

// Moved getConnectionById here for use in fetchOverview.
const getConnectionById = async (id) => {
  try {
    // Assuming the API endpoint for getting by ID uses the BIGINT connection_id
    // If it uses the UUID 'id', change the endpoint path accordingly.
    const response = await axios.get(`${baseURL}/connections/${id}`);
    return response.data; // This will be the DBConnectionOut object
  } catch (error) {
    console.error("Error getting connection by ID:", error);
    throw error;
  }
};

export default DBConnection;
