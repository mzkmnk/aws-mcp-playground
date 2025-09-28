import { createMcpApp } from './app';

const port = process.env.PORT || 3000;
const { app, setupMCP } = createMcpApp();

setupMCP();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`MCP endpoint: http://localhost:${port}/mcp`);
  console.log(`Health check: http://localhost:${port}/health`);
});

process.on("SIGINT", async () => {
  console.log('Shutting down server...');
  process.exit(0);
});