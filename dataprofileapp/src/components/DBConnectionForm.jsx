import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
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
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#fff',
      secondary: '#e0e0e0',
    },
    success: {
      main: '#4caf50',
      dark: '#388e3c',
    },
    error: {
      main: '#f44336',
      dark: '#d32f2f',
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
  boxShadow: theme.shadows[8],
  width: '100%',
  maxWidth: 600,
}));

const StyledFormControl = styled(FormControl)({
  width: '100%',
  marginBottom: '1.5rem',
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& label': {
    color: theme.palette.text.secondary,
  },
  '& label.Mui-focused': {
    color: theme.palette.primary.main,
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

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(1.5, 3),
  borderRadius: theme.shape.borderRadius,
  fontWeight: 'bold',
}));

const StyledMessage = styled(Box)(({ theme, type }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  fontSize: '0.9rem',
  color: theme.palette.text.primary,
  backgroundColor: type === 'success'
    ? theme.palette.success.dark
    : theme.palette.error.dark,
}));

const DBConnectionForm = ({ initialValues, onSubmit, isEditing, onTestConnection, status }) => {
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    if (!isEditing) return;
    setShowPassword((prev) => !prev);
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

  return (
    <ThemeProvider theme={darkTheme}>
      <StyledContainer>
        <StyledPaper>
          <Typography variant="h3" component="h5" align="center">
            {isEditing ? 'Edit Connection' : 'Connection Details'}
          </Typography>
          <Formik
            initialValues={initialValues}
            enableReinitialize
            validationSchema={validationSchema}
            onSubmit={onSubmit}
          >
            {({ values, isSubmitting }) => (
              <Form>
                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    name="name"
                    placeholder="Enter Name"
                    variant="outlined"
                    fullWidth
                    disabled={!isEditing}
                  />
                  <ErrorMessage name="name" component={FormHelperText} error />
                </StyledFormControl>

                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    name="description"
                    placeholder="Enter Description"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={2}
                    disabled={!isEditing}
                  />
                  <ErrorMessage name="description" component={FormHelperText} error />
                </StyledFormControl>

                <StyledFormControl>
                  <Field
                    as={Select}
                    name="databaseType"
                    fullWidth
                    displayEmpty
                    disabled={!isEditing}
                  >
                    <MenuItem value=""><em>Select Database</em></MenuItem>
                    {['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite'].map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Field>
                  <ErrorMessage name="databaseType" component={FormHelperText} error />
                </StyledFormControl>

                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    name="hostname"
                    placeholder="Enter Hostname"
                    variant="outlined"
                    fullWidth
                    disabled={!isEditing}
                  />
                  <ErrorMessage name="hostname" component={FormHelperText} error />
                </StyledFormControl>

                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    name="port"
                    placeholder="Enter Port"
                    variant="outlined"
                    fullWidth
                    disabled={!isEditing}
                  />
                  <ErrorMessage name="port" component={FormHelperText} error />
                </StyledFormControl>

                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    name="userId"
                    placeholder="Enter User ID"
                    variant="outlined"
                    fullWidth
                    disabled={!isEditing}
                  />
                  <ErrorMessage name="userId" component={FormHelperText} error />
                </StyledFormControl>

                <StyledFormControl>
                  <Field
                    as={StyledTextField}
                    name="password"
                    placeholder="Enter Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    fullWidth
                    disabled={!isEditing}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={togglePasswordVisibility}
                            edge="end"
                            disabled={!isEditing}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <ErrorMessage name="password" component={FormHelperText} error />
                </StyledFormControl>

                {isEditing && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <StyledButton
                      variant="contained"
                      color="primary"
                      onClick={() => onTestConnection(values)}
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
                      Update Connection
                    </StyledButton>
                  </Box>
                )}

                {status?.message && (
                  <StyledMessage type={status.type}>{status.message}</StyledMessage>
                )}
              </Form>
            )}
          </Formik>
        </StyledPaper>
      </StyledContainer>
    </ThemeProvider>
  );
};

export default DBConnectionForm;
