import serverlessExpress from '@codegenie/serverless-express';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, Callback } from 'aws-lambda';
import { createMcpApp } from './app';

// Create the MCP app
const { app, setupMCP } = createMcpApp();

// Create serverless express handler
const serverlessExpressHandler = serverlessExpress({ app });

// Initialize MCP on cold start
let mcpInitialized = false;

export const handler = async (
  event: APIGatewayProxyEvent, 
  context: Context,
  callback?: Callback<APIGatewayProxyResult>
) => {
  if (!mcpInitialized) {
    await setupMCP();
    mcpInitialized = true;
  }

  return serverlessExpressHandler(event, context, callback as any);
}
