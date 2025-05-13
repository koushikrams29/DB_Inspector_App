import './App.css';
import * as React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import {
  Box, Drawer, CssBaseline, Toolbar, List, ButtonBase, Typography, Divider,
  IconButton, Accordion, AccordionSummary, AccordionDetails,
  ListItem, ListItemButton, ListItemText, ListItemIcon,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  AppBar as MuiAppBar
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Routes, Route, useNavigate, Link } from "react-router-dom";
import logo from './assets/WhiteCovasant.svg';
import Home from './components/Home';
import DBConnection from './components/DBconnection';
import DBConnectionView from './components/DBConnectionView';
// Import the API functions needed
import { getAllConnections, deleteConnection } from './api/dbapi';

const drawerWidth = 240;

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  flexGrow: 1,
  backgroundColor: '#000',
  padding: theme.spacing(3),
  paddingTop: `64px`, // Adjust padding top to account for AppBar height
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  marginLeft: `-${drawerWidth}px`,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: 0,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: '#1E1E1E',
  color: '#fff',
  boxShadow: 'none',
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const LogoImage = styled('img')({
  width: '80%',
  margin: '0 auto 16px auto', // Center the logo and add margin below
  display: 'block', // Ensure margin auto works
});

const App = () => {
  const theme = useTheme();
  const [open, setOpen] = React.useState(true); // State for drawer open/close
  const navigate = useNavigate(); // Hook for navigation
  const [connections, setConnections] = React.useState([]); // State to store the list of connections
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false); // State for delete confirmation dialog
  const [selectedConnectionId, setSelectedConnectionId] = React.useState(null); // State to hold the ID of the connection to be deleted

  // Handler to open the drawer
  const handleDrawerOpen = () => setOpen(true);
  // Handler to close the drawer
  const handleDrawerClose = () => setOpen(false);

  // Handler for clicking "Add New Database"
  const handleAddNewDatabaseClick = () => {
    navigate('/addnewdatabase'); // Navigate to the add connection route
    setOpen(false); // Close the drawer
  };

  // Function to fetch the list of connections from the backend
  const fetchConnections = async () => {
    try {
      const data = await getAllConnections(); // Call the API function
      setConnections(data); // Update the connections state
    } catch (error) {
      console.error("Error fetching connections:", error);
      // Optionally set an error state to display a message to the user
    }
  };

  // Effect hook to fetch connections when the component mounts
  React.useEffect(() => {
    fetchConnections();
  }, []); // Empty dependency array means this runs once on mount

  // Handler for when a new connection is successfully saved
  const handleConnectionSaved = (newConnection) => {
    // Add the new connection to the existing list
    setConnections((prev) => [...prev, newConnection]);
    // Optionally navigate to the view page for the new connection
    // navigate(`/connection/${newConnection.connection_id}`);
  };

  // Handler for clicking the delete button on a connection item
  const handleDeleteClick = (id) => {
    setSelectedConnectionId(id); // Set the ID of the connection to delete
    setDeleteDialogOpen(true); // Open the delete confirmation dialog
  };

  // Handler for confirming the delete action
  const confirmDelete = async () => {
    try {
      // Call the API function to delete the connection
      await deleteConnection(selectedConnectionId);
      // Filter the deleted connection out of the local state
      setConnections(prev => prev.filter(conn => conn.connection_id !== selectedConnectionId)); // Use connection_id for filtering if deleteConnection uses it
      // Note: If deleteConnection API expects the UUID 'id', use conn.id !== selectedConnectionId here.
      // Based on your deleteConnection service signature `delete_connection_service(conn_id: int, db: Session)`,
      // it seems to expect the BIGINT connection_id. Let's use connection_id for filtering here.
    } catch (error) {
      console.error("Error deleting connection:", error);
      // Optionally show an error message to the user
    } finally {
      // Close the dialog and reset selected ID
      setDeleteDialogOpen(false);
      setSelectedConnectionId(null);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline /> {/* Provides a basic CSS reset */}
      {/* AppBar (Header) */}
      <AppBar position="fixed" open={open}>
        <Toolbar>
          {/* Menu Icon to open drawer */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }} // Hide when drawer is open
          >
            <MenuIcon />
          </IconButton>
          {/* App Title (clickable to navigate home) */}
          <Typography variant="h6" noWrap component="div">
            <ButtonBase
              component={Link} // Use React Router Link
              to="/" // Navigate to home
              className='link' // Apply custom styles if needed
              sx={{ textDecoration: 'none', color: 'white', width: 'fit-content' }}
            >
              DB Inspector
            </ButtonBase>
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer (Sidebar) */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#121212', // Dark background for drawer
            color: '#fff', // White text color
          },
        }}
        variant="persistent" // Drawer remains open until closed
        anchor="left" // Position on the left
        open={open} // Controlled by state
      >
        {/* Drawer Header with close button */}
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose} sx={{ color: '#fff' }}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>

        {/* Logo */}
        <LogoImage src={logo} alt="Logo" />
        <Divider sx={{ backgroundColor: '#333' }} /> {/* Divider line */}

        {/* Accordion for DB Connections section */}
        <Accordion defaultExpanded disableGutters sx={{ backgroundColor: '#1e1e1e', color: '#fff' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              DB Connections
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense> {/* Dense list for smaller spacing */}
              {/* Map over the connections array to display each connection */}
              {connections.map((conn) => (
                <ListItem
                  key={conn.connection_id} // Use connection_id (BIGINT PK) as the unique key
                  secondaryAction={
                    // Delete button as secondary action
                    <IconButton edge="end" onClick={(e) => {
                      e.stopPropagation(); // Prevent ListItemButton click when clicking delete
                      // Pass the connection_id (BIGINT PK) to the delete handler
                      handleDeleteClick(conn.connection_id);
                    }}>
                      <DeleteIcon sx={{ color: '#fff', fontSize: '18px' }} />
                    </IconButton>
                  }
                  disablePadding // Remove default padding
                >
                  {/* Button for navigating to the connection view */}
                  <ListItemButton
                    sx={{ px: 2, py: 0.5 }}
                    onClick={() => navigate(`/connection/${conn.connection_id}`)} // Navigate using connection_id
                  >
                    <ListItemText
                      // FIX: Use conn.connection_name to display the connection name
                      primary={conn.connection_name}
                      primaryTypographyProps={{ fontSize: '0.85rem' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {/* Button to add a new database */}
              <ListItem disablePadding>
                <ListItemButton onClick={handleAddNewDatabaseClick} sx={{ px: 2, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}> {/* Adjust icon spacing */}
                    <AddIcon style={{ color: '#fff', fontSize: '18px' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Add New Database"
                    primaryTypographyProps={{ fontSize: '0.85rem' }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
      </Drawer>

      {/* Main content area */}
      <Main open={open}>
        {/* Define routes for different pages */}
        <Routes>
          <Route path="/" element={<Home />} /> {/* Home page */}
          {/* DBConnection page for adding new connections, pass handleConnectionSaved */}
          <Route path="/addnewdatabase" element={<DBConnection onConnectionSaved={handleConnectionSaved} />} />
          {/* DBConnectionView page for viewing/editing a specific connection */}
          <Route path="/connection/:connection_id" element={<DBConnectionView />} />
        </Routes>
      </Main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Connection</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this database connection?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default App;
