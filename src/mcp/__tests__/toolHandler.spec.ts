import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { registerTools } from 'src/mcp/toolHandler';
import { FakeTodoOperations } from 'src/tests/fakes/fakeTodoOperations';
import type { ITodo } from 'src/domain/todo';

let server: McpServer;
let client: Client;
let fakeOps: FakeTodoOperations;

beforeEach(async () => {
  fakeOps = new FakeTodoOperations();
  server = new McpServer({ name: 'test-todo-mcp', version: '1.0.0' });
  registerTools(server, fakeOps);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);

  client = new Client({ name: 'test-client', version: '1.0.0' });
  await client.connect(clientTransport);
});

afterEach(() => {
  fakeOps.clear();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTextContent(result: any): string {
  const textBlock = result.content?.find((c: any) => c.type === 'text');
  return textBlock?.text ?? '';
}

describe('MCP tool handler', () => {
  describe('list_todos', () => {
    it('should return empty message when no todos exist', async () => {
      const result = await client.callTool({ name: 'list_todos', arguments: {} });

      expect(getTextContent(result)).toBe('No TODO items found.');
    });

    it('should return all todos when todos exist', async () => {
      const todos: ITodo[] = [
        { id: 'todo-1', title: 'First', completed: false, createdAt: '2026-03-17T00:00:00.000Z' },
        { id: 'todo-2', title: 'Second', completed: true, createdAt: '2026-03-17T01:00:00.000Z' },
      ];
      fakeOps.seed(todos);

      const result = await client.callTool({ name: 'list_todos', arguments: {} });
      const text = getTextContent(result);

      expect(text).toContain('[ ] First (id: todo-1)');
      expect(text).toContain('[x] Second (id: todo-2)');
    });
  });

  describe('add_todo', () => {
    it('should create a todo and return confirmation', async () => {
      const result = await client.callTool({ name: 'add_todo', arguments: { title: 'Buy milk' } });
      const text = getTextContent(result);

      expect(text).toContain('Created TODO: Buy milk');
      expect(text).toContain('(id:');

      const todos = await fakeOps.listTodos();
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Buy milk');
    });
  });

  describe('update_todo', () => {
    it('should update the title and return confirmation', async () => {
      fakeOps.seed([
        { id: 'todo-1', title: 'Old title', completed: false, createdAt: '2026-03-17T00:00:00.000Z' },
      ]);

      const result = await client.callTool({
        name: 'update_todo',
        arguments: { id: 'todo-1', title: 'New title' },
      });

      expect(getTextContent(result)).toContain('Updated TODO: New title');
    });

    it('should return an error when the todo does not exist', async () => {
      const result = await client.callTool({
        name: 'update_todo',
        arguments: { id: 'non-existent', title: 'New title' },
      });

      expect(getTextContent(result)).toContain('not found');
      expect(result.isError).toBe(true);
    });
  });

  describe('complete_todo', () => {
    it('should mark the todo as completed', async () => {
      fakeOps.seed([
        { id: 'todo-1', title: 'Do laundry', completed: false, createdAt: '2026-03-17T00:00:00.000Z' },
      ]);

      const result = await client.callTool({
        name: 'complete_todo',
        arguments: { id: 'todo-1' },
      });

      expect(getTextContent(result)).toContain('Completed TODO: Do laundry');

      const todos = await fakeOps.listTodos();
      expect(todos[0].completed).toBe(true);
    });

    it('should return an error when the todo does not exist', async () => {
      const result = await client.callTool({
        name: 'complete_todo',
        arguments: { id: 'non-existent' },
      });

      expect(getTextContent(result)).toContain('not found');
      expect(result.isError).toBe(true);
    });
  });

  describe('delete_todo', () => {
    it('should remove the todo and return confirmation', async () => {
      fakeOps.seed([
        { id: 'todo-1', title: 'To delete', completed: false, createdAt: '2026-03-17T00:00:00.000Z' },
      ]);

      const result = await client.callTool({
        name: 'delete_todo',
        arguments: { id: 'todo-1' },
      });

      expect(getTextContent(result)).toContain('Deleted TODO with id "todo-1"');

      const todos = await fakeOps.listTodos();
      expect(todos).toHaveLength(0);
    });
  });
});
