import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getConnectionById,
  updateConnection,
  testConnection,
  getTableGroups,
  getConnectionProfiling
} from '../api/dbapi';
import DBConnectionForm from './DBConnectionForm';
import { MenuItem, FormControl, InputLabel, Select } from '@mui/material';
import AddTableGroupModal from './AddTableGroupModal';
import EditIcon from '@mui/icons-material/Edit';
import {
  IconButton,
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
}));

const DBConnectionView = () => {
  const { id } = useParams();
  const [connectionData, setConnectionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState({});
  const [showTableGroupModal, setShowTableGroupModal] = useState(false);
  const [tableGroups, setTableGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [overviewData, setOverviewData] = useState(null);
  const [isFetchingOverview, setIsFetchingOverview] = useState(false);

  const transformToFormValues = (data) => ({
    name: data.name || '',
    description: data.description || '',
    databaseType: data.db_type || '',
    hostname: data.db_hostname || '',
    port: data.db_port || '',
    userId: data.user_id || '',
    password: data.password || '',
    databaseName: data.database || '',
  });

  useEffect(() => {
    const fetchConnection = async () => {
      try {
        const data = await getConnectionById(id);
        setConnectionData(transformToFormValues(data));
      } catch (err) {
        console.error('Error fetching DB connection:', err);
      }
    };

    fetchConnection();
  }, [id]);

  const reloadTableGroups = async () => {
    try {
      const groups = await getTableGroups(id);
      if (Array.isArray(groups)) {
        setTableGroups(groups);
      } else {
        setTableGroups([]);
      }
    } catch (err) {
      console.error('Failed to reload table groups:', err);
      setTableGroups([]);
    }
  };

  const fetchOverview = async () => {
    setIsFetchingOverview(true);
    setOverviewData(null);
    try {
      const profilingPayload = {
        db_type: connectionData.databaseType,
        db_hostname: connectionData.hostname,
        db_port: connectionData.port,
        user: connectionData.userId,
        password: connectionData.password,
        database: connectionData.databaseName,
        project_code: "DEMO"  // Or use "DEFAULT" if that’s your standard
      };
      console.log("conn_id being sent:", id);
      console.log("payload being sent:", profilingPayload);
 
      // Assuming you want to pass the connection ID in the URL, like '/profiling/{conn_id}/profiling'
      const overview = await getConnectionProfiling(id, profilingPayload); // Pass `id` here in the URL
 
      setOverviewData(overview);
    } catch (error) {
      console.error("Error fetching profiling data:", error);
      setStatus({ type: 'error', message: 'Failed to fetch profiling data' });
    } finally {
      setIsFetchingOverview(false);
    }
  };


  const fetchTableGroups = async () => {
    try {
      const groups = await getTableGroups(id);
      console.log('Fetched table groups:', groups); // <-- log to confirm
      if (Array.isArray(groups)) {
        setTableGroups(groups);
      } else {
        console.warn('Unexpected tableGroups response:', groups);
        setTableGroups([]);
      }
    } catch (err) {
      console.error('Failed to fetch table groups', err);
      setTableGroups([]); // fallback
    }
  };

  // still keep this useEffect
  useEffect(() => {
    if (id) {
      console.log("Fetching table groups for:", id);
      fetchTableGroups();
      console.log("Fetched table groups for:", id);

    }
  }, [id]);



  const handleUpdate = async (values) => {
    try {
      await updateConnection(id, values);
      setStatus({ type: 'success', message: 'Connection updated successfully' });
      setIsEditing(false);
      setConnectionData(values);
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
    <Box display="flex" sx={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'auto' }}>
      <Box flexGrow={1} sx={{ overflow: 'auto', p: 2, mr: 2, maxWidth: '70%' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" color="white">
            {isEditing ? 'Edit Connection' : 'Connection Details'}
          </Typography>
          <IconButton onClick={() => setIsEditing((prev) => !prev)} color="primary">
            <EditIcon sx={{ color: '#fff' }} />
          </IconButton>
        </Box>

        <StyledPaper sx={{ mb: 2, backgroundColor: '#1e1e1e', color: '#fff' }}>
          <DBConnectionForm
            initialValues={connectionData}
            onSubmit={handleUpdate}
            onTestConnection={handleTest}
            isEditing={isEditing}
            status={status}
          />

          {!isEditing && (
            <Box mt={2} display="flex" gap={2}>
              <Button variant="outlined" color="primary" onClick={() => handleTest(connectionData)}>
                Test Connection
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={fetchOverview}
                disabled={isFetchingOverview}
              >
                {isFetchingOverview ? 'Profiling Data...' : 'Get Profiling of Database'}
              </Button>
              <Button
                variant="outlined"
                color="success"
                onClick={() => setShowTableGroupModal(true)}
              >
                + Add Table Group
              </Button>
            </Box>
          )}

          <AddTableGroupModal
            open={showTableGroupModal}
            onClose={() => {
              setShowTableGroupModal(false);
              fetchTableGroups(); // This will nw refresh the list after modal closes
            }}
            connectionId={id}
          />


          {status.message && (
            <Box
              mt={2}
              p={2}
              bgcolor={status.type === 'success' ? 'green.700' : 'red.700'}
              color="white"
              borderRadius={1}
            >
              <Typography>{status.message}</Typography>
            </Box>
          )}
        </StyledPaper>
      </Box>
      <Box sx={{ width: '30%', p: 2 }}>
        <StyledPaper sx={{ backgroundColor: '#1e1e1e', color: '#fff' }}>
          <Typography variant="h7" gutterBottom>
            Select Table Group
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="table-group-select-label" sx={{ color: '#fff' }}>
              Table Group
            </InputLabel>
            <Select
              labelId="table-group-select-label"
              id="table-group-select"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: '#fff' } }}
            >
              {Array.isArray(tableGroups) && tableGroups.length > 0 ? (
                tableGroups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>
                  No table groups available
                </MenuItem>
              )}
            </Select>
          </FormControl>


          <Button
            variant="contained"
            color="primary"
            disabled={!selectedGroupId}
            onClick={() => {
              const selectedGroup = tableGroups.find((group) => group.id === selectedGroupId);
              const payload = {
                connectionId: id,
                connectionParams: connectionData,
                tableGroupParams: selectedGroup,
              };
              console.log('Send this to backend in the future:', payload);
              // You can call a new API function here in the future
            }}
          >
            Run with Selected Group
          </Button>
        </StyledPaper>
      </Box>

    </Box>
  );
};

export default DBConnectionView;
