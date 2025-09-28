import express, { Application } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerHelloTool } from './tools/hello';

export function createMcpApp(): { app: Application } {
  const app: Application = express();

  const server = new McpServer({
    name: 'aws-mcp-playground',
    version: '0.0.1'
  });

  // Register MCP tools
  registerHelloTool(server);

  // Middleware
  app.use(express.json());

  // CORS設定
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Health check endpoint
  app.get('/health', async (_, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: {
        name: 'aws-mcp-playground',
        version: '0.0.1',
        environment: process.env.NODE_ENV || 'development'
      },
      mcp: {
        sessionType: 'stateless'
      }
    };

    res.json(health);
  });

  // MCP endpoint - GET
  app.get('/mcp', async (req, res) => {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    await server.connect(transport);

    await transport.handleRequest(req, res);
  });

  // MCP endpoint - POST
  app.post('/mcp', async (req, res) => {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    await server.connect(transport);

    await transport.handleRequest(req, res, req.body);
  });

  return { app };
}
