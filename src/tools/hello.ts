import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

export const registerHelloTool = (server: McpServer) => {
    server.registerTool('hello', {
        title: 'hello tool',
        description: 'hello world',
    }, async () => {
        return {
            content: [{ type: 'text', text: 'Hello' }]
        }
    })
}