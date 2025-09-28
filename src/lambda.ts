import serverlessExpress from '@codegenie/serverless-express';
import { createMcpApp } from './app';

// Create the MCP app
const { app } = createMcpApp();

export const handler = serverlessExpress({ app })
