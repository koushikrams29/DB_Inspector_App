import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getConnectionById, updateConnection, testConnection } from '../api/dbapi';
import DBConnectionForm from './DBConnectionForm';
import EditIcon from '@mui/icons-material/Edit';
import { IconButton, Box, Typography, Button } from '@mui/material';

const DBConnectionView = () => {
  const { id } = useParams();
  const [connectionData, setConnectionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState({});

  // Transform MySQL snake_case keys to camelCase for the form
  const transformToFormValues = (data) => ({
    name: data.name || '',
    description: data.description || '',
    databaseType: data.db_type || '',
    hostname: data.db_hostname || '',
    port: data.db_port || '',
    userId: data.user_id || '',
    password: data.password || '',
  });

  useEffect(() => {
    const fetchConnection = async () => {
      try {
        const data = await getConnectionById(id);
        setConnectionData(transformToFormValues(data));
      } catch (err) {
        console.error("Error fetching DB connection:", err);
      }
    };

    fetchConnection();
  }, [id]);

  const handleUpdate = async (values) => {
    try {
      await updateConnection(id, values);
      setStatus({ type: 'success', message: 'Connection updated successfully' });
      setIsEditing(false);
      setConnectionData(values); // Update state with new values
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to update connection' });
    }
  };

  const handleTest = async (values) => {
    try {
      const result = await testConnection(values);
      setStatus({ type: 'success', message: result.message || 'Connection is valid' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Connection test failed' });
    }
  };

  if (!connectionData) return <Typography color="white">Loading...</Typography>;

  return (
    <Box display="flex" justifyContent="flex-start" px={2} pt={2}>
      <Box width="100%" maxWidth="600px">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" color="white">
            {isEditing ? 'Edit Connection' : 'Connection Details'}
          </Typography>
          <IconButton onClick={() => setIsEditing(prev => !prev)} color="primary">
            <EditIcon sx={{ color: '#fff' }} />
          </IconButton>
        </Box>

        <DBConnectionForm
          initialValues={connectionData}
          onSubmit={handleUpdate}
          onTestConnection={handleTest}
          isEditing={isEditing}
          status={status}
        />

        {/* Show Test Connection button in view-only mode */}
        {!isEditing && (
          <Box mt={2}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => handleTest(connectionData)}
            >
              Test Connection
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DBConnectionView;
