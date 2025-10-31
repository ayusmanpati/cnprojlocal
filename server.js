/*
 * This is the main entry point for the Node.js application.
 * It creates the HTTP server and integrates the router and WebSocket server.
 */

const http = require("http");
const { requestHandler } = require("./src/router");
const { setupWebSocketServer } = require("./src/chatServer");

const PORT = process.env.PORT || 3000;

// Create the core HTTP server
const server = http.createServer(requestHandler);

// Set up the WebSocket server and attach it to the HTTP server
// This is where the core Readers-Writers logic will live.
setupWebSocketServer(server);

// Start listening
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
