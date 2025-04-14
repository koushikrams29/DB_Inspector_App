import React from 'react';
import Squares from './Squares';
import { Container, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden', fontFamily: 'Roboto, sans-serif' }}>
      {/* Background Squares Animation */}
      <Squares
        speed={0.5}
        squareSize={40}
        direction="diagonal"
        borderColor="#fff"
        hoverFillColor="#222"
      />

      {/* Gradient Overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom right, rgba(0,0,0,0.6), rgba(0,0,0,0.4))',
          zIndex: 1,
        }}
      />

      {/* Overlay Content */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          color: 'white',
          zIndex: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          maxWidth: 700,
          width: '90%',
        }}
      >
        <Container>
          <Box>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                fontSize: { xs: '2rem', md: '3rem' },
                lineHeight: 1.1, // Adjust line height for better spacing
              }}
            >
              DB Inspector
            </Typography>
            <Typography
              variant="h5" // Use a slightly smaller variant for the subheading
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 500, // Adjust font weight for subheading
                fontSize: { xs: '1.3rem', md: '1.8rem' }, // Adjust font size for subheading
                opacity: 0.9,
                marginTop: '-0.5rem', // Adjust margin to bring it closer
              }}
            >
              Visualize Your Data, Clearly Seen.
            </Typography>
          </Box>

          <Typography
            variant="h6"
            component="p" // Changed component to 'p' as it's a further description
            gutterBottom
            sx={{
              opacity: 0.85,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
            }}
          >
            Connect effortlessly, profile deeply, and unlock the story within your databases.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{
              mt: 4,
              fontWeight: 600,
              borderRadius: 3,
              px: 4,
              py: 1.5,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              textTransform: 'none',
            }}
            component={Link}
            to="/addnewdatabase"
          >
            Get Started
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
