import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import serverlessExpress from '@codegenie/serverless-express';
import { createMcpApp } from './app';

// Create the MCP app
const { app, setupMCP } = createMcpApp();

// Initialize MCP on cold start
let mcpInitialized = false;

// Lambda handler
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Initialize MCP server on first invocation (cold start)
  if (!mcpInitialized) {
    await setupMCP();
    mcpInitialized = true;
  }

  // Use serverless-express to handle the request
  return new Promise((resolve, reject) => {
    const handler = serverlessExpress({ app });
    handler(event, context, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};
