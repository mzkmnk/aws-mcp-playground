import serverlessExpress from '@codegenie/serverless-express';
import { createMcpApp } from './app';

// Create the MCP app
const { app, setupMCP } = createMcpApp();

// Initialize MCP on cold start
let mcpInitialized = false;

if (!mcpInitialized) {
  setupMCP();
  mcpInitialized = true;
}

export const handler = serverlessExpress({ app });
