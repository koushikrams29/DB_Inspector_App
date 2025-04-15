import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getConnectionById, updateConnection, testConnection, getConnectionOverview } from '../api/dbapi';
import DBConnectionForm from './DBConnectionForm';
import EditIcon from '@mui/icons-material/Edit';
import {
    IconButton, Box, Typography, Button,
    Grid, Paper, TableContainer, Table, TableHead, TableBody, TableRow, TableCell,
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
    const [overviewData, setOverviewData] = useState(null);
    const [isFetchingOverview, setIsFetchingOverview] = useState(false);
    const [tableList, setTableList] = useState([]); // State to hold the list of tables

    // Transform MySQL snake_case keys to camelCase for the form
    const transformToFormValues = (data) => ({
        name: data.name || '',
        description: data.description || '',
        databaseType: data.db_type || '',
        hostname: data.db_hostname || '',
        port: data.db_port || '',
        userId: data.user_id || '',
        password: data.password || '',
        databaseName: data.database || '', // Ensure databaseName is included
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

    useEffect(() => {
        if (connectionData && !overviewData) {
            fetchOverview();
        }
    }, [connectionData, overviewData]);

    useEffect(() => {
        if (overviewData) {
            if (overviewData.db_type === 'MongoDB' && overviewData.collections) {
                // Handle MongoDB data structure
                setTableList(overviewData.collections);
            }
            else if (overviewData && overviewData.schemas) {
                // Extract table names for the first schema found (you might need more logic for multiple schemas)
                const firstSchemaKey = Object.keys(overviewData.schemas)[0];
                if (firstSchemaKey && overviewData.schemas[firstSchemaKey].tables) {
                    // Get the table *objects*, not just the keys.
                    setTableList(Object.entries(overviewData.schemas[firstSchemaKey].tables));
                } else {
                    setTableList([]);
                }
            }
             else {
                setTableList([]);
            }
        }
         else {
            setTableList([]);
        }
    }, [overviewData]);

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

    const fetchOverview = async () => {
        setIsFetchingOverview(true);
        setOverviewData(null);
        try {
            const overview = await getConnectionOverview(id);
            setOverviewData(overview);
        } catch (error) {
            console.error("Error fetching database overview:", error);
            setStatus({ type: 'error', message: 'Failed to fetch database overview' });
        } finally {
            setIsFetchingOverview(false);
        }
    };

    if (!connectionData) return <Typography color="white">Loading...</Typography>;

    return (
        <Box display="flex" sx={{ width: '100%', height: 'calc(100vh - 64px)', overflow: 'auto' }}>
            {/* Left side: Connection Details and Overview */}
            <Box flexGrow={1} sx={{ overflow: 'auto', p: 2, mr: 2, maxWidth: '70%' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" color="white">
                        {isEditing ? 'Edit Connection' : 'Connection Details'}
                    </Typography>
                    <IconButton onClick={() => setIsEditing(prev => !prev)} color="primary">
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

                    {/* Buttons for testing and fetching overview in view-only mode */}
                    {!isEditing && (
                        <Box mt={2} display="flex" gap={2}>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => handleTest(connectionData)}
                            >
                                Test Connection
                            </Button>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={fetchOverview}
                                disabled={isFetchingOverview}
                            >
                                {isFetchingOverview ? 'Fetching Overview...' : 'Get Database Overview'}
                            </Button>
                        </Box>
                    )}

                    {status.message && (
                        <Box mt={2} p={2} bgcolor={status.type === 'success' ? 'green.700' : 'red.700'} color="white" borderRadius={1}>
                            <Typography>{status.message}</Typography>
                        </Box>
                    )}
                </StyledPaper>

                {/* Display the overview data if available */}
                
            </Box>

            {/* Right side: List of Tables
             <StyledPaper sx={{ width: 240, overflowY: 'auto', backgroundColor: '#1e1e1e', color: '#fff' }}>
                <Typography variant="h6" gutterBottom color="inherit">
                    Tables
                </Typography>
                <TableContainer sx={{ backgroundColor: '#1e1e1e', padding: 2 }}>
                    <Table size="small" aria-label="tables">
                        <TableBody>
                            {tableList.map((table) => {
                                let tableName = '';
                                let columns = [];

                                if (overviewData?.db_type === 'MongoDB') {
                                    // MongoDB: table is a collection object
                                    tableName = table.name;
                                    columns = table.sample_fields ? table.sample_fields.map(field => ({ name: field })) : []; // Convert to expected format
                                } else {
                                     //Other DBs
                                    tableName = table[0];
                                    const tableData = table[1];
                                    columns = tableData.columns || [];
                                }


                                return (
                                    <TableRow key={tableName} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell component="th" scope="row" sx={{ color: '#fff' }}>
                                            {tableName}
                                        </TableCell>
                                        <TableCell sx={{ color: '#fff' }}>
                                            {columns.length > 0
                                                ? columns.map(col => col.name).join(', ')
                                                : 'No columns available'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </StyledPaper> */}

{overviewData && (
                    <StyledPaper sx={{ mt: 3, backgroundColor: '#1e1e1e', color: '#fff' }}>
                        <Typography variant="h6" color="inherit" mb={1}>Database Overview:</Typography>
                        {overviewData.db_type === 'MongoDB' ? (
                            // Render MongoDB collections
                            overviewData.collections.map((collection) => (
                                <Box key={collection.name} mb={2}>
                                     <Typography variant="subtitle2" color="inherit">Collection: {collection.name}</Typography>
                                        {collection.sample_fields && collection.sample_fields.length > 0 ? (
                                            <ul style={{ color: '#e0e0e0', paddingLeft: 20 }}>
                                                {collection.sample_fields.map((field) => (
                                                    <li key={field}>
                                                        {field}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <Typography variant="body2" color="inherit" ml={2}>No sample fields found.</Typography>
                                        )}
                                </Box>
                            ))
                        ) : overviewData.schemas ? (
                            // Render other database schemas
                            Object.entries(overviewData.schemas).map(([schemaName, schemaDetails]) => (
                                <Box key={schemaName} mb={2}>
                                    <Typography variant="subtitle1" color="inherit">Schema: {schemaName}</Typography>
                                    {schemaDetails.tables && Object.entries(schemaDetails.tables).map(([tableName, tableDetails]) => (
                                        <Box key={tableName} ml={2} mb={1}>
                                            <Typography variant="subtitle2" color="inherit">Table: {tableName}</Typography>
                                            {tableDetails.columns && tableDetails.columns.length > 0 ? (
                                                <ul style={{ color: '#e0e0e0', paddingLeft: 20 }}>
                                                    {tableDetails.columns.map((column) => (
                                                        <li key={column.name}>
                                                            {column.name} ({column.type})
                                                        </li>
                                                    ))}
                                                    {tableDetails.columns.length < (schemaDetails.tables[tableName]?.columns?.length || 0) && (
                                                        <Typography variant="caption" color="inherit">...and more columns</Typography>
                                                    )}
                                                </ul>
                                            ) : (
                                                <Typography variant="body2" color="inherit" ml={2}>No columns found.</Typography>
                                            )}
                                        </Box>
                                    ))}

                                    {!schemaDetails.tables && (
                                        <Typography variant="body2" color="inherit" ml={2}>No tables found in this schema.</Typography>
                                    )}
                                </Box>
                            ))
                        ) : (
                            <Typography variant="body2" color="inherit">No schema information available.</Typography>
                        )}
                    </StyledPaper>
                )}
        </Box>
    );
};

export default DBConnectionView;
