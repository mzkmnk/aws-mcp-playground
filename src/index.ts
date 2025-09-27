import { createMcpApp } from './app';

const port = process.env.PORT || 3000;
const { app, setupMCP } = createMcpApp();

// Start server
setupMCP().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`MCP endpoint: http://localhost:${port}/mcp`);
    console.log(`Health check: http://localhost:${port}/health`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on("SIGINT", async () => {
  console.log('Shutting down server...');
  process.exit(0);
});