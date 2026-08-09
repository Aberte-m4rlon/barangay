// CloudLinux Passenger startup file for Barangay System
// This imports and starts the Express app with Socket.io from index.js

// Load environment variables
require('dotenv/config');

// Import the app (we need to use dynamic import for ES modules)
(async () => {
  try {
    const { default: httpServer } = await import('./index.js');
    
    const PORT = process.env.PORT || 3000;
    
    // Start the server (httpServer includes both Express and Socket.io)
    httpServer.listen(PORT, () => {
      console.log(`🔥 Barangay System running on port ${PORT}`);
    });

    // Handle errors
    httpServer.on('error', (err) => {
      console.error('❌ Server error:', err);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, closing server...');
      httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
})();
