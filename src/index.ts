import express, { Application } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerHelloTool } from './tools/hello';

const app: Application = express();
const port = process.env.PORT || 3000;

const server = new McpServer({
  name: 'aws-mcp-playground',
  version: '0.0.1'
})

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined
})


app.use(express.json());

registerHelloTool(server);

app.get('/mcp', async (req, res) => {
  await transport.handleRequest(req, res);
})

// MCP endpoint (placeholder)
app.post('/mcp', async (req, res) => {
  await transport.handleRequest(req, res, req.body);
});

const setupMCP = async () => {
  await server.connect(transport);
}

setupMCP().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`MCP endpoint: http://localhost:${port}/mcp`);
  });
})