import express, { Application } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerHelloTool } from './tools/hello';

export function createMcpApp(): { app: Application; setupMCP: () => void } {
  const app: Application = express();

  const server = new McpServer({
    name: 'aws-mcp-playground',
    version: '0.0.1'
  });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
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
  app.get('/health', async (req, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: {
        name: 'aws-mcp-playground',
        version: '0.0.1',
        environment: process.env.NODE_ENV || 'development'
      },
      mcp: {
        connected: transport ? true : false,
        sessionType: 'stateless'
      }
    };

    res.json(health);
  });

  // MCP endpoint - GET
  app.get('/mcp', async (req, res) => {
    try {
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('MCP GET request error:', error);
      res.status(500).json({ error: 'MCP request failed' });
    }
  });

  // MCP endpoint - POST
  app.post('/mcp', async (req, res) => {
    try {
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('MCP POST request error:', error);
      res.status(500).json({ error: 'MCP request failed' });
    }
  });

  // Initialize MCP server
  const setupMCP = () => {
    server.connect(transport).then(() => {
      console.log('MCP server connected successfully');
    }).catch((error) => {
      console.error('Failed to setup MCP server:', error);
    })
  };

  return { app, setupMCP };
}
