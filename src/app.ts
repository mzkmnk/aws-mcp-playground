import express, { Application } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerHelloTool } from './tools/hello';
import { randomUUID } from 'crypto';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

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

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Mcp-Session-Id');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Expose-Headers', 'Mcp-Session-Id');
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
    };

    res.json(health);
  });

  app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    try {
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId) => {
            console.log(`Session initialized with ID: ${sessionId}`);
            transports[sessionId] = transport;
          }
        });

        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            delete transports[sid];
          }
        };

        await server.connect(transport);
      } else {
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
      }
      console.log(req.body);
      console.log('------');

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('MCP POST request error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  app.get('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !transports[sessionId]) {
      return res.status(400).send('Invalid or missing session ID');
    }

    try {
      const transport = transports[sessionId];
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('MCP GET request error:', error);
      if (!res.headersSent) {
        res.status(500).send('Error processing SSE request');
      }
    }
  });

  app.delete('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !transports[sessionId]) {
      return res.status(400).send('Invalid or missing session ID');
    }

    try {
      const transport = transports[sessionId];
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('MCP DELETE request error:', error);
      if (!res.headersSent) {
        res.status(500).send('Error processing session termination');
      }
    }
  });

  return { app };
}
