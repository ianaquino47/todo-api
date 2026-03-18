import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from 'src/mcp/toolHandler';
import { HttpTodoOperations } from 'src/mcp/httpClient';

const server = new McpServer({
  name: 'todo-mcp',
  version: '1.0.0',
});

const operations = new HttpTodoOperations();
registerTools(server, operations);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
