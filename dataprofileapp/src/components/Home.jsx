// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Typography,
//   Grid,
//   Paper,
//   CircularProgress,
//   Chip,
//   Button,
// } from "@mui/material";
// import { DataGrid } from "@mui/x-data-grid";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";
// import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
// import { fetchDashboardSummary, fetchProfileResult } from "../api/dbapi";
// import ProfilingResultsTable from "./ProfilingResultsTable";
// import NewProfilingRunDialog from "./NewProfilingRUnDialog";
// import ConnectionsDialog from "./ConnectionDialog";



// const DashboardCard = ({ title, value, subtitle, chartData, onClick }) => (
//   <Paper
//     elevation={3}
//     sx={{
//       p: 3,
//       borderRadius: 4,
//       height: 150,
//       cursor: onClick ? "pointer" : "default",
//       "&:hover": onClick ? { boxShadow: 6 } : undefined,
//     }}
//     onClick={onClick}
//   >
//     <Grid container spacing={2} alignItems="center" justifyContent="space-between">
//       <Grid item xs={6}>
//         <Typography variant="subtitle2" color="text.secondary">
//           {title}
//         </Typography>
//         <Typography variant="h5" fontWeight="bold">
//           {value}
//         </Typography>
//         {subtitle && (
//           <Typography variant="caption" color="text.secondary">
//             {subtitle}
//           </Typography>
//         )}
//       </Grid>
//       <Grid item xs={6}>
//         {chartData && (
//           <ResponsiveContainer width="100%" height={60}>
//             <LineChart data={chartData}>
//               <Line
//                 type="monotone"
//                 dataKey="value"
//                 stroke="#1976d2"
//                 strokeWidth={2}
//                 dot={false}
//               />
//               <XAxis dataKey="date" hide />
//               <YAxis hide />
//               <Tooltip />
//             </LineChart>
//           </ResponsiveContainer>
//         )}
//       </Grid>
//     </Grid>
//   </Paper>
// );

// const Home = () => {
//   const [rows, setRows] = useState([]);
//   const [summary, setSummary] = useState({
//     connections: 0,
//     table_groups: 0,
//     profiling_runs: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(false);
//   const [profilingResults, setProfilingResults] = useState(null);
//   const [showResultsTable, setShowResultsTable] = useState(false);
//   const [isNewRunDialogOpen, setIsNewRunDialogOpen] = useState(false);
//   const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false); // ✅

//   const loadDashboardData = async () => {
//     try {
//       const data = await fetchDashboardSummary();
//       const runs = data.runs.map((run, index) => ({
//         id: index + 1,
//         connection_id: run.connection_id,
//         profiling_id: run.profiling_id,
//         status: run.status,
//         table_groups_id: run.table_groups_id,
//         created_at: new Date(run.created_at).toLocaleString(),
//       }));

//       setSummary({
//         connections: data.connections,
//         table_groups: data.table_groups,
//         profiling_runs: data.profiling_runs,
//       });
//       setRows(runs);
//     } catch (err) {
//       console.error("Dashboard fetch failed", err);
//       setError(true);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadDashboardData();
//   }, []);

//   const handleProfilingClick = async (row) => {
//     try {
//       const data = await fetchProfileResult(row.connection_id, row.profiling_id);
//       setProfilingResults(data);
//       setShowResultsTable(true);
//     } catch (error) {
//       console.error("Failed to fetch profiling result", error);
//     }
//   };

//   const handleOpenNewRunDialog = () => setIsNewRunDialogOpen(true);
//   const handleCloseNewRunDialog = () => setIsNewRunDialogOpen(false);
//   const handleNewRunSuccess = () => {
//     handleCloseNewRunDialog();
//     loadDashboardData();
//   };

//   const handleOpenConnectionDialog = () => setIsConnectionDialogOpen(true);
//   const handleCloseConnectionDialog = () => setIsConnectionDialogOpen(false);

//   const columns = [
//     { field: "id", headerName: "ID", width: 90 },
//     { field: "connection_id", headerName: "Connection ID", flex: 1 },
//     { field: "profiling_id", headerName: "Profiling ID", flex: 1 },
//     { field: "table_groups_id", headerName: "Table Groups ID", flex: 1 },
//     {
//       field: "status",
//       headerName: "Status",
//       flex: 1,
//       renderCell: (params) => {
//         const status = params.value?.toUpperCase();
//         let color = "warning";
//         if (status === "COMPLETE") color = "success";
//         else if (status === "ERROR") color = "error";
//         return <Chip label={status} color={color} variant="outlined" />;
//       },
//     },
//     { field: "created_at", headerName: "Created At", flex: 1 },
//   ];

//   const dummyChartData = [
//     { date: "Day 1", value: 1 },
//     { date: "Day 2", value: 2 },
//     { date: "Day 3", value: 3 },
//     { date: "Day 4", value: 2 },
//     { date: "Day 5", value: 4 },
//   ];

//   return (
//     <Box sx={{ p: 4 }}>
//       {/* Top Summary Cards */}
//       <Grid container spacing={3} mb={4}>
//         <Grid item xs={12} md={4}>
//           <DashboardCard
//             title="Connections"
//             value={summary.connections}
//             subtitle="Active"
//             chartData={dummyChartData}
//             onClick={handleOpenConnectionDialog} 
//           />
//         </Grid>
//         <Grid item xs={12} md={4}>
//           <DashboardCard
//             title="Table Groups"
//             value={summary.table_groups}
//             subtitle="Linked"
//           />
//         </Grid>
//         <Grid item xs={12} md={4}>
//           <DashboardCard
//             title="Profiling Runs"
//             value={summary.profiling_runs}
//             subtitle="Total Executed"
//           />
//         </Grid>
//       </Grid>

//       {/* Profiling Runs Table Section */}
//       <Paper elevation={3} sx={{ p: 3, borderRadius: 4 }}>
//         <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
//           <Typography variant="h6">Profiling Run Records</Typography>
//           <Button
//             variant="outlined"
//             startIcon={<AddCircleOutlineIcon />}
//             onClick={handleOpenNewRunDialog}
//           >
//             New Run
//           </Button>
//         </Box>

//         {loading ? (
//           <Box display="flex" justifyContent="center" py={5}>
//             <CircularProgress />
//           </Box>
//         ) : error ? (
//           <Typography color="error">Error loading data.</Typography>
//         ) : (
//           <div style={{ height: 500, width: "100%" }}>
//             <DataGrid
//               rows={rows}
//               columns={columns}
//               pageSize={10}
//               rowsPerPageOptions={[10]}
//               disableRowSelectionOnClick
//               onRowClick={(params) => handleProfilingClick(params.row)}
//             />
//           </div>
//         )}
//       </Paper>

//       {/* Profiling Results Section */}
//       {showResultsTable && profilingResults && (
//         <Box mt={4}>
//           <Typography variant="h6" gutterBottom>
//             Profiling Results
//           </Typography>
//           <ProfilingResultsTable profilingData={profilingResults} />
//         </Box>
//       )}

//       {/* Dialogs */}
//       <NewProfilingRunDialog
//         open={isNewRunDialogOpen}
//         onClose={handleCloseNewRunDialog}
//         onRunSuccess={handleNewRunSuccess}
//       />
//       <ConnectionsDialog
//         open={isConnectionDialogOpen}
//         onClose={handleCloseConnectionDialog}
//       />
//     </Box>
//   );
// };

// export default Home;

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Grid,
    Paper,
    CircularProgress,
    Chip,
    Button,
    Tooltip, // Import Tooltip from MUI
    useTheme, // Import useTheme
    Collapse, // Import Collapse for collapsible table
    IconButton, // Import IconButton for expand icon
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Import expand icon
import ChevronRightIcon from '@mui/icons-material/ChevronRight'; // Import collapse icon
import { DataGrid } from "@mui/x-data-grid";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
// Import necessary APIs
import { fetchDashboardSummary, fetchProfileResult } from "../api/dbapi";
import ProfilingResultsTable from "./ProfilingResultsTable"; 
import NewProfilingRunDialog from "./NewProfilingRUnDialog"; 
import ConnectionsDialog from "./ConnectionDialog"; 
import AnomalySummaryChart from "./Chart Components/AnamolySummaryChart";
import DataCompletenessChart from "./Chart Components/DataCompletenessChart";
import ColumnTypeDistributionChart from "./Chart Components/ColumnTypeDistributionChart";
import PIIFlagDistributionChart from "./Chart Components/PIIFlagDistributionChart";
import TopNullColumnsChart from "./Chart Components/TopNullColumnsChart";
import TopCardinalityColumnsChart from "./Chart Components/TopCardinalityColumnsChart";
import FullChartModal from "./Chart Components/FullChartModal"; 
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper'; 


const MAX_TOP = 5; // Number of top/bottom columns to display (can be passed as prop if needed)

// Define columns for the DataGrid outside the component
const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "connection_id", headerName: "Connection ID", flex: 1 },
    { field: "profiling_id", headerName: "Profiling ID", flex: 1 },
    { field: "table_groups_id", headerName: "Table Groups ID", flex: 1 },
    {
        field: "status",
        headerName: "Status",
        flex: 1,
        renderCell: (params) => {
            const status = params.value?.toUpperCase();
            let color = "warning";
            if (status === "COMPLETE") color = "success";
            else if (status === "ERROR") color = "error";
            return <Chip label={status} color={color} variant="outlined" />;
        },
    },
    { field: "created_at", headerName: "Created At", flex: 1 },
];


// Dashboard Card component (kept from previous version)
const DashboardCard = ({ title, value, subtitle, chartData, onClick }) => {
    const theme = useTheme(); // Use useTheme inside the component

    return (
        <Paper
            elevation={3}
            sx={{
                p: 3,
                borderRadius: 4,
                height: 150,
                cursor: onClick ? "pointer" : "default",
                "&:hover": onClick ? { boxShadow: 6 } : undefined,
                // Add dark mode styles if not handled by theme Paper default
                bgcolor: theme.palette.background.paper,
                color: theme.palette.text.primary,
            }}
            onClick={onClick}
        >
            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                        {title}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                        {value}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Grid>
                {/* Removed chartData rendering from DashboardCard as it's not used here */}
            </Grid>
        </Paper>
    );
};


const Home = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    // Define COLORS inside the component where theme is available
    const COLORS = [
        theme.palette.primary.main, // Use theme primary color
        theme.palette.secondary.main, // Use theme secondary color
        theme.palette.error.main,    // Use theme error color
        theme.palette.warning.main,  // Use theme warning color
        theme.palette.info.main,     // Use theme info color
        theme.palette.success.main,  // Use theme success color
        theme.palette.grey[500]      // Use a grey shade
    ];

    // State for Dashboard Summary and Run History Table
    const [rows, setRows] = useState([]); // Full list of run summaries for the table
    const [summary, setSummary] = useState({
        connections: 0,
        table_groups: 0,
        profiling_runs: 0,
    });

    // State for the Profiling Run data currently displayed in Charts
    const [displayedRunSummary, setDisplayedRunSummary] = useState(null); // Summary of the currently displayed run
    const [displayedProfileResults, setDisplayedProfileResults] = useState([]); // Detailed results for the currently displayed run

    // Loading and Error States (combined for initial load)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for Collapsible History Table
    const [isHistoryTableExpanded, setIsHistoryTableExpanded] = useState(false);

    // Dialog States
    const [isNewRunDialogOpen, setIsNewRunDialogOpen] = useState(false);
    const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
    // State for showing the detailed results table below the charts (when clicking a history row)
    const [showResultsTable, setShowResultsTable] = useState(false);
    const [profilingResultsDetailed, setProfilingResultsDetailed] = useState(null); // Data for detailed results table

    // State for Full Chart Modal
    const [isFullChartModalOpen, setIsFullChartModalOpen] = useState(false);
    const [fullChartType, setFullChartType] = useState(null); // Type of chart to display in full view

    // State to manage the order of chart components for drag and drop
    const [chartOrder, setChartOrder] = useState([
        'dq_score', // Keeping DQ score as a conceptual chart type for ordering
        'anomaly',
        'completeness',
        'column_type',
        'pii_flag',
        'top_null',
        'top_cardinality',
    ]);


    // --- Data Fetching ---
    // Initial data load for summary, history table, and latest run charts
    useEffect(() => {
        const loadDashboardInitialData = async () => {
            setLoading(true);
            setError('');
            try {
                // 1. Fetch summary data for top cards and run history table
                const summaryData = await fetchDashboardSummary();

                const runs = summaryData.runs.map((run) => ({
                    // Use profiling_id as unique id for DataGrid
                    id: run.profiling_id,
                    connection_id: run.connection_id,
                    profiling_id: run.profiling_id,
                    status: run.status,
                    table_groups_id: run.table_groups_id,
                    created_at: new Date(run.created_at).toLocaleString(),
                    // Include other summary fields if needed for displayedRunSummary
                    anomaly_ct: run.anomaly_ct,
                    anomaly_table_ct: run.anomaly_table_ct,
                    anomaly_column_ct: run.anomaly_column_ct,
                    dq_affected_data_points: run.dq_affected_data_points,
                    dq_total_data_points: run.dq_total_data_points,
                    dq_score_profiling: run.dq_score_profiling,
                    table_ct: run.table_ct,
                    column_ct: run.column_ct,
                }));

                setSummary({
                    connections: summaryData.connections,
                    table_groups: summaryData.table_groups,
                    profiling_runs: summaryData.profiling_runs,
                });
                setRows(runs); // Populate the history table rows

                // 2. Identify the most recent run from the fetched runs list
                const latestRunSummary = runs.length > 0 ? runs[0] : null; // Assuming runs are returned in most recent order

                // 3. Fetch detailed results for the most recent run (if any)
                if (latestRunSummary) {
                     try {
                        const latestRunResults = await fetchProfileResult(latestRunSummary.connection_id, latestRunSummary.profiling_id);
                        setDisplayedRunSummary(latestRunSummary);
                        setDisplayedProfileResults(latestRunResults);
                     } catch (fetchResultsError) {
                         console.error("Failed to fetch detailed results for latest run:", fetchResultsError);
                         // Display summary data but show an error for detailed results/charts
                         setDisplayedRunSummary(latestRunSummary); // Still show summary info if available
                         setDisplayedProfileResults([]); // No detailed results
                         setError('Failed to load detailed data for the latest run.');
                     }
                } else {
                     // No runs found at all
                     setError('No profiling runs found. Run a profiling job to see the dashboard.');
                     setDisplayedRunSummary(null);
                     setDisplayedProfileResults([]);
                }

            } catch (err) {
                console.error("Dashboard initial fetch failed", err);
                setError('Failed to load dashboard data.');
                 setDisplayedRunSummary(null);
                 setDisplayedProfileResults([]);
                 setRows([]);
                 setSummary({connections: 0, table_groups: 0, profiling_runs: 0});
            } finally {
                setLoading(false);
            }
        };

        loadDashboardInitialData();
    }, []); // Empty dependency array means this runs once on mount


    // --- Handlers ---
    // Handler for DataGrid row click (updates charts and shows detailed results table)
    const handleProfilingRowClick = async (params) => {
         const clickedRowSummary = params.row; // The summary data from the DataGrid row

         setShowResultsTable(false); // Hide previous detailed table while loading

        // Find the full run summary object from the rows state using the profiling_id
        const fullClickedRunSummary = rows.find(run => run.profiling_id === clickedRowSummary.profiling_id);

        if (!fullClickedRunSummary) {
             console.error("Could not find full run summary for clicked row:", clickedRowSummary);
             setError(`Could not find full data for run ${clickedRowSummary.id}.`);
             setDisplayedRunSummary(null);
             setDisplayedProfileResults([]);
             setProfilingResultsDetailed(null);
             setShowResultsTable(false);
             return;
        }

        // Update charts to show data for the clicked run using the full summary data
        setDisplayedRunSummary(fullClickedRunSummary);
        setDisplayedProfileResults([]); // Clear previous chart data while loading
        setError(''); // Clear previous errors related to chart data

        try {
            // Fetch detailed results for the clicked run
            const detailedResults = await fetchProfileResult(fullClickedRunSummary.connection_id, fullClickedRunSummary.profiling_id);
            setDisplayedProfileResults(detailedResults); // Update chart data

            // Also set data for the detailed results table below
            setProfilingResultsDetailed(detailedResults);
            setShowResultsTable(true); // Show the detailed table

        } catch (error) {
            console.error("Failed to fetch detailed profiling result for row click", error);
            // Keep the run summary but clear detailed results and show error for charts
            setDisplayedProfileResults([]);
            setError(`Failed to load detailed data for run ${fullClickedRunSummary.id}.`);
             // Also clear the detailed table data on error
            setProfilingResultsDetailed(null);
            setShowResultsTable(false);
        }
    };

    // Handler for double click on the main dashboard container (navigates to detailed results)
    const handleDoubleClickMain = () => {
        // Navigate using the currently displayed run's IDs
        if (displayedRunSummary && displayedRunSummary.connection_id && displayedRunSummary.profiling_id) {
            navigate(`/connection/${displayedRunSummary.connection_id}/profileresult/${displayedRunSummary.profiling_id}`);
        } else {
             console.warn("Cannot navigate to detailed results: No run data is currently displayed.");
             // Optionally show a user-friendly message
        }
    };

    // Handlers for New Profiling Run Dialog
    const handleOpenNewRunDialog = () => setIsNewRunDialogOpen(true);
    const handleCloseNewRunDialog = () => setIsNewRunDialogOpen(false);
    const handleNewRunSuccess = () => {
        handleCloseNewRunDialog();
        loadDashboardInitialData(); // Reload all dashboard data after a successful new run
    };

    // Handlers for Connections Dialog
    const handleOpenConnectionDialog = () => setIsConnectionDialogOpen(true);
    const handleCloseConnectionDialog = () => setIsConnectionDialogOpen(false);

    // Handlers for Full Chart Modal
    const handleOpenFullChartModal = (chartType) => {
        setFullChartType(chartType);
        setIsFullChartModalOpen(true);
    };

    const handleCloseFullChartModal = () => {
        setFullChartType(null);
        setIsFullChartModalOpen(false);
    };

    // Handler for 'View Full History' Button
    const handleViewFullHistory = () => {
        navigate('/profiling-history'); // Navigate to the full history route
    };

    // Handler to toggle history table expansion
    const handleToggleHistoryTable = () => {
        setIsHistoryTableExpanded(prev => !prev);
    };

    // React DnD move card function
    const moveCard = useCallback((dragIndex, hoverIndex) => {
        setChartOrder((prevChartOrder) =>
            update(prevChartOrder, {
                $splice: [
                    [dragIndex, 1],
                    [hoverIndex, 0, prevChartOrder[dragIndex]],
                ],
            }),
        );
    }, []);


    // --- Data Transformations for Charts ---
    // These transformations are now mostly moved to individual chart components,
    // but we keep DQ score calculation here as it's part of the main Home render
    const dqScorePercentage = displayedRunSummary?.dq_score_profiling !== undefined && displayedRunSummary?.dq_score_profiling !== null
        ? (parseFloat(displayedRunSummary.dq_score_profiling) * 100).toFixed(2) // Ensure parsing as float
        : 'N/A';

    const dqScoreColor = (score) => {
        // Use the percentage value (0-100) for color logic
        const percentage = parseFloat(score);
        if (isNaN(percentage)) return theme.palette.text.primary; // Default color if N/A
        if (percentage >= 95) return theme.palette.success.main; // Green for high score
        if (percentage >= 80) return theme.palette.warning.main; // Yellow/Orange for medium score
        return theme.palette.error.main; // Red for low score
    };


    // Map chart type identifiers to their components
    const chartComponents = {
        anomaly: AnomalySummaryChart,
        completeness: DataCompletenessChart,
        column_type: ColumnTypeDistributionChart,
        pii_flag: PIIFlagDistributionChart,
        top_null: TopNullColumnsChart,
        top_cardinality: TopCardinalityColumnsChart,
        // DQ Score is handled separately as it's not a standard Recharts component
    };


    // --- Rendering ---
    if (loading) {
        return (
            <Box mt={10} display="flex" justifyContent="center">
                <CircularProgress size={60} />
            </Box>
        );
    }

    // Determine if charts should be shown
    const showCharts = displayedRunSummary && displayedProfileResults.length > 0;

    return (
        // Wrap the main content with DndProvider
        <DndProvider backend={HTML5Backend}>
            {/* Attach double click handler to the main container */}
            <Box p={4} onDoubleClick={showCharts ? handleDoubleClickMain : undefined} sx={{ cursor: showCharts ? 'pointer' : 'default' }}>
                <Typography variant="h4" gutterBottom>
                    Dashboard Overview
                </Typography>

                {/* Optional: Add a caption indicating double-click functionality */}
                {showCharts && (
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                        Double click anywhere on the dashboard to see full detailed results for the currently displayed run ({displayedRunSummary?.id}).
                    </Typography>
                )}

                 {/* Error message for chart data */}
                 {error && (
                     <Box textAlign="center" my={2}>
                        <Typography variant="h6" color="error">{error}</Typography>
                     </Box>
                 )}


                {/* Top Summary Cards */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} md={4}>
                        <DashboardCard
                            title="Connections"
                            value={summary.connections}
                            subtitle="Active"
                            onClick={handleOpenConnectionDialog}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <DashboardCard
                            title="Table Groups"
                            value={summary.table_groups}
                            subtitle="Linked"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <DashboardCard
                            title="Profiling Runs"
                            value={summary.profiling_runs}
                            subtitle="Total Executed"
                        />
                    </Grid>
                </Grid>

                {/* Charts Section - Only render if displayedRunSummary and displayedProfileResults are available */}
                {showCharts ? (
                    <Grid container spacing={3} mb={4}>
                         {/* DQ Score (remains here as it's not a standard chart component) */}
                        <Grid item xs={12} sm={6} md={4}>
                             <Box
                                // DQ Score doesn't open a full chart view, but can have an overview dialog
                                onClick={() => handleOpenFullChartModal('dq_score')} // Using the modal for DQ overview as well
                                onMouseEnter={e => {
                                     // Optional: Add a popover for DQ score on hover if needed
                                     // handlePopoverOpen(e, 'dq_score_overview');
                                }}
                                onMouseLeave={e => {
                                     // Optional: Close popover
                                     // handlePopoverClose();
                                }}
                                sx={{ cursor: 'pointer', height: '100%' }}
                            >
                                <Paper sx={{ p: 3, textAlign: 'center', height: '100%', minHeight: 200 }}>
                                    <Tooltip title={`Data Quality Score: ${dqScorePercentage}%`}>
                                        <Typography variant="h5" sx={{ color: dqScoreColor(dqScorePercentage), fontWeight: 'bold' }}>
                                            DQ Score: {dqScorePercentage}%
                                        </Typography>
                                    </Tooltip>
                                    <Typography variant="body2" color="text.secondary" mt={1}>
                                        Total Rows: {displayedRunSummary?.table_ct || 0} | Total Columns: {displayedRunSummary?.column_ct || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Affected Data Points: {displayedRunSummary?.dq_affected_data_points || 0} / {displayedRunSummary?.dq_total_data_points || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" mt={2} display="block">
                                        Click for overview
                                    </Typography>
                                </Paper>
                            </Box>
                        </Grid>

                        {/* Render other charts based on chartOrder state */}
                        {chartOrder
                            .filter(type => type !== 'dq_score') // Exclude DQ score as it's rendered above
                            .map((chartType, index) => {
                                const ChartComponent = chartComponents[chartType];
                                if (!ChartComponent) return null;
                                const itemsToRender = [];

                                // Check if this is the Top Cardinality chart
                                if (chartType === 'top_cardinality') {
                                     // If it is, add a full-width Grid item before it to force a new row
                                     itemsToRender.push(
                                        <Grid item xs={12} key={`break-${chartType}`}></Grid>
                                     );
                                }

                                return (
                                    <ChartComponent
                                        key={chartType} // Use chart type as key
                                        id={chartType} // Pass id for drag and drop
                                        index={index} // Pass index for drag and drop
                                        displayedRunSummary={displayedRunSummary}
                                        displayedProfileResults={displayedProfileResults}
                                        onChartClick={handleOpenFullChartModal} // Pass handler for full view
                                        moveCard={moveCard} // Pass move function for drag and drop
                                        COLORS={COLORS} // Pass COLORS array
                                    />
                                );
                            })}
                    </Grid>
                ) : (
                    // Message when no chart data is available for charts
                    <Box textAlign="center" my={4}>
                        <Typography variant="h6" color="text.secondary">
                            {error || 'No profiling run data available to display charts. Run a profiling job or select a run from the history below.'}
                        </Typography>
                    </Box>
                )}


                {/* Profiling Runs Table Section */}
                <Paper elevation={3} sx={{ p: 3, borderRadius: 4, mt: 4 }}> {/* Added margin top */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Profiling Run Records</Typography>
                        <Box>
                             {/* Toggle History Table Button */}
                            <Button
                                variant="outlined"
                                onClick={handleToggleHistoryTable}
                                startIcon={isHistoryTableExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                                sx={{ mr: 1 }} // Add margin to the right
                            >
                                {isHistoryTableExpanded ? 'Hide History' : 'Show History'}
                            </Button>
                             {/* New Run Button */}
                            <Button
                                variant="outlined"
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={handleOpenNewRunDialog}
                            >
                                New Run
                            </Button>
                        </Box>
                    </Box>

                    {/* Collapsible DataGrid for Run History */}
                    <Collapse in={isHistoryTableExpanded}>
                        {/* Loading and error handling for this section is covered by the main loading/error state */}
                        {rows.length > 0 ? ( // Only render DataGrid if there are rows
                            <div style={{ height: 500, width: "100%" }}>
                                <DataGrid
                                    rows={rows}
                                    columns={columns} // columns is now defined outside and available
                                    pageSize={10}
                                    rowsPerPageOptions={[10]}
                                    disableRowSelectionOnClick
                                    onRowClick={handleProfilingRowClick} // Use the handler to update charts and show detailed table
                                    sx={{ // Add dark mode styles for DataGrid
                                        '& .MuiDataGrid-root': {
                                            border: 'none',
                                        },
                                        '& .MuiDataGrid-cell': {
                                            borderColor: theme.palette.divider,
                                            color: theme.palette.text.primary,
                                        },
                                        '& .MuiDataGrid-columnsContainer': {
                                            borderColor: theme.palette.divider,
                                            bgcolor: theme.palette.background.paper, // Header background
                                            color: theme.palette.text.primary,
                                        },
                                         '& .MuiDataGrid-columnHeaders': {
                                             bgcolor: theme.palette.background.paper, // Ensure header background is consistent
                                         },
                                        '& .MuiDataGrid-columnHeaderTitle': {
                                            fontWeight: 'bold',
                                        },
                                        '& .MuiDataGrid-row': {
                                            '&:nth-of-type(odd)': {
                                                bgcolor: theme.palette.action.hover, // Subtle striping
                                            },
                                            '&:hover': {
                                                bgcolor: theme.palette.action.selected, // Hover color
                                                cursor: 'pointer',
                                            },
                                        },
                                        '& .MuiDataGrid-footerContainer': {
                                            borderColor: theme.palette.divider,
                                            bgcolor: theme.palette.background.paper, // Footer background
                                            color: theme.palette.text.primary,
                                        },
                                         '& .MuiTablePagination-root': {
                                             color: theme.palette.text.primary, // Pagination text color
                                         },
                                         '& .MuiSvgIcon-root': {
                                             color: theme.palette.action.active, // Pagination icon color
                                         }
                                    }}
                                />
                            </div>
                        ) : (
                            // Message when no run history is available
                             <Box textAlign="center" py={5}>
                                <Typography variant="body1" color="text.secondary">No profiling run history available.</Typography>
                             </Box>
                        )}
                    </Collapse>


                    {/* View Full History Button */}
                    {rows.length > 0 && ( // Only show button if there's history
                         <Box mt={2} textAlign="center">
                            <Button variant="outlined" onClick={handleViewFullHistory}>
                                View Full History Page
                            </Button>
                         </Box>
                    )}

                </Paper>

                {/* Detailed Profiling Results Section (appears when a history row is clicked) */}
                {showResultsTable && profilingResultsDetailed && (
                    <Box mt={4}>
                        <Typography variant="h6" gutterBottom>
                            Detailed Profiling Results for Run {displayedRunSummary?.id}
                        </Typography>
                        {/* Assuming ProfilingResultsTable component is available and accepts profilingData prop */}
                        <ProfilingResultsTable profilingData={profilingResultsDetailed} />
                    </Box>
                )}

                {/* Dialogs */}
                <NewProfilingRunDialog
                    open={isNewRunDialogOpen}
                    onClose={handleCloseNewRunDialog}
                    onRunSuccess={handleNewRunSuccess}
                />
                <ConnectionsDialog
                    open={isConnectionDialogOpen}
                    onClose={handleCloseConnectionDialog}
                />
                 {/* Full Chart Modal */}
                <FullChartModal
                    open={isFullChartModalOpen}
                    onClose={handleCloseFullChartModal}
                    chartType={fullChartType}
                    displayedRunSummary={displayedRunSummary}
                    displayedProfileResults={displayedProfileResults}
                    COLORS={COLORS} // Pass colors to the modal
                />
            </Box>
        </DndProvider>
    );
};

export default Home;
